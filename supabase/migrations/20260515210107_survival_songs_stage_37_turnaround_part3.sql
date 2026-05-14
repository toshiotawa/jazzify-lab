-- Survival Songs progression stage 37 (idempotent upsert).
BEGIN;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES
  ('songs', 37, 'progression', 'Turn Around Part 3', 'Turn Around Part 3', 'hard', '', 'Turn Around', 'Turn Around', NULL, NULL, NULL, 'turnaround', false, NULL, '[{"name":"G#m7(9)","voicing":[54,58,59,63],"voicing_names":["F#3","A#3","B3","D#4"],"key_fifths":4},{"name":"C#7(b9.b13)","voicing":[53,57,59,62],"voicing_names":["E#3","A3","B3","D4"],"key_fifths":4},{"name":"F#m7(9)","voicing":[52,56,57,61],"voicing_names":["E3","G#3","A3","C#4"],"key_fifths":4},{"name":"B7(9.13)","voicing":[51,56,57,61],"voicing_names":["D#3","G#3","A3","C#4"],"key_fifths":4},{"name":"G#m7(9)","voicing":[54,58,59,63],"voicing_names":["F#3","A#3","B3","D#4"],"key_fifths":4},{"name":"C#7(b9.b13)","voicing":[53,57,59,62],"voicing_names":["E#3","A3","B3","D4"],"key_fifths":4},{"name":"F#m7(9)","voicing":[52,56,57,61],"voicing_names":["E3","G#3","A3","C#4"],"key_fifths":4},{"name":"B7(9.13)","voicing":[51,56,57,61],"voicing_names":["D#3","G#3","A3","C#4"],"key_fifths":4},{"name":"C#m7(9)","voicing":[52,56,59,63],"voicing_names":["E3","G#3","B3","D#4"],"key_fifths":3},{"name":"F#7(b9.b13)","voicing":[52,55,58,62],"voicing_names":["E3","G3","A#3","D4"],"key_fifths":3},{"name":"Bm7(9)","voicing":[57,61,62,66],"voicing_names":["A3","C#4","D4","F#4"],"key_fifths":3},{"name":"E7(9.13)","voicing":[56,61,62,66],"voicing_names":["G#3","C#4","D4","F#4"],"key_fifths":3},{"name":"C#m7(9)","voicing":[52,56,59,63],"voicing_names":["E3","G#3","B3","D#4"],"key_fifths":3},{"name":"F#7(b9.b13)","voicing":[52,55,58,62],"voicing_names":["E3","G3","A#3","D4"],"key_fifths":3},{"name":"Bm7(9)","voicing":[57,61,62,66],"voicing_names":["A3","C#4","D4","F#4"],"key_fifths":3},{"name":"E7(9.13)","voicing":[56,61,62,66],"voicing_names":["G#3","C#4","D4","F#4"],"key_fifths":3},{"name":"F#m7(9)","voicing":[52,56,57,61],"voicing_names":["E3","G#3","A3","C#4"],"key_fifths":2},{"name":"B7(b9.b13)","voicing":[51,55,57,60],"voicing_names":["D#3","G3","A3","C4"],"key_fifths":2},{"name":"Em7(9)","voicing":[55,59,62,66],"voicing_names":["G3","B3","D4","F#4"],"key_fifths":2},{"name":"A7(9.13)","voicing":[55,59,61,66],"voicing_names":["G3","B3","C#4","F#4"],"key_fifths":2},{"name":"F#m7(9)","voicing":[52,56,57,61],"voicing_names":["E3","G#3","A3","C#4"],"key_fifths":2},{"name":"B7(b9.b13)","voicing":[51,55,57,60],"voicing_names":["D#3","G3","A3","C4"],"key_fifths":2},{"name":"Em7(9)","voicing":[55,59,62,66],"voicing_names":["G3","B3","D4","F#4"],"key_fifths":2},{"name":"A7(9.13)","voicing":[55,59,61,66],"voicing_names":["G3","B3","C#4","F#4"],"key_fifths":2},{"name":"Bm7(9)","voicing":[57,61,62,66],"voicing_names":["A3","C#4","D4","F#4"],"key_fifths":1},{"name":"E7(b9.b13)","voicing":[56,60,62,65],"voicing_names":["G#3","C4","D4","F4"],"key_fifths":1},{"name":"Am7(9)","voicing":[55,59,60,64],"voicing_names":["G3","B3","C4","E4"],"key_fifths":1},{"name":"D7(9.13)","voicing":[54,59,60,64],"voicing_names":["F#3","B3","C4","E4"],"key_fifths":1},{"name":"Bm7(9)","voicing":[57,61,62,66],"voicing_names":["A3","C#4","D4","F#4"],"key_fifths":1},{"name":"E7(b9.b13)","voicing":[56,60,62,65],"voicing_names":["G#3","C4","D4","F4"],"key_fifths":1},{"name":"Am7(9)","voicing":[55,59,60,64],"voicing_names":["G3","B3","C4","E4"],"key_fifths":1},{"name":"D7(9.13)","voicing":[54,59,60,64],"voicing_names":["F#3","B3","C4","E4"],"key_fifths":1}]'::jsonb)
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
