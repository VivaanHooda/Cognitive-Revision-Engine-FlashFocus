-- ============================================================================
-- Migration: Add Starred Decks, Bookmarked Cards, and Category Ordering
-- Created: 2026-01-21
-- Purpose: Allow users to star decks, bookmark cards, and reorder categories
-- ============================================================================

-- Add starred field to decks table
ALTER TABLE public.decks 
  ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS category_order integer DEFAULT 0;

-- Add bookmarked field to cards table
ALTER TABLE public.cards 
  ADD COLUMN IF NOT EXISTS is_bookmarked boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS bookmarked_at timestamptz;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_decks_starred ON public.decks(user_id, is_starred) WHERE is_starred = true;
CREATE INDEX IF NOT EXISTS idx_cards_bookmarked ON public.cards(user_id, is_bookmarked) WHERE is_bookmarked = true;
CREATE INDEX IF NOT EXISTS idx_decks_category_order ON public.decks(user_id, parent_topic, category_order);

-- Comments for documentation
COMMENT ON COLUMN public.decks.is_starred IS 'Whether user has starred/favorited this deck';
COMMENT ON COLUMN public.decks.category_order IS 'Order of category in user''s list (lower = first)';
COMMENT ON COLUMN public.cards.is_bookmarked IS 'Whether user has bookmarked this card for later review';
COMMENT ON COLUMN public.cards.bookmarked_at IS 'Timestamp when card was bookmarked';
