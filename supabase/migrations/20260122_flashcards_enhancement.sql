-- ============================================================================
-- Migration: Enhance Flashcards for Document-Based Learning & Rephrasing
-- Created: 2026-01-22
-- Purpose: Connect cards to documents, enable question rephrasing, track history
-- ============================================================================

-- NOTE: This migration is ADDITIVE ONLY - no breaking changes
-- Existing data is preserved and backward compatible

-- ============================================================================
-- 1. ENHANCE CARDS TABLE - Add Document/Topic Linking
-- ============================================================================

-- Add new columns to existing cards table (all nullable for backward compatibility)
ALTER TABLE public.cards 
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES public.documents(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS topic_id text,
  ADD COLUMN IF NOT EXISTS topic_label text,
  ADD COLUMN IF NOT EXISTS original_question text,
  ADD COLUMN IF NOT EXISTS source_chunks uuid[],
  ADD COLUMN IF NOT EXISTS hint text,
  ADD COLUMN IF NOT EXISTS card_difficulty text CHECK (card_difficulty IN ('easy', 'medium', 'hard'));

-- Backfill original_question from front for existing cards
UPDATE public.cards 
SET original_question = front 
WHERE original_question IS NULL AND front IS NOT NULL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_cards_document ON public.cards(document_id);
CREATE INDEX IF NOT EXISTS idx_cards_document_topic ON public.cards(document_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_cards_topic ON public.cards(topic_id);

-- Add comment for documentation
COMMENT ON COLUMN public.cards.document_id IS 'Links card to source PDF document';
COMMENT ON COLUMN public.cards.topic_id IS 'ID of concept node from topic tree';
COMMENT ON COLUMN public.cards.topic_label IS 'Human-readable topic name';
COMMENT ON COLUMN public.cards.original_question IS 'Base question for rephrasing variants';
COMMENT ON COLUMN public.cards.source_chunks IS 'Array of document_chunk IDs used to generate this card';
COMMENT ON COLUMN public.cards.hint IS 'Optional hint for the question';
COMMENT ON COLUMN public.cards.card_difficulty IS 'AI-assigned difficulty level';

-- ============================================================================
-- 2. CREATE CARD REVIEWS TABLE - Track Every Review Attempt
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.card_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid NOT NULL REFERENCES public.cards(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- What question variant was shown (rephrased version)
  question_variant text NOT NULL,
  
  -- User response
  user_answer text,
  rating int CHECK (rating IN (1, 2, 3, 4)),  -- 1=Again, 2=Hard, 3=Good, 4=Easy
  response_time_ms int,
  
  -- AI grading result (optional, from StudyView)
  ai_grade jsonb,
  
  -- Metadata
  reviewed_at timestamptz DEFAULT now(),
  
  -- For analytics
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_card_reviews_card ON public.card_reviews(card_id);
CREATE INDEX IF NOT EXISTS idx_card_reviews_user_date ON public.card_reviews(user_id, reviewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_card_reviews_card_date ON public.card_reviews(card_id, reviewed_at DESC);

-- Enable RLS
ALTER TABLE public.card_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own reviews
CREATE POLICY "Users can manage their own card reviews"
  ON public.card_reviews
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.card_reviews IS 'Tracks every flashcard review attempt with rephrased questions';
COMMENT ON COLUMN public.card_reviews.question_variant IS 'The specific rephrased version shown to user';
COMMENT ON COLUMN public.card_reviews.rating IS '1=Again, 2=Hard, 3=Good, 4=Easy (FSRS ratings)';
COMMENT ON COLUMN public.card_reviews.ai_grade IS 'Optional AI grading result from StudyView';

-- ============================================================================
-- 3. ADD MIGRATION FLAG TO DECKS TABLE
-- ============================================================================

-- Add flag to track which decks have been migrated from JSONB to normalized cards
ALTER TABLE public.decks 
  ADD COLUMN IF NOT EXISTS cards_migrated boolean DEFAULT false;

COMMENT ON COLUMN public.decks.cards_migrated IS 'True if cards have been migrated from JSONB to cards table';

-- ============================================================================
-- 4. CREATE HELPER FUNCTION - Get Due Cards for Review
-- ============================================================================

CREATE OR REPLACE FUNCTION get_due_cards_for_review(
  p_user_id uuid,
  p_document_id uuid DEFAULT NULL,
  p_topic_id text DEFAULT NULL,
  p_limit int DEFAULT 10
)
RETURNS TABLE (
  card_id uuid,
  original_question text,
  current_question text,
  answer text,
  hint text,
  difficulty text,
  document_id uuid,
  document_title text,
  topic_id text,
  topic_label text,
  times_reviewed int,
  last_rephrased text,
  due_date timestamptz,
  stability double precision,
  card_difficulty double precision,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as card_id,
    COALESCE(c.original_question, c.front) as original_question,
    c.front as current_question,
    c.back as answer,
    c.hint,
    c.card_difficulty as difficulty,
    c.document_id,
    d.title as document_title,
    c.topic_id,
    c.topic_label,
    c.review_count as times_reviewed,
    (
      SELECT cr.question_variant 
      FROM card_reviews cr 
      WHERE cr.card_id = c.id 
      ORDER BY cr.reviewed_at DESC 
      LIMIT 1
    ) as last_rephrased,
    c.due_date,
    c.stability,
    c.difficulty as card_difficulty,
    c.status
  FROM cards c
  LEFT JOIN documents d ON d.id = c.document_id
  WHERE 
    c.user_id = p_user_id
    AND (c.due_date IS NULL OR c.due_date <= now())
    AND (p_document_id IS NULL OR c.document_id = p_document_id)
    AND (p_topic_id IS NULL OR c.topic_id = p_topic_id)
  ORDER BY 
    -- Prioritize new cards, then by due date
    CASE WHEN c.status = 'new' THEN 0 ELSE 1 END,
    c.due_date ASC NULLS FIRST
  LIMIT p_limit;
END;
$$;

GRANT EXECUTE ON FUNCTION get_due_cards_for_review TO authenticated;

COMMENT ON FUNCTION get_due_cards_for_review IS 'Fetches due flashcards for review with metadata for rephrasing';

-- ============================================================================
-- 5. CREATE ANALYTICS HELPER FUNCTIONS
-- ============================================================================

-- Get card statistics per document
CREATE OR REPLACE FUNCTION get_document_card_stats(p_user_id uuid)
RETURNS TABLE (
  document_id uuid,
  document_title text,
  total_cards bigint,
  new_cards bigint,
  learning_cards bigint,
  review_cards bigint,
  mastered_cards bigint,
  due_cards bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    d.id as document_id,
    d.title as document_title,
    COUNT(c.id) as total_cards,
    COUNT(c.id) FILTER (WHERE c.status = 'new') as new_cards,
    COUNT(c.id) FILTER (WHERE c.status = 'learning') as learning_cards,
    COUNT(c.id) FILTER (WHERE c.status = 'review') as review_cards,
    COUNT(c.id) FILTER (WHERE c.status = 'mastered') as mastered_cards,
    COUNT(c.id) FILTER (WHERE c.due_date IS NOT NULL AND c.due_date <= now()) as due_cards
  FROM documents d
  LEFT JOIN cards c ON c.document_id = d.id AND c.user_id = p_user_id
  WHERE d.user_id = p_user_id
  GROUP BY d.id, d.title
  ORDER BY d.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_document_card_stats TO authenticated;

-- Get topic performance analytics
CREATE OR REPLACE FUNCTION get_topic_performance(p_user_id uuid, p_document_id uuid DEFAULT NULL)
RETURNS TABLE (
  topic_label text,
  total_reviews bigint,
  avg_rating numeric,
  avg_response_time_sec numeric,
  last_reviewed timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.topic_label,
    COUNT(cr.id) as total_reviews,
    ROUND(AVG(cr.rating)::numeric, 2) as avg_rating,
    ROUND((AVG(cr.response_time_ms) / 1000.0)::numeric, 1) as avg_response_time_sec,
    MAX(cr.reviewed_at) as last_reviewed
  FROM cards c
  JOIN card_reviews cr ON cr.card_id = c.id
  WHERE 
    c.user_id = p_user_id
    AND c.topic_label IS NOT NULL
    AND (p_document_id IS NULL OR c.document_id = p_document_id)
  GROUP BY c.topic_label
  ORDER BY avg_rating ASC, total_reviews DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_topic_performance TO authenticated;

-- ============================================================================
-- 6. VERIFICATION QUERIES (Run these after migration)
-- ============================================================================

-- Check if new columns exist
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
-- AND table_name = 'cards'
-- AND column_name IN ('document_id', 'topic_id', 'original_question', 'source_chunks', 'hint', 'card_difficulty')
-- ORDER BY ordinal_position;

-- Check if card_reviews table exists
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' AND table_name = 'card_reviews';

-- Check if functions exist
-- SELECT routine_name FROM information_schema.routines 
-- WHERE routine_schema = 'public' 
-- AND routine_name IN ('get_due_cards_for_review', 'get_document_card_stats', 'get_topic_performance');

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- ✅ Added 7 new columns to cards table (backward compatible)
-- ✅ Created card_reviews table for history tracking
-- ✅ Added indexes for performance
-- ✅ Created 3 helper functions for queries
-- ✅ All changes are non-breaking (existing data preserved)

-- Next steps:
-- 1. Update /api/generate-flashcards to save cards with document_id
-- 2. Create /api/review endpoints with rephrasing logic
-- 3. Update frontend to use new endpoints
