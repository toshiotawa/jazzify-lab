-- Rock With You: Ab → Ab / Bb (Bb / Ab はそのまま)
BEGIN;

UPDATE public.survival_stages
SET
  chord_progression = '[{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Cb / Db","voicing":[59,62,66],"voicing_names":["B3","D4","F#4"],"key_fifths":-5},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3},{"name":"Gb / Ab","voicing":[54,58,61],"voicing_names":["Gb3","Bb3","Db4"],"key_fifths":-6},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4}]'::jsonb,
  updated_at = now()
WHERE map_category = 'basic'
  AND stage_number BETWEEN 201 AND 204
  AND play_mode = 'code_run'
  AND block_key = 'rock_with_you';

COMMIT;
