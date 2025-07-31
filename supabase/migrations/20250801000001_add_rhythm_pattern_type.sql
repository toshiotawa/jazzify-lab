-- Add rhythm_pattern_type column to fantasy_stages table
ALTER TABLE fantasy_stages
ADD COLUMN rhythm_pattern_type text DEFAULT NULL;

-- Add constraint for rhythm_pattern_type values
ALTER TABLE fantasy_stages
ADD CONSTRAINT fantasy_stages_rhythm_pattern_type_check
CHECK (rhythm_pattern_type IS NULL OR rhythm_pattern_type IN ('random', 'progression'));

-- Add comment
COMMENT ON COLUMN fantasy_stages.rhythm_pattern_type IS 'リズムモードのパターンタイプ (random: ランダム, progression: プログレッション)';

-- Update existing rhythm mode stages to have appropriate pattern type based on chord_progression_data
UPDATE fantasy_stages
SET rhythm_pattern_type = CASE
    WHEN mode = 'rhythm' AND chord_progression_data IS NOT NULL THEN 'progression'
    WHEN mode = 'rhythm' AND chord_progression_data IS NULL THEN 'random'
    ELSE NULL
END
WHERE mode = 'rhythm';