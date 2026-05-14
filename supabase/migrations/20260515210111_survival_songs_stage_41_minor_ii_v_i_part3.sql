-- Survival Songs progression stage 41 (idempotent upsert).
BEGIN;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES
  ('songs', 41, 'progression', 'Minor II-V-I Part 3', 'Minor II-V-I Part 3', 'hard', '', 'Minor II-V-I', 'Minor II-V-I', NULL, NULL, NULL, 'minor_ii_v_i', false, NULL, '[{"name":"F#m7(b5)","voicing":[52,56,57,60],"voicing_names":["E3","G#3","A3","C4"],"key_fifths":4},{"name":"B7(b9.b13)","voicing":[51,55,57,60],"voicing_names":["D#3","G3","A3","C4"],"key_fifths":4},{"name":"Em6(9)","voicing":[49,54,55,59],"voicing_names":["C#3","F#3","G3","B3"],"key_fifths":4},{"name":"F#m7(b5)","voicing":[52,56,57,60],"voicing_names":["E3","G#3","A3","C4"],"key_fifths":4},{"name":"B7(b9.b13)","voicing":[51,55,57,60],"voicing_names":["D#3","G3","A3","C4"],"key_fifths":4},{"name":"Em6(9)","voicing":[49,54,55,59],"voicing_names":["C#3","F#3","G3","B3"],"key_fifths":4},{"name":"Bm7(b5)","voicing":[57,61,62,65],"voicing_names":["A3","C#4","D4","F4"],"key_fifths":3},{"name":"E7(b9.b13)","voicing":[56,60,62,65],"voicing_names":["G#3","C4","D4","F4"],"key_fifths":3},{"name":"Am6(9)","voicing":[54,59,60,64],"voicing_names":["F#3","B3","C4","E4"],"key_fifths":3},{"name":"Bm7(b5)","voicing":[57,61,62,65],"voicing_names":["A3","C#4","D4","F4"],"key_fifths":3},{"name":"E7(b9.b13)","voicing":[56,60,62,65],"voicing_names":["G#3","C4","D4","F4"],"key_fifths":3},{"name":"Am6(9)","voicing":[54,59,60,64],"voicing_names":["F#3","B3","C4","E4"],"key_fifths":3},{"name":"Em7(b5)","voicing":[55,58,62,66],"voicing_names":["G3","Bb3","D4","F#4"],"key_fifths":2},{"name":"A7(b9.b13)","voicing":[55,58,61,65],"voicing_names":["G3","Bb3","C#4","F4"],"key_fifths":2},{"name":"Dm6(9)","voicing":[53,57,59,64],"voicing_names":["F3","A3","B3","E4"],"key_fifths":2},{"name":"Em7(b5)","voicing":[55,58,62,66],"voicing_names":["G3","Bb3","D4","F#4"],"key_fifths":2},{"name":"A7(b9.b13)","voicing":[55,58,61,65],"voicing_names":["G3","Bb3","C#4","F4"],"key_fifths":2},{"name":"Dm6(9)","voicing":[53,57,59,64],"voicing_names":["F3","A3","B3","E4"],"key_fifths":2},{"name":"Am7(b5)","voicing":[55,59,60,63],"voicing_names":["G3","B3","C4","Eb4"],"key_fifths":1},{"name":"D7(b9.b13)","voicing":[54,58,60,63],"voicing_names":["F#3","Bb3","C4","Eb4"],"key_fifths":1},{"name":"Gm6(9)","voicing":[52,57,58,62],"voicing_names":["E3","A3","Bb3","D4"],"key_fifths":1},{"name":"Am7(b5)","voicing":[55,59,60,63],"voicing_names":["G3","B3","C4","Eb4"],"key_fifths":1},{"name":"D7(b9.b13)","voicing":[54,58,60,63],"voicing_names":["F#3","Bb3","C4","Eb4"],"key_fifths":1},{"name":"Gm6(9)","voicing":[52,57,58,62],"voicing_names":["E3","A3","Bb3","D4"],"key_fifths":1}]'::jsonb)
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
