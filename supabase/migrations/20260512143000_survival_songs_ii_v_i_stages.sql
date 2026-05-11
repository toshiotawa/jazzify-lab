-- Survival Songs map: II-V-I progression stages (chord_progression from survival-progression-voicings CLI)
BEGIN;

DELETE FROM public.survival_stage_clears WHERE map_category = 'songs';
DELETE FROM public.survival_stage_progress WHERE map_category = 'songs';
DELETE FROM public.survival_stages WHERE map_category = 'songs';

UPDATE public.survival_stage_blocks
SET label = 'II-V-I', label_en = 'II-V-I'
WHERE map_category = 'songs' AND block_key = 'major';

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'songs',
  1,
  'progression',
  'II-V-I Part 1',
  'II-V-I Part 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'major',
  false,
  NULL,
  '[{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"CM7(9)","voicing":[52,55,59,62]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"CM7(9)","voicing":[52,55,59,62]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"Fm7(9)","voicing":[63,67,68,72]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]},{"name":"Fm7(9)","voicing":[63,67,68,72]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]}]'::jsonb
);

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'songs',
  2,
  'progression',
  'II-V-I Part 2',
  'II-V-I Part 2',
  'normal',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'major',
  false,
  NULL,
  '[{"name":"Bbm7(9)","voicing":[56,60,61,65]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"AbM7(9)","voicing":[55,58,60,63]},{"name":"Bbm7(9)","voicing":[56,60,61,65]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"AbM7(9)","voicing":[55,58,60,63]},{"name":"Ebm7(9)","voicing":[54,58,61,65]},{"name":"Ab7(9.13)","voicing":[54,58,60,65]},{"name":"DbM7(9)","voicing":[53,56,60,63]},{"name":"Ebm7(9)","voicing":[54,58,61,65]},{"name":"Ab7(9.13)","voicing":[54,58,60,65]},{"name":"DbM7(9)","voicing":[53,56,60,63]},{"name":"Abm7(9)","voicing":[54,58,59,63]},{"name":"Db7(9.13)","voicing":[53,58,59,63]},{"name":"GbM7(9)","voicing":[53,56,58,61]},{"name":"Abm7(9)","voicing":[54,58,59,63]},{"name":"Db7(9.13)","voicing":[53,58,59,63]},{"name":"GbM7(9)","voicing":[53,56,58,61]},{"name":"C#m7(9)","voicing":[52,56,59,63]},{"name":"F#7(9.13)","voicing":[52,56,58,63]},{"name":"BM7(9)","voicing":[51,54,58,61]},{"name":"C#m7(9)","voicing":[52,56,59,63]},{"name":"F#7(9.13)","voicing":[52,56,58,63]},{"name":"BM7(9)","voicing":[51,54,58,61]}]'::jsonb
);

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'songs',
  3,
  'progression',
  'II-V-I Part 3',
  'II-V-I Part 3',
  'hard',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'major',
  false,
  NULL,
  '[{"name":"F#m7(9)","voicing":[52,56,57,61]},{"name":"B7(9.13)","voicing":[51,56,57,61]},{"name":"EM7(9)","voicing":[63,66,68,71]},{"name":"F#m7(9)","voicing":[52,56,57,61]},{"name":"B7(9.13)","voicing":[51,56,57,61]},{"name":"EM7(9)","voicing":[63,66,68,71]},{"name":"Bm7(9)","voicing":[57,61,62,66]},{"name":"E7(9.13)","voicing":[56,61,62,66]},{"name":"AM7(9)","voicing":[56,59,61,64]},{"name":"Bm7(9)","voicing":[57,61,62,66]},{"name":"E7(9.13)","voicing":[56,61,62,66]},{"name":"AM7(9)","voicing":[56,59,61,64]},{"name":"Em7(9)","voicing":[55,59,62,66]},{"name":"A7(9.13)","voicing":[55,59,61,66]},{"name":"DM7(9)","voicing":[54,57,61,64]},{"name":"Em7(9)","voicing":[55,59,62,66]},{"name":"A7(9.13)","voicing":[55,59,61,66]},{"name":"DM7(9)","voicing":[54,57,61,64]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"D7(9.13)","voicing":[54,59,60,64]},{"name":"GM7(9)","voicing":[54,57,59,62]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"D7(9.13)","voicing":[54,59,60,64]},{"name":"GM7(9)","voicing":[54,57,59,62]}]'::jsonb
);

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'songs',
  4,
  'progression',
  'II-V-I in All Key',
  'II-V-I in All Keys',
  'hard',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'major',
  false,
  NULL,
  '[{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"CM7(9)","voicing":[52,55,59,62]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"Fm7(9)","voicing":[63,67,68,72]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]},{"name":"Bbm7(9)","voicing":[56,60,61,65]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"AbM7(9)","voicing":[55,58,60,63]},{"name":"Ebm7(9)","voicing":[54,58,61,65]},{"name":"Ab7(9.13)","voicing":[54,58,60,65]},{"name":"DbM7(9)","voicing":[53,56,60,63]},{"name":"Abm7(9)","voicing":[54,58,59,63]},{"name":"Db7(9.13)","voicing":[53,58,59,63]},{"name":"GbM7(9)","voicing":[53,56,58,61]},{"name":"C#m7(9)","voicing":[52,56,59,63]},{"name":"F#7(9.13)","voicing":[52,56,58,63]},{"name":"BM7(9)","voicing":[51,54,58,61]},{"name":"F#m7(9)","voicing":[52,56,57,61]},{"name":"B7(9.13)","voicing":[51,56,57,61]},{"name":"EM7(9)","voicing":[63,66,68,71]},{"name":"Bm7(9)","voicing":[57,61,62,66]},{"name":"E7(9.13)","voicing":[56,61,62,66]},{"name":"AM7(9)","voicing":[56,59,61,64]},{"name":"Em7(9)","voicing":[55,59,62,66]},{"name":"A7(9.13)","voicing":[55,59,61,66]},{"name":"DM7(9)","voicing":[54,57,61,64]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"D7(9.13)","voicing":[54,59,60,64]},{"name":"GM7(9)","voicing":[54,57,59,62]}]'::jsonb
);

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'songs',
  5,
  'progression',
  'II-V-I in All Key Boss',
  'II-V-I in All Keys (Boss)',
  'extreme',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'major',
  false,
  NULL,
  '[{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"CM7(9)","voicing":[52,55,59,62]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"Fm7(9)","voicing":[63,67,68,72]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]},{"name":"Bbm7(9)","voicing":[56,60,61,65]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"AbM7(9)","voicing":[55,58,60,63]},{"name":"Ebm7(9)","voicing":[54,58,61,65]},{"name":"Ab7(9.13)","voicing":[54,58,60,65]},{"name":"DbM7(9)","voicing":[53,56,60,63]},{"name":"Abm7(9)","voicing":[54,58,59,63]},{"name":"Db7(9.13)","voicing":[53,58,59,63]},{"name":"GbM7(9)","voicing":[53,56,58,61]},{"name":"C#m7(9)","voicing":[52,56,59,63]},{"name":"F#7(9.13)","voicing":[52,56,58,63]},{"name":"BM7(9)","voicing":[51,54,58,61]},{"name":"F#m7(9)","voicing":[52,56,57,61]},{"name":"B7(9.13)","voicing":[51,56,57,61]},{"name":"EM7(9)","voicing":[63,66,68,71]},{"name":"Bm7(9)","voicing":[57,61,62,66]},{"name":"E7(9.13)","voicing":[56,61,62,66]},{"name":"AM7(9)","voicing":[56,59,61,64]},{"name":"Em7(9)","voicing":[55,59,62,66]},{"name":"A7(9.13)","voicing":[55,59,61,66]},{"name":"DM7(9)","voicing":[54,57,61,64]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"D7(9.13)","voicing":[54,59,60,64]},{"name":"GM7(9)","voicing":[54,57,59,62]}]'::jsonb
);

COMMIT;
