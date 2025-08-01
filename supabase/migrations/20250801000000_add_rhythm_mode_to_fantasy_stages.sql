-- Add rhythm mode columns to fantasy_stages table
ALTER TABLE fantasy_stages
  ADD COLUMN IF NOT EXISTS mp3_url VARCHAR,
  ADD COLUMN IF NOT EXISTS bpm INTEGER CHECK (bpm > 0),
  ADD COLUMN IF NOT EXISTS measure_count INTEGER CHECK (measure_count > 0),
  ADD COLUMN IF NOT EXISTS time_signature INTEGER DEFAULT 4 CHECK (time_signature > 0),
  ADD COLUMN IF NOT EXISTS count_in_measures INTEGER DEFAULT 1 CHECK (count_in_measures >= 0),
  ADD COLUMN IF NOT EXISTS chord_progression_data JSONB;

-- Update mode check constraint to include 'rhythm'
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;
ALTER TABLE fantasy_stages ADD CONSTRAINT fantasy_stages_mode_check 
  CHECK (mode IN ('single', 'progression', 'rhythm'));

-- Add comments
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'BGM MP3ファイルのURL';
COMMENT ON COLUMN fantasy_stages.bpm IS 'BPM (Beats Per Minute)';
COMMENT ON COLUMN fantasy_stages.measure_count IS '小節数';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';