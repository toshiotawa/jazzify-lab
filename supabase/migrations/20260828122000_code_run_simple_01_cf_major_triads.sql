-- Simple_01 stage 182: CM7/FM7 → C/F major triad progression
BEGIN;

UPDATE public.survival_stages
SET
  chord_progression = '[
    {"name":"C","voicing":[48,52,55],"voicing_names":["C3","E3","G3"],"key_fifths":0,"voicing_staves":[2,2,2]},
    {"name":"F","voicing":[53,57,60],"voicing_names":["F3","A3","C4"],"key_fifths":-1,"voicing_staves":[2,2,2]},
    {"name":"C","voicing":[48,52,55],"voicing_names":["C3","E3","G3"],"key_fifths":0,"voicing_staves":[2,2,2]},
    {"name":"F","voicing":[53,57,60],"voicing_names":["F3","A3","C4"],"key_fifths":-1,"voicing_staves":[2,2,2]}
  ]'::jsonb,
  updated_at = now()
WHERE map_category = 'basic'
  AND stage_number = 182
  AND play_mode = 'code_run';

COMMIT;
