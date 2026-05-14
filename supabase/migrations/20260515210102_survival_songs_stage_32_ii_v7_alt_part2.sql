-- Survival Songs progression stage 32 (idempotent upsert).
BEGIN;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES
  ('songs', 32, 'progression', 'II-V7(alt)-I Part 2', 'II-V7(alt)-I Part 2', 'normal', '', 'II-V7(alt)-I', 'II-V7(alt)-I', NULL, NULL, NULL, 'ii_v7_alt', false, NULL, '[{"name":"Bbm7(9)","voicing":[56,60,61,65],"voicing_names":["Ab3","C4","Db4","F4"],"key_fifths":-4},{"name":"Eb7(b9.b13)","voicing":[55,59,61,64],"voicing_names":["G3","Cb4","Db4","Fb4"],"key_fifths":-4},{"name":"AbM7(9)","voicing":[55,58,60,63],"voicing_names":["G3","Bb3","C4","Eb4"],"key_fifths":-4},{"name":"Bbm7(9)","voicing":[56,60,61,65],"voicing_names":["Ab3","C4","Db4","F4"],"key_fifths":-4},{"name":"Eb7(b9.b13)","voicing":[55,59,61,64],"voicing_names":["G3","Cb4","Db4","Fb4"],"key_fifths":-4},{"name":"AbM7(9)","voicing":[55,58,60,63],"voicing_names":["G3","Bb3","C4","Eb4"],"key_fifths":-4},{"name":"Ebm7(9)","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(b9.b13)","voicing":[54,57,60,64],"voicing_names":["Gb3","Bbb3","C4","Fb4"],"key_fifths":-5},{"name":"DbM7(9)","voicing":[53,56,60,63],"voicing_names":["F3","Ab3","C4","Eb4"],"key_fifths":-5},{"name":"Ebm7(9)","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(b9.b13)","voicing":[54,57,60,64],"voicing_names":["Gb3","Bbb3","C4","Fb4"],"key_fifths":-5},{"name":"DbM7(9)","voicing":[53,56,60,63],"voicing_names":["F3","Ab3","C4","Eb4"],"key_fifths":-5},{"name":"Abm7(9)","voicing":[54,58,59,63],"voicing_names":["Gb3","Bb3","Cb4","Eb4"],"key_fifths":-6},{"name":"Db7(b9.b13)","voicing":[53,57,59,62],"voicing_names":["F3","Bbb3","Cb4","Ebb4"],"key_fifths":-6},{"name":"GbM7(9)","voicing":[53,56,58,61],"voicing_names":["F3","Ab3","Bb3","Db4"],"key_fifths":-6},{"name":"Abm7(9)","voicing":[54,58,59,63],"voicing_names":["Gb3","Bb3","Cb4","Eb4"],"key_fifths":-6},{"name":"Db7(b9.b13)","voicing":[53,57,59,62],"voicing_names":["F3","Bbb3","Cb4","Ebb4"],"key_fifths":-6},{"name":"GbM7(9)","voicing":[53,56,58,61],"voicing_names":["F3","Ab3","Bb3","Db4"],"key_fifths":-6},{"name":"C#m7(9)","voicing":[52,56,59,63],"voicing_names":["E3","G#3","B3","D#4"],"key_fifths":5},{"name":"F#7(b9.b13)","voicing":[52,55,58,62],"voicing_names":["E3","G3","A#3","D4"],"key_fifths":5},{"name":"BM7(9)","voicing":[51,54,58,61],"voicing_names":["D#3","F#3","A#3","C#4"],"key_fifths":5},{"name":"C#m7(9)","voicing":[52,56,59,63],"voicing_names":["E3","G#3","B3","D#4"],"key_fifths":5},{"name":"F#7(b9.b13)","voicing":[52,55,58,62],"voicing_names":["E3","G3","A#3","D4"],"key_fifths":5},{"name":"BM7(9)","voicing":[51,54,58,61],"voicing_names":["D#3","F#3","A#3","C#4"],"key_fifths":5}]'::jsonb)
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
