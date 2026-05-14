-- Survival Songs progression stage 31 (idempotent upsert).
BEGIN;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES
  ('songs', 31, 'progression', 'II-V7(alt)-I Part 1', 'II-V7(alt)-I Part 1', 'easy', '', 'II-V7(alt)-I', 'II-V7(alt)-I', NULL, NULL, NULL, 'ii_v7_alt', false, NULL, '[{"name":"Dm7(9)","voicing":[53,57,60,64],"voicing_names":["F3","A3","C4","E4"],"key_fifths":0},{"name":"G7(b9.b13)","voicing":[53,56,59,63],"voicing_names":["F3","Ab3","B3","Eb4"],"key_fifths":0},{"name":"CM7(9)","voicing":[52,55,59,62],"voicing_names":["E3","G3","B3","D4"],"key_fifths":0},{"name":"Dm7(9)","voicing":[53,57,60,64],"voicing_names":["F3","A3","C4","E4"],"key_fifths":0},{"name":"G7(b9.b13)","voicing":[53,56,59,63],"voicing_names":["F3","Ab3","B3","Eb4"],"key_fifths":0},{"name":"CM7(9)","voicing":[52,55,59,62],"voicing_names":["E3","G3","B3","D4"],"key_fifths":0},{"name":"Gm7(9)","voicing":[53,57,58,62],"voicing_names":["F3","A3","Bb3","D4"],"key_fifths":-1},{"name":"C7(b9.b13)","voicing":[52,56,58,61],"voicing_names":["E3","Ab3","Bb3","Db4"],"key_fifths":-1},{"name":"FM7(9)","voicing":[52,55,57,60],"voicing_names":["E3","G3","A3","C4"],"key_fifths":-1},{"name":"Gm7(9)","voicing":[53,57,58,62],"voicing_names":["F3","A3","Bb3","D4"],"key_fifths":-1},{"name":"C7(b9.b13)","voicing":[52,56,58,61],"voicing_names":["E3","Ab3","Bb3","Db4"],"key_fifths":-1},{"name":"FM7(9)","voicing":[52,55,57,60],"voicing_names":["E3","G3","A3","C4"],"key_fifths":-1},{"name":"Cm7(9)","voicing":[51,55,58,62],"voicing_names":["Eb3","G3","Bb3","D4"],"key_fifths":-2},{"name":"F7(b9.b13)","voicing":[51,54,57,61],"voicing_names":["Eb3","Gb3","A3","Db4"],"key_fifths":-2},{"name":"BbM7(9)","voicing":[50,53,57,60],"voicing_names":["D3","F3","A3","C4"],"key_fifths":-2},{"name":"Cm7(9)","voicing":[51,55,58,62],"voicing_names":["Eb3","G3","Bb3","D4"],"key_fifths":-2},{"name":"F7(b9.b13)","voicing":[51,54,57,61],"voicing_names":["Eb3","Gb3","A3","Db4"],"key_fifths":-2},{"name":"BbM7(9)","voicing":[50,53,57,60],"voicing_names":["D3","F3","A3","C4"],"key_fifths":-2},{"name":"Fm7(9)","voicing":[51,55,56,60],"voicing_names":["Eb3","G3","Ab3","C4"],"key_fifths":-3},{"name":"Bb7(b9.b13)","voicing":[56,59,62,66],"voicing_names":["Ab3","Cb4","D4","Gb4"],"key_fifths":-3},{"name":"EbM7(9)","voicing":[38,41,43,46],"voicing_names":["D3","F3","G3","Bb3"],"key_fifths":-3},{"name":"Fm7(9)","voicing":[51,55,56,60],"voicing_names":["Eb3","G3","Ab3","C4"],"key_fifths":-3},{"name":"Bb7(b9.b13)","voicing":[56,59,62,66],"voicing_names":["Ab3","Cb4","D4","Gb4"],"key_fifths":-3},{"name":"EbM7(9)","voicing":[38,41,43,46],"voicing_names":["D3","F3","G3","Bb3"],"key_fifths":-3}]'::jsonb)
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
