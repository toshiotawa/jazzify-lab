-- ステージ4-2に拡張プログレッションデータを設定
UPDATE fantasy_stages
SET 
  chord_progression_data = '[
    {"bar": 1, "beat": 4.5, "chord": "C"},
    {"bar": 2, "beat": 4.5, "chord": "Am"},
    {"bar": 3, "beat": 4.5, "chord": "G"},
    {"bar": 4, "beat": 4.5, "chord": "F"}
  ]',
  measure_count = 4  -- 4小節でループ
WHERE stage_number = '4-2';

-- 確認用のSELECT文
SELECT 
  stage_number,
  name,
  mode,
  chord_progression,
  chord_progression_data,
  bpm,
  time_signature,
  measure_count
FROM fantasy_stages
WHERE stage_number = '4-2';