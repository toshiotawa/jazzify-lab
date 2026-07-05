-- Rock With You: 13-chord progression (Bb triads, Cb/Db D# voicing, extended ending)
BEGIN;

UPDATE public.survival_stages
SET
  chord_progression = '[{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-2},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Cb / Db","voicing":[59,63,66],"voicing_names":["B3","D#4","F#4"],"key_fifths":-5},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-2},{"name":"Gb / Ab","voicing":[54,58,61],"voicing_names":["Gb3","Bb3","Db4"],"key_fifths":-6},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Gb / Ab","voicing":[54,58,61],"voicing_names":["Gb3","Bb3","Db4"],"key_fifths":-6},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4}]'::jsonb,
  updated_at = now()
WHERE map_category = 'basic'
  AND play_mode = 'code_run'
  AND block_key = 'rock_with_you'
  AND stage_number IN (201, 202, 203, 204, 211);

COMMIT;
