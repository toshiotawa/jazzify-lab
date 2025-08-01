-- Add rhythm mode columns to fantasy_stages table
ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS measure_count integer DEFAULT 8,
ADD COLUMN IF NOT EXISTS bpm integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS mp3_url varchar,
ADD COLUMN IF NOT EXISTS time_signature integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS count_in_measures integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS chord_progression_data jsonb;

-- Add comments for new columns
COMMENT ON COLUMN public.fantasy_stages.measure_count IS '小節数';
COMMENT ON COLUMN public.fantasy_stages.bpm IS 'BPM (Beats Per Minute)';
COMMENT ON COLUMN public.fantasy_stages.mp3_url IS 'MP3ファイルのURL';
COMMENT ON COLUMN public.fantasy_stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN public.fantasy_stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';
COMMENT ON COLUMN public.fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';

-- Add check constraint for time_signature
ALTER TABLE public.fantasy_stages
ADD CONSTRAINT fantasy_stages_time_signature_check CHECK (time_signature IN (3, 4));

-- Update mode column to support 'rhythm' mode
ALTER TABLE public.fantasy_stages
DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

ALTER TABLE public.fantasy_stages
ADD CONSTRAINT fantasy_stages_mode_check CHECK (mode IN ('single', 'progression', 'rhythm'));