-- Update mode check to allow extended progression modes
-- Created at: 2025-08-17

BEGIN;

-- Drop existing mode check constraint if present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fantasy_stages_mode_check'
  ) THEN
    ALTER TABLE public.fantasy_stages
      DROP CONSTRAINT fantasy_stages_mode_check;
  END IF;
END $$;

-- Add relaxed/extended check constraint
ALTER TABLE public.fantasy_stages
  ADD CONSTRAINT fantasy_stages_mode_check
  CHECK (mode IN (
    'single',
    'progression',
    'progression_order',
    'progression_random',
    'progression_timing'
  ));

COMMIT;