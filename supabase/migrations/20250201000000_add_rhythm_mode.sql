-- Add rhythm mode columns to fantasy_stages table
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS bpm integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS measure_count integer DEFAULT 8,
ADD COLUMN IF NOT EXISTS time_signature integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS count_in_measures integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS mp3_url varchar,
ADD COLUMN IF NOT EXISTS chord_progression_data jsonb;

-- Update mode constraint to include 'rhythm'
ALTER TABLE fantasy_stages 
DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

ALTER TABLE fantasy_stages
ADD CONSTRAINT fantasy_stages_mode_check 
CHECK (mode IN ('single', 'progression', 'rhythm'));

-- Add comments for new columns
COMMENT ON COLUMN fantasy_stages.bpm IS 'BPM (beats per minute)';
COMMENT ON COLUMN fantasy_stages.measure_count IS '小節数';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'MP3ファイルのURL';
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';

-- Insert sample rhythm mode stage
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
  monster_icon,
  enemy_count,
  enemy_hp,
  min_damage,
  max_damage,
  simultaneous_monster_count,
  show_guide,
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
  'fa-drum',
  10,
  1,
  1,
  1,
  1,
  true,
  120,
  8,
  4,
  1,
  '/demo-1.mp3',
  NULL
);

-- Insert sample chord progression rhythm mode stage
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
  monster_icon,
  enemy_count,
  enemy_hp,
  min_damage,
  max_damage,
  simultaneous_monster_count,
  show_guide,
  bpm,
  measure_count,
  time_signature,
  count_in_measures,
  mp3_url,
  chord_progression_data
) VALUES (
  '4-2',
  'リズムの神殿',
  'コード進行パターンに挑戦！',
  5,
  16,
  3,
  'rhythm',
  '["C", "G", "Am", "F", "Dm", "Em"]'::jsonb,
  true,
  'fa-music',
  16,
  1,
  1,
  1,
  1,
  true,
  120,
  8,
  4,
  1,
  '/demo-2.mp3',
  '{"chords": [{"beat": 1.0, "chord": "C", "measure": 1}, {"beat": 1.0, "chord": "G", "measure": 2}, {"beat": 1.0, "chord": "Am", "measure": 3}, {"beat": 1.0, "chord": "F", "measure": 4}, {"beat": 1.0, "chord": "C", "measure": 5}, {"beat": 1.0, "chord": "Am", "measure": 6}, {"beat": 1.0, "chord": "Dm", "measure": 7}, {"beat": 1.0, "chord": "G", "measure": 8}]}'::jsonb
);