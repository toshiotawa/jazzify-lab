-- Add timing_combining mode to fantasy_stages
BEGIN;

-- Drop existing mode check constraint
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

-- Add updated check constraint with timing_combining
ALTER TABLE public.fantasy_stages
  ADD CONSTRAINT fantasy_stages_mode_check
  CHECK (mode IN (
    'single',
    'progression',
    'progression_order',
    'progression_random',
    'progression_timing',
    'timing_combining'
  ));

-- Add combined_stage_ids column (JSONB array of stage UUIDs, ordered)
ALTER TABLE public.fantasy_stages
  ADD COLUMN IF NOT EXISTS combined_stage_ids JSONB DEFAULT NULL;

COMMENT ON COLUMN public.fantasy_stages.combined_stage_ids IS 
'timing_combining モード用: 結合する progression_timing ステージIDの順序付き配列';

COMMIT;
