-- Survival Songs progression stage 40 (idempotent upsert).
BEGIN;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES
  ('songs', 40, 'progression', 'Minor II-V-I Part 2', 'Minor II-V-I Part 2', 'normal', '', 'Minor II-V-I', 'Minor II-V-I', NULL, NULL, NULL, 'minor_ii_v_i', false, NULL, '[{"name":"Bbm7(b5)","voicing":[56,60,61,64],"voicing_names":["Ab3","C4","Db4","Fb4"],"key_fifths":-4},{"name":"Eb7(b9.b13)","voicing":[55,59,61,64],"voicing_names":["G3","Cb4","Db4","Fb4"],"key_fifths":-4},{"name":"Abm6(9)","voicing":[53,58,59,63],"voicing_names":["F3","Bb3","Cb4","Eb4"],"key_fifths":-4},{"name":"Bbm7(b5)","voicing":[56,60,61,64],"voicing_names":["Ab3","C4","Db4","Fb4"],"key_fifths":-4},{"name":"Eb7(b9.b13)","voicing":[55,59,61,64],"voicing_names":["G3","Cb4","Db4","Fb4"],"key_fifths":-4},{"name":"Abm6(9)","voicing":[53,58,59,63],"voicing_names":["F3","Bb3","Cb4","Eb4"],"key_fifths":-4},{"name":"Ebm7(b5)","voicing":[54,57,61,65],"voicing_names":["Gb3","Bbb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(b9.b13)","voicing":[54,57,60,64],"voicing_names":["Gb3","Bbb3","C4","Fb4"],"key_fifths":-5},{"name":"Dbm6(9)","voicing":[52,56,58,63],"voicing_names":["Fb3","Ab3","Bb3","Eb4"],"key_fifths":-5},{"name":"Ebm7(b5)","voicing":[54,57,61,65],"voicing_names":["Gb3","Bbb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(b9.b13)","voicing":[54,57,60,64],"voicing_names":["Gb3","Bbb3","C4","Fb4"],"key_fifths":-5},{"name":"Dbm6(9)","voicing":[52,56,58,63],"voicing_names":["Fb3","Ab3","Bb3","Eb4"],"key_fifths":-5},{"name":"Abm7(b5)","voicing":[54,58,59,62],"voicing_names":["Gb3","Bb3","Cb4","Ebb4"],"key_fifths":-6},{"name":"Db7(b9.b13)","voicing":[53,57,59,62],"voicing_names":["F3","Bbb3","Cb4","Ebb4"],"key_fifths":-6},{"name":"Gbm6(9)","voicing":[51,56,57,61],"voicing_names":["Eb3","Ab3","Bbb3","Db4"],"key_fifths":-6},{"name":"Abm7(b5)","voicing":[54,58,59,62],"voicing_names":["Gb3","Bb3","Cb4","Ebb4"],"key_fifths":-6},{"name":"Db7(b9.b13)","voicing":[53,57,59,62],"voicing_names":["F3","Bbb3","Cb4","Ebb4"],"key_fifths":-6},{"name":"Gbm6(9)","voicing":[51,56,57,61],"voicing_names":["Eb3","Ab3","Bbb3","Db4"],"key_fifths":-6},{"name":"C#m7(b5)","voicing":[52,55,59,63],"voicing_names":["E3","G3","B3","D#4"],"key_fifths":5},{"name":"F#7(b9.b13)","voicing":[52,55,58,62],"voicing_names":["E3","G3","A#3","D4"],"key_fifths":5},{"name":"Bm6(9)","voicing":[50,54,56,61],"voicing_names":["D3","F#3","G#3","C#4"],"key_fifths":5},{"name":"C#m7(b5)","voicing":[52,55,59,63],"voicing_names":["E3","G3","B3","D#4"],"key_fifths":5},{"name":"F#7(b9.b13)","voicing":[52,55,58,62],"voicing_names":["E3","G3","A#3","D4"],"key_fifths":5},{"name":"Bm6(9)","voicing":[50,54,56,61],"voicing_names":["D3","F#3","G#3","C#4"],"key_fifths":5}]'::jsonb)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  chord_suffix = EXCLUDED.chord_suffix,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  root_pattern = EXCLUDED.root_pattern,
  root_pattern_name = EXCLUDED.root_pattern_name,
  root_pattern_name_en = EXCLUDED.root_pattern_name_en,
  block_key = EXCLUDED.block_key,
  is_mixed_stage = EXCLUDED.is_mixed_stage,
  mixed_group_key = EXCLUDED.mixed_group_key,
  chord_progression = EXCLUDED.chord_progression,
  updated_at = now();

COMMIT;
