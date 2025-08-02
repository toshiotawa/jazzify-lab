-- Add rhythm mode support to fantasy_stages table

-- First, drop the existing mode constraint
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

-- Add new mode constraint including 'quiz' and 'rhythm'
-- 'single' and 'progression' will be mapped to 'quiz' for backward compatibility
ALTER TABLE fantasy_stages 
ADD CONSTRAINT fantasy_stages_mode_check 
CHECK (mode = ANY (ARRAY['single'::text, 'progression'::text, 'quiz'::text, 'rhythm'::text]));

-- Update existing modes to 'quiz' for backward compatibility
UPDATE fantasy_stages 
SET mode = 'quiz' 
WHERE mode IN ('single', 'progression');

-- Update the column comment to reflect new modes
COMMENT ON COLUMN fantasy_stages.mode IS 'quiz: クイズモード（旧single/progression）, rhythm: リズムモード';

-- Add chord_progression_data column for rhythm mode progression pattern
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS chord_progression_data JSONB DEFAULT NULL;

COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ（NULL: ランダム、JSONB: 進行パターン）';