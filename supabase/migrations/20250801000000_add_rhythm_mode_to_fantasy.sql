-- リズムモード対応のためのfantasy_stagesテーブル拡張
-- chord_progression_dataカラムの追加
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS chord_progression_data jsonb;

-- chord_progression_dataカラムにコメントを追加
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';

-- modeカラムのCHECK制約を更新してrhythmを追加
ALTER TABLE fantasy_stages 
DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

ALTER TABLE fantasy_stages 
ADD CONSTRAINT fantasy_stages_mode_check 
CHECK (mode IN ('single', 'progression', 'rhythm'));

-- mp3_url, bpm, measure_count, time_signature, count_in_measuresカラムの追加（まだ存在しない場合）
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS mp3_url varchar,
ADD COLUMN IF NOT EXISTS bpm integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS measure_count integer DEFAULT 8,
ADD COLUMN IF NOT EXISTS time_signature integer DEFAULT 4,
ADD COLUMN IF NOT EXISTS count_in_measures integer DEFAULT 1;

-- カラムにコメントを追加
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'リズムモード用のMP3ファイルURL';
COMMENT ON COLUMN fantasy_stages.bpm IS 'テンポ (BPM)';
COMMENT ON COLUMN fantasy_stages.measure_count IS '小節数';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN fantasy_stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';

-- modeカラムのコメントを更新
COMMENT ON COLUMN fantasy_stages.mode IS 'ステージモード: single(単体) | progression(進行) | rhythm(リズム)';

-- サンプルデータ：リズムモードステージの追加
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
  measure_count,
  time_signature,
  count_in_measures,
  chord_progression_data
) VALUES 
(
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
  '["C", "G", "Am", "F"]',
  'fa-drum',
  true,
  1,
  '/demo-1.mp3',
  120,
  8,
  4,
  1,
  NULL
),
(
  '4-2',
  'プログレッションの森',
  'コード進行に従って演奏しよう！',
  5,
  10,
  1,
  1,
  1,
  4,
  'rhythm',
  '["C", "G", "Am", "F", "Dm"]',
  'fa-music',
  true,
  4,
  '/demo-2.mp3',
  100,
  8,
  4,
  1,
  '{"chords": [{"beat": 1.0, "chord": "C", "measure": 1}, {"beat": 1.0, "chord": "G", "measure": 2}, {"beat": 1.0, "chord": "Am", "measure": 3}, {"beat": 1.0, "chord": "F", "measure": 4}, {"beat": 1.0, "chord": "C", "measure": 5}, {"beat": 1.0, "chord": "Am", "measure": 6}, {"beat": 1.0, "chord": "Dm", "measure": 7}, {"beat": 1.0, "chord": "G", "measure": 8}]}'
);