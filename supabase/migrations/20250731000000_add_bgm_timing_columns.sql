-- Add BGM timing columns to fantasy_stages table
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS beats_per_measure INTEGER DEFAULT 4 CHECK (beats_per_measure BETWEEN 1 AND 16),
ADD COLUMN IF NOT EXISTS count_in_measures INTEGER DEFAULT 2 CHECK (count_in_measures BETWEEN 0 AND 8);

-- Add comments for documentation
COMMENT ON COLUMN fantasy_stages.beats_per_measure IS '拍子 (1-16) - デフォルト: 4拍子';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数 (0-8) - ループ開始位置を決定';

-- Update existing rows with default values
UPDATE fantasy_stages
SET beats_per_measure = 4,
    count_in_measures = 2
WHERE beats_per_measure IS NULL OR count_in_measures IS NULL;