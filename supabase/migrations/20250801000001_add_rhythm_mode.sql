-- Add rhythm mode support to fantasy_stages table

-- 1. First add the new columns
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS mp3_url varchar,
ADD COLUMN IF NOT EXISTS bpm integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS time_signature integer DEFAULT 4 CHECK (time_signature > 0 AND time_signature <= 16),
ADD COLUMN IF NOT EXISTS count_in_measures integer DEFAULT 1 CHECK (count_in_measures >= 0),
ADD COLUMN IF NOT EXISTS chord_progression_data jsonb;

-- 2. Add comments for new columns
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'MP3ファイルのURL（リズムモード用）';
COMMENT ON COLUMN fantasy_stages.bpm IS 'BPM（テンポ）';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';

-- 3. Remove old mode constraint
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

-- 4. Update existing mode values: single/progression -> quiz
UPDATE fantasy_stages 
SET mode = 'quiz' 
WHERE mode IN ('single', 'progression');

-- 5. Add new mode constraint with quiz/rhythm
ALTER TABLE fantasy_stages 
ADD CONSTRAINT fantasy_stages_mode_check 
CHECK (mode IN ('quiz', 'rhythm'));

-- 6. Update the mode column comment
COMMENT ON COLUMN fantasy_stages.mode IS 'ステージモード: quiz(クイズモード) | rhythm(リズムモード)';

-- 7. Add measure_count if it doesn't exist (seems to be missing from schema)
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS measure_count integer DEFAULT 8 CHECK (measure_count > 0);

COMMENT ON COLUMN fantasy_stages.measure_count IS '小節数';

-- 8. Add sample rhythm mode stage
INSERT INTO fantasy_stages (
  stage_number, 
  name, 
  description, 
  max_hp, 
  enemy_count, 
  enemy_hp, 
  min_damage, 
  max_damage, 
  enemy_gauge_seconds, 
  mode, 
  allowed_chords, 
  monster_icon,
  show_guide,
  simultaneous_monster_count,
  mp3_url,
  bpm,
  time_signature,
  count_in_measures,
  measure_count,
  chord_progression_data
) VALUES (
  '4-1',
  'リズムの洞窟',
  'リズムに合わせてコードを演奏しよう！',
  5,
  10,
  1,
  1,
  1,
  4,
  'rhythm',
  '["C", "G", "Am", "F"]'::jsonb,
  'fa-drum',
  true,
  1,
  '/demo-1.mp3',
  120,
  4,
  1,
  8,
  NULL -- ランダムパターンの場合はNULL
);