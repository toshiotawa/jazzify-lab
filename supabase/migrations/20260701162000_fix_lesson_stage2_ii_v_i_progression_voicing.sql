-- lesson / stage 2（レッスン: II-V-I）: 素の Dm7/G7/CM7 MIDI は譜面用綴り生成と不一致で
-- progressionStaffVoicingNames が空 → 譜面非表示。Songs stage 1 と同形式の voicing に差し替え。
BEGIN;

UPDATE public.survival_stages
SET
  chord_progression = '[
    {"name":"Dm7(9)","voicing":[53,57,60,64],"voicing_names":["F3","A3","C4","E4"],"key_fifths":0,"voicing_staves":[2,2,2,2]},
    {"name":"G7(9.13)","voicing":[53,57,59,64],"voicing_names":["F3","A3","B3","E4"],"key_fifths":0,"voicing_staves":[2,2,2,2]},
    {"name":"CM7(9)","voicing":[52,55,59,62],"voicing_names":["E3","G3","B3","D4"],"key_fifths":0,"voicing_staves":[2,2,2,2]}
  ]'::jsonb,
  updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number = 2
  AND stage_type = 'progression';

COMMIT;
