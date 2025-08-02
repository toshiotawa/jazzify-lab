-- Add rhythm mode columns to fantasy_stages table
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS bpm INTEGER DEFAULT 120 CHECK (bpm > 0 AND bpm <= 300),
ADD COLUMN IF NOT EXISTS measure_count INTEGER DEFAULT 8 CHECK (measure_count > 0 AND measure_count <= 64),
ADD COLUMN IF NOT EXISTS time_signature INTEGER DEFAULT 4 CHECK (time_signature > 0 AND time_signature <= 16),
ADD COLUMN IF NOT EXISTS count_in_measures INTEGER DEFAULT 1 CHECK (count_in_measures >= 0 AND count_in_measures <= 4),
ADD COLUMN IF NOT EXISTS mp3_url VARCHAR,
ADD COLUMN IF NOT EXISTS chord_progression_data JSONB;

-- Update mode check constraint to include rhythm mode
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;
ALTER TABLE fantasy_stages ADD CONSTRAINT fantasy_stages_mode_check 
CHECK (mode IN ('single', 'progression', 'rhythm'));

-- Add comments
COMMENT ON COLUMN fantasy_stages.bpm IS 'BPM (Beats Per Minute)';
COMMENT ON COLUMN fantasy_stages.measure_count IS '小節数';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'BGMファイルのURL';
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';