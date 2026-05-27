-- 風船ラッシュ II-V-I（balloon-rush-prog-iivi-01）: 6 音・ピッチクラス重複で譜面非表示。
-- Songs / lesson stage 2 と同じ 4 声 Dm7(9) → G7(9.13) → CM7(9) に差し替え。
BEGIN;

UPDATE public.balloon_rush_stages
SET
  chord_progression = '[
    {"name":"Dm7(9)","voicing":[53,57,60,64],"voicing_names":["F3","A3","C4","E4"],"key_fifths":0,"voicing_staves":[2,2,2,2]},
    {"name":"G7(9.13)","voicing":[53,57,59,64],"voicing_names":["F3","A3","B3","E4"],"key_fifths":0,"voicing_staves":[2,2,2,2]},
    {"name":"CM7(9)","voicing":[52,55,59,62],"voicing_names":["E3","G3","B3","D4"],"key_fifths":0,"voicing_staves":[2,2,2,2]}
  ]'::jsonb,
  updated_at = now()
WHERE slug = 'balloon-rush-prog-iivi-01';

COMMIT;
