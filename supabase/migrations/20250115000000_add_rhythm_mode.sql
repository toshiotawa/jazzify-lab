-- Add rhythm mode support to fantasy_stages
BEGIN;

-- Drop the existing mode constraint
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

-- Add new mode constraint including 'rhythm'
ALTER TABLE fantasy_stages ADD CONSTRAINT fantasy_stages_mode_check 
  CHECK (mode = ANY (ARRAY['single'::text, 'progression'::text, 'rhythm'::text]));

-- Add chord_progression_data column for rhythm mode
ALTER TABLE fantasy_stages 
  ADD COLUMN IF NOT EXISTS chord_progression_data jsonb;

-- Add comment for the new column
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'Rhythm mode: NULL for random pattern, JSON array for progression pattern';

-- Update the mode column comment
COMMENT ON COLUMN fantasy_stages.mode IS 'single: 単一コードモード, progression: コード進行モード, rhythm: リズムモード';

COMMIT;