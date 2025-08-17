-- Update unique constraint on fantasy_stages to (stage_tier, stage_number)
-- and adjust indexes accordingly
-- Created at: 2025-08-17

BEGIN;

-- Drop old unique constraint on stage_number if exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'fantasy_stages_stage_number_key'
  ) THEN
    ALTER TABLE public.fantasy_stages
      DROP CONSTRAINT fantasy_stages_stage_number_key;
  END IF;
END $$;

-- Drop old index on stage_number if exists
DROP INDEX IF EXISTS public.fantasy_stages_stage_number_idx;

-- Create new unique constraint on (stage_tier, stage_number)
ALTER TABLE public.fantasy_stages
  ADD CONSTRAINT fantasy_stages_tier_stage_number_key UNIQUE (stage_tier, stage_number);

-- Create composite index to help ordering/filtering by tier+stage
CREATE INDEX IF NOT EXISTS fantasy_stages_tier_stage_idx
  ON public.fantasy_stages (stage_tier, stage_number);

COMMIT;