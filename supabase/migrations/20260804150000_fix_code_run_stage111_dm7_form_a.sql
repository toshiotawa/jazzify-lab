-- コードラン stage 111: Dm7(9) を他ステージと同じ Form A（3rd 底）に統一。
-- 誤って Form B（b7 底 [53,60,64,69]）が入っていた。
BEGIN;

UPDATE public.survival_stages
SET
  chord_progression = '[
    {"name":"Dm7(9)","voicing":[53,57,60,64],"voicing_names":["F3","A3","C4","E4"],"key_fifths":0,"voicing_staves":[2,2,2,2]},
    {"name":"G7(9.13)","voicing":[53,57,59,64],"voicing_names":["F3","A3","B3","E4"],"key_fifths":0,"voicing_staves":[2,2,2,1]},
    {"name":"CM7(9)","voicing":[52,55,59,62],"voicing_names":["E3","G3","B3","D4"],"key_fifths":0,"voicing_staves":[2,2,2,2]}
  ]'::jsonb,
  updated_at = now()
WHERE map_category = 'basic'
  AND stage_number = 111
  AND play_mode = 'code_run';

COMMIT;
