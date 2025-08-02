-- Add BGM-related columns to fantasy_stages table
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS mp3_url varchar,
ADD COLUMN IF NOT EXISTS bpm integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS measure_count integer DEFAULT 8,
ADD COLUMN IF NOT EXISTS time_signature integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS count_in_measures integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS chord_progression_data jsonb;

-- Add comments
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'BGMファイルのURL';
COMMENT ON COLUMN fantasy_stages.bpm IS 'BPM (Beats Per Minute)';
COMMENT ON COLUMN fantasy_stages.measure_count IS '小節数';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';