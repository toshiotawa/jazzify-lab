-- Survival Songs progression stage 39 (idempotent upsert).
BEGIN;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES
  ('songs', 39, 'progression', 'Minor II-V-I Part 1', 'Minor II-V-I Part 1', 'easy', '', 'Minor II-V-I', 'Minor II-V-I', NULL, NULL, NULL, 'minor_ii_v_i', false, NULL, '[{"name":"Dm7(b5)","voicing":[53,56,60,64],"voicing_names":["F3","Ab3","C4","E4"],"key_fifths":0},{"name":"G7(b9.b13)","voicing":[53,56,59,63],"voicing_names":["F3","Ab3","B3","Eb4"],"key_fifths":0},{"name":"Cm6(9)","voicing":[51,55,57,62],"voicing_names":["Eb3","G3","A3","D4"],"key_fifths":0},{"name":"Dm7(b5)","voicing":[53,56,60,64],"voicing_names":["F3","Ab3","C4","E4"],"key_fifths":0},{"name":"G7(b9.b13)","voicing":[53,56,59,63],"voicing_names":["F3","Ab3","B3","Eb4"],"key_fifths":0},{"name":"Cm6(9)","voicing":[51,55,57,62],"voicing_names":["Eb3","G3","A3","D4"],"key_fifths":0},{"name":"Gm7(b5)","voicing":[53,57,58,61],"voicing_names":["F3","A3","Bb3","Db4"],"key_fifths":-1},{"name":"C7(b9.b13)","voicing":[52,56,58,61],"voicing_names":["E3","Ab3","Bb3","Db4"],"key_fifths":-1},{"name":"Fm6(9)","voicing":[50,55,56,60],"voicing_names":["D3","G3","Ab3","C4"],"key_fifths":-1},{"name":"Gm7(b5)","voicing":[53,57,58,61],"voicing_names":["F3","A3","Bb3","Db4"],"key_fifths":-1},{"name":"C7(b9.b13)","voicing":[52,56,58,61],"voicing_names":["E3","Ab3","Bb3","Db4"],"key_fifths":-1},{"name":"Fm6(9)","voicing":[50,55,56,60],"voicing_names":["D3","G3","Ab3","C4"],"key_fifths":-1},{"name":"Cm7(b5)","voicing":[51,54,58,62],"voicing_names":["Eb3","Gb3","Bb3","D4"],"key_fifths":-2},{"name":"F7(b9.b13)","voicing":[51,54,57,61],"voicing_names":["Eb3","Gb3","A3","Db4"],"key_fifths":-2},{"name":"Bbm6(9)","voicing":[49,53,55,60],"voicing_names":["Db3","F3","G3","C4"],"key_fifths":-2},{"name":"Cm7(b5)","voicing":[51,54,58,62],"voicing_names":["Eb3","Gb3","Bb3","D4"],"key_fifths":-2},{"name":"F7(b9.b13)","voicing":[51,54,57,61],"voicing_names":["Eb3","Gb3","A3","Db4"],"key_fifths":-2},{"name":"Bbm6(9)","voicing":[49,53,55,60],"voicing_names":["Db3","F3","G3","C4"],"key_fifths":-2},{"name":"Fm7(b5)","voicing":[56,59,63,67],"voicing_names":["Ab3","Cb4","Eb4","G4"],"key_fifths":-3},{"name":"Bb7(b9.b13)","voicing":[56,59,62,66],"voicing_names":["Ab3","Cb4","D4","Gb4"],"key_fifths":-3},{"name":"Ebm6(9)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-3},{"name":"Fm7(b5)","voicing":[56,59,63,67],"voicing_names":["Ab3","Cb4","Eb4","G4"],"key_fifths":-3},{"name":"Bb7(b9.b13)","voicing":[56,59,62,66],"voicing_names":["Ab3","Cb4","D4","Gb4"],"key_fifths":-3},{"name":"Ebm6(9)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-3}]'::jsonb)
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
