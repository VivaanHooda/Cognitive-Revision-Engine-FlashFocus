-- Migration: normalize cards out of decks.cards JSON into public.cards table
-- Safe / idempotent script. Run in Supabase SQL editor or psql.

-- 1) Ensure UUID generator available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Create cards table
CREATE TABLE IF NOT EXISTS public.cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id uuid NOT NULL REFERENCES public.decks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  front text NOT NULL,
  back text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  ease_factor double precision,
  stability double precision,
  difficulty double precision,
  interval integer,
  review_count integer DEFAULT 0,
  due_date timestamptz,
  last_reviewed timestamptz,
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cards_user_due ON public.cards (user_id, due_date);

-- Enable RLS and policy for cards
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

-- Replace any existing policy with a safe policy for per-user access
DROP POLICY IF EXISTS "Users can manage their own cards" ON public.cards;
CREATE POLICY "Users can manage their own cards"
  ON public.cards
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

-- Trigger to keep updated_at current
CREATE OR REPLACE FUNCTION set_updated_at_cards()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cards_updated_at ON public.cards;
CREATE TRIGGER trg_cards_updated_at
  BEFORE UPDATE ON public.cards
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_cards();

-- 3) Insert normalized card rows from decks.cards (idempotent)
-- This handles numeric/stamp coercion and uses existing card.id when present
INSERT INTO public.cards (
  id, deck_id, user_id, front, back, status,
  ease_factor, stability, difficulty, interval, review_count,
  due_date, last_reviewed, meta, created_at, updated_at
)
SELECT
  COALESCE(NULLIF(card->>'id','')::uuid, gen_random_uuid()) AS id,
  d.id AS deck_id,
  d.user_id,
  card->>'front' AS front,
  card->>'back' AS back,
  COALESCE(card->>'status', 'new') AS status,
  NULLIF(card->>'easeFactor','')::double precision AS ease_factor,
  NULLIF(card->>'stability','')::double precision AS stability,
  NULLIF(card->>'difficulty','')::double precision AS difficulty,
  NULLIF(card->>'interval','')::integer AS interval,
  COALESCE(NULLIF(card->>'reviewCount','')::integer, NULLIF(card->>'review_count','')::integer, 0) AS review_count,
  (CASE
     WHEN card->>'dueDate' ~ '^[0-9]+$' THEN to_timestamp((card->>'dueDate')::double precision / 1000)
     WHEN NULLIF(card->>'dueDate','') IS NOT NULL THEN (card->>'dueDate')::timestamptz
     ELSE NULL
   END) AS due_date,
  (CASE
     WHEN card->>'lastReviewed' ~ '^[0-9]+$' THEN to_timestamp((card->>'lastReviewed')::double precision / 1000)
     WHEN NULLIF(card->>'lastReviewed','') IS NOT NULL THEN (card->>'lastReviewed')::timestamptz
     ELSE NULL
   END) AS last_reviewed,
  COALESCE(card->'meta', card - 'id' - 'front' - 'back' - 'status' - 'easeFactor' - 'ease_factor' - 'stability' - 'difficulty' - 'interval' - 'reviewCount' - 'review_count' - 'dueDate' - 'lastReviewed') AS meta,
  d.created_at,
  d.updated_at
FROM public.decks d
  JOIN LATERAL jsonb_array_elements(d.cards) AS t(card) ON TRUE
ON CONFLICT (id) DO NOTHING;

-- 4) Verification helpers (run interactively after the INSERT)
-- SELECT SUM(COALESCE(jsonb_array_length(cards), 0)) AS expected_card_count FROM public.decks;
-- SELECT COUNT(*) AS inserted_card_count FROM public.cards;
-- SELECT d.id AS deck_id, card FROM public.decks d, jsonb_array_elements(d.cards) AS t(card)
-- WHERE (card->>'easeFactor') IS NOT NULL AND (card->>'easeFactor') !~ '^[+-]?[0-9]+(\.[0-9]+)?$' LIMIT 20;

-- 5) Backup original decks.cards column (safe rollback) — only if the column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'decks' AND column_name = 'cards'
  ) THEN
    -- Rename to keep as backup for now
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'decks' AND column_name = 'cards_jsonb_backup'
    ) THEN
      ALTER TABLE public.decks RENAME COLUMN cards TO cards_jsonb_backup;
    END IF;
  END IF;
END$$;

-- 6) Per-user SRS params table (idempotent)
CREATE TABLE IF NOT EXISTS public.srs_params (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  params jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_srs_params_user_id ON public.srs_params (user_id);

ALTER TABLE public.srs_params ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own SRS params" ON public.srs_params;
CREATE POLICY "Users can manage their own SRS params"
  ON public.srs_params
  USING ( auth.uid() = user_id )
  WITH CHECK ( auth.uid() = user_id );

CREATE OR REPLACE FUNCTION set_updated_at_srs()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_srs_params_updated_at ON public.srs_params;
CREATE TRIGGER trg_srs_params_updated_at
  BEFORE UPDATE ON public.srs_params
  FOR EACH ROW EXECUTE PROCEDURE set_updated_at_srs();

-- Done. After running, verify counts and sample cards; when satisfied you may drop the backup column:
-- ALTER TABLE public.decks DROP COLUMN IF EXISTS cards_jsonb_backup;
