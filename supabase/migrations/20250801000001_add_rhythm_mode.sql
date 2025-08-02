-- Add rhythm mode support to fantasy_stages table

-- 1. Update the mode check constraint to include 'rhythm'
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;
ALTER TABLE fantasy_stages ADD CONSTRAINT fantasy_stages_mode_check 
  CHECK (mode IN ('single', 'progression', 'rhythm'));

-- 2. Add chord_progression_data column if it doesn't exist
ALTER TABLE fantasy_stages 
  ADD COLUMN IF NOT EXISTS chord_progression_data jsonb DEFAULT NULL;

-- 3. Add comment for the new column
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';

-- 4. Ensure all required columns exist with proper defaults
ALTER TABLE fantasy_stages 
  ADD COLUMN IF NOT EXISTS mp3_url varchar,
  ADD COLUMN IF NOT EXISTS measure_count integer DEFAULT 8 CHECK (measure_count > 0),
  ADD COLUMN IF NOT EXISTS bpm integer DEFAULT 120 CHECK (bpm > 0),
  ADD COLUMN IF NOT EXISTS time_signature integer DEFAULT 4 CHECK (time_signature > 0 AND time_signature <= 16),
  ADD COLUMN IF NOT EXISTS count_in_measures integer DEFAULT 1 CHECK (count_in_measures >= 0);

-- 5. Add comments for the new columns
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'BGM音源のURL';
COMMENT ON COLUMN fantasy_stages.measure_count IS '小節数';
COMMENT ON COLUMN fantasy_stages.bpm IS 'BPM (Beats Per Minute)';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';

-- 6. Add sample rhythm mode stage
INSERT INTO fantasy_stages (
  stage_number,
  name,
  description,
  mode,
  max_hp,
  enemy_gauge_seconds,
  enemy_count,
  enemy_hp,
  min_damage,
  max_damage,
  allowed_chords,
  show_sheet_music,
  show_guide,
  simultaneous_monster_count,
  monster_icon,
  mp3_url,
  measure_count,
  bpm,
  time_signature,
  count_in_measures,
  chord_progression_data
) VALUES (
  '4-1',
  'リズムの洞窟',
  'リズムに合わせてコードを演奏しよう！',
  'rhythm',
  5,
  4.0,
  10,
  1,
  1,
  1,
  '["C", "G", "Am", "F"]'::jsonb,
  true,
  true,
  1,
  'fa-drum',
  '/demo-1.mp3',
  8,
  120,
  4,
  1,
  NULL
) ON CONFLICT (stage_number) DO NOTHING;

-- 7. Add sample rhythm mode stage with chord progression
INSERT INTO fantasy_stages (
  stage_number,
  name,
  description,
  mode,
  max_hp,
  enemy_gauge_seconds,
  enemy_count,
  enemy_hp,
  min_damage,
  max_damage,
  allowed_chords,
  show_sheet_music,
  show_guide,
  simultaneous_monster_count,
  monster_icon,
  mp3_url,
  measure_count,
  bpm,
  time_signature,
  count_in_measures,
  chord_progression_data
) VALUES (
  '4-2',
  'リズムの森',
  'コード進行に合わせて演奏しよう！',
  'rhythm',
  5,
  4.0,
  8,
  1,
  1,
  1,
  '["C", "G", "Am", "F", "Dm"]'::jsonb,
  true,
  true,
  4,
  'fa-music',
  '/demo-1.mp3',
  8,
  120,
  4,
  1,
  '{"chords": [{"beat": 1.0, "chord": "C", "measure": 1}, {"beat": 1.0, "chord": "G", "measure": 2}, {"beat": 1.0, "chord": "Am", "measure": 3}, {"beat": 1.0, "chord": "F", "measure": 4}, {"beat": 1.0, "chord": "C", "measure": 5}, {"beat": 1.0, "chord": "Am", "measure": 6}, {"beat": 1.0, "chord": "Dm", "measure": 7}, {"beat": 1.0, "chord": "G", "measure": 8}]}'::jsonb
) ON CONFLICT (stage_number) DO NOTHING;