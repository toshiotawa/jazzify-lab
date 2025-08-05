-- ステージ4-2を太鼓の達人モード（progression_timing）に変更する例

UPDATE fantasy_stages
SET 
  mode = 'progression_timing',
  -- 簡易テキスト形式の例（1小節ごとにコードが変わる）
  chord_progression_data = 'C Am G F'
WHERE stage_number = '4-2';

-- または、詳細なJSON形式の例（タイミングを細かく制御）
UPDATE fantasy_stages
SET 
  mode = 'progression_timing',
  chord_progression_data = '[
    {"measure": 2, "beat": 1, "chord": "C"},
    {"measure": 3, "beat": 1, "chord": "Am"},
    {"measure": 4, "beat": 1, "chord": "G"},
    {"measure": 5, "beat": 1, "chord": "F"},
    {"measure": 6, "beat": 1, "chord": "C"},
    {"measure": 7, "beat": 1, "chord": "Am"},
    {"measure": 8, "beat": 1, "chord": "G"},
    {"measure": 9, "beat": 1, "chord": "F"}
  ]'::jsonb
WHERE stage_number = '4-2';