-- Add BGM and timing columns to fantasy_stages table
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS mp3_url VARCHAR,
ADD COLUMN IF NOT EXISTS bpm INTEGER,
ADD COLUMN IF NOT EXISTS measure_count INTEGER,
ADD COLUMN IF NOT EXISTS time_signature VARCHAR(10) DEFAULT '4/4' NOT NULL,
ADD COLUMN IF NOT EXISTS count_in_measures INTEGER DEFAULT 2 NOT NULL;

-- Add comments for new columns
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'BGMファイルのURL';
COMMENT ON COLUMN fantasy_stages.bpm IS 'BGMのBPM（Beats Per Minute）';
COMMENT ON COLUMN fantasy_stages.measure_count IS '楽曲の小節数';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子記号（例: 4/4, 3/4）';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数（ループ開始位置）';