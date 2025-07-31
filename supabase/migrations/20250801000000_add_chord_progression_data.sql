-- Add chord_progression_data column to fantasy_stages table for rhythm mode
ALTER TABLE fantasy_stages
ADD COLUMN chord_progression_data jsonb DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';

-- Update mode enum to include 'rhythm'
-- First, check if the constraint exists and drop it if necessary
DO $$
BEGIN
    -- Check if the constraint exists
    IF EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'fantasy_stages_mode_check'
        AND table_name = 'fantasy_stages'
    ) THEN
        ALTER TABLE fantasy_stages DROP CONSTRAINT fantasy_stages_mode_check;
    END IF;
END $$;

-- Add new constraint with rhythm mode
ALTER TABLE fantasy_stages
ADD CONSTRAINT fantasy_stages_mode_check
CHECK (mode IN ('single', 'progression', 'rhythm'));