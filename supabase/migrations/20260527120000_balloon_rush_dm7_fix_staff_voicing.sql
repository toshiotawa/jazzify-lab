-- 風船ラッシュ Dm7: voicing に重複ピッチクラス (A) があり譜面が生成できないため 5 音に修正
UPDATE balloon_rush_stages
SET chord_progression = jsonb_build_array(
  jsonb_build_object(
    'name', 'Dm7',
    'voicing', jsonb_build_array(50, 53, 57, 60, 64),
    'voicing_names', jsonb_build_array('D3', 'F3', 'A3', 'C4', 'E4'),
    'voicing_staves', jsonb_build_array(2, 2, 2, 2, 1),
    'key_fifths', 0
  )
)
WHERE slug = 'balloon-rush-dm7-01';
