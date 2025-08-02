-- リズムモード用の拡張
-- fantasy_stagesテーブルにchord_progression_dataカラムを追加
ALTER TABLE fantasy_stages 
ADD COLUMN chord_progression_data JSONB DEFAULT NULL;

-- 既存のレコードのmodeカラムのデフォルト値を'quiz'に設定
UPDATE fantasy_stages 
SET mode = 'quiz' 
WHERE mode IN ('single', 'progression');

-- modeカラムの制約を更新
ALTER TABLE fantasy_stages 
DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

ALTER TABLE fantasy_stages 
ADD CONSTRAINT fantasy_stages_mode_check 
CHECK (mode IN ('quiz', 'rhythm'));

-- サンプルのリズムモードステージを追加
INSERT INTO fantasy_stages (
  stage_number, 
  name, 
  description,
  mode, 
  allowed_chords, 
  chord_progression_data, 
  max_hp, 
  enemy_count, 
  enemy_hp,
  enemy_gauge_seconds,
  min_damage,
  max_damage,
  bpm, 
  measure_count,
  time_signature,
  count_in_measures,
  show_sheet_music,
  show_guide,
  bgm_url,
  mp3_url
) VALUES 
(
  'R1-1', 
  'リズムの洞窟', 
  '基本的なコードでリズムを刻もう！',
  'rhythm', 
  '["C", "G", "Am", "F"]'::jsonb,
  '{
    "chords": [
      {"beat": 1.0, "chord": "C", "measure": 1},
      {"beat": 1.0, "chord": "G", "measure": 2},
      {"beat": 1.0, "chord": "Am", "measure": 3},
      {"beat": 1.0, "chord": "F", "measure": 4}
    ]
  }'::jsonb,
  5, 
  10, 
  1,
  10,
  1,
  2,
  120, 
  4,
  4,
  1,
  false,
  true,
  NULL,
  NULL
),
(
  'R1-2', 
  'ビートの森', 
  'ランダムなコードパターンに挑戦！',
  'rhythm', 
  '["C", "G", "Am", "F", "Dm", "Em"]'::jsonb,
  NULL, -- ランダムパターン
  5, 
  15, 
  1,
  8,
  1,
  2,
  130, 
  8,
  4,
  1,
  false,
  true,
  NULL,
  NULL
);