-- Add rhythm mode columns to fantasy_stages table
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS mode text DEFAULT 'quiz' CHECK (mode IN ('quiz', 'rhythm')),
ADD COLUMN IF NOT EXISTS bpm integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS measure_count integer DEFAULT 8,
ADD COLUMN IF NOT EXISTS time_signature integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS count_in_measures integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS mp3_url varchar,
ADD COLUMN IF NOT EXISTS chord_progression_data jsonb;

-- Add comments
COMMENT ON COLUMN fantasy_stages.mode IS 'ゲームモード: quiz(クイズモード) | rhythm(リズムモード)';
COMMENT ON COLUMN fantasy_stages.bpm IS 'テンポ (Beats Per Minute)';
COMMENT ON COLUMN fantasy_stages.measure_count IS '小節数';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'BGMファイルのURL';
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';

-- Update existing stages to have explicit quiz mode
UPDATE fantasy_stages 
SET mode = 'quiz'
WHERE mode IS NULL;

-- Insert a sample rhythm mode stage
INSERT INTO fantasy_stages (
  stage_number, 
  name, 
  description, 
  max_hp, 
  question_count,
  enemy_gauge_seconds, 
  mode,
  allowed_chords, 
  show_sheet_music,
  show_guide,
  enemy_count,
  enemy_hp,
  min_damage,
  max_damage,
  simultaneous_monster_count,
  monster_icon,
  bpm,
  measure_count,
  time_signature,
  count_in_measures,
  mp3_url,
  chord_progression_data
) VALUES (
  '4-1',
  'リズムの洞窟',
  'リズムに合わせてコードを演奏しよう！',
  5,
  10,
  4,
  'rhythm',
  '["C", "G", "Am", "F"]'::jsonb,
  true,
  true,
  10,
  1,
  1,
  1,
  1,
  'fa-drum',
  120,
  8,
  4,
  1,
  '/demo-1.mp3',
  NULL -- NULL means random pattern
);

-- Insert a progression pattern rhythm stage
INSERT INTO fantasy_stages (
  stage_number, 
  name, 
  description, 
  max_hp, 
  question_count,
  enemy_gauge_seconds, 
  mode,
  allowed_chords, 
  show_sheet_music,
  show_guide,
  enemy_count,
  enemy_hp,
  min_damage,
  max_damage,
  simultaneous_monster_count,
  monster_icon,
  bpm,
  measure_count,
  time_signature,
  count_in_measures,
  mp3_url,
  chord_progression_data
) VALUES (
  '4-2',
  'コード進行の森',
  'コード進行に沿って演奏しよう！',
  5,
  10,
  4,
  'rhythm',
  '["C", "G", "Am", "F", "Dm"]'::jsonb,
  true,
  true,
  10,
  1,
  1,
  1,
  1,
  'fa-music',
  120,
  8,
  4,
  1,
  '/demo-1.mp3',
  '{"chords": [{"beat": 1.0, "chord": "C", "measure": 1}, {"beat": 1.0, "chord": "G", "measure": 2}, {"beat": 1.0, "chord": "Am", "measure": 3}, {"beat": 1.0, "chord": "F", "measure": 4}, {"beat": 1.0, "chord": "C", "measure": 5}, {"beat": 1.0, "chord": "Am", "measure": 6}, {"beat": 1.0, "chord": "Dm", "measure": 7}, {"beat": 1.0, "chord": "G", "measure": 8}]}'::jsonb
);