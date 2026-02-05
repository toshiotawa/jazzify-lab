-- サバイバルモード難易度設定にBGMカラムを追加
-- 奇数WAVEと偶数WAVEで別々のBGMを設定可能

-- BGMカラムを追加
ALTER TABLE survival_difficulty_settings
ADD COLUMN IF NOT EXISTS bgm_odd_wave_url text,
ADD COLUMN IF NOT EXISTS bgm_even_wave_url text;

-- コメント追加
COMMENT ON COLUMN survival_difficulty_settings.bgm_odd_wave_url IS 'BGM URL for odd waves (1, 3, 5...)';
COMMENT ON COLUMN survival_difficulty_settings.bgm_even_wave_url IS 'BGM URL for even waves (2, 4, 6...)';
