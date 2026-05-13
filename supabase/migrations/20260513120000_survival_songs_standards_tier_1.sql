-- Survival Songs map: Jazz Standards 1（Progression 6 ステージ）II-V-I / Blues の続き stage_number 10-15
BEGIN;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('songs', 'jazz_standards_1', 'Jazz Standards 1', 'Jazz Standards 1', 2)
ON CONFLICT (map_category, block_key) DO UPDATE
SET label = EXCLUDED.label,
    label_en = EXCLUDED.label_en,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES
  (
    'songs', 10, 'progression', 'Leaves', 'Leaves', 'easy',
    '', 'Jazz Standards 1', 'Jazz Standards 1',
    NULL, NULL, NULL,
    'jazz_standards_1', false, NULL,
    '[{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]},{"name":"Am7(b5)","voicing":[55,59,60,63]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"G7(b9.b13)","voicing":[53,56,59,63]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]},{"name":"Am7(b5)","voicing":[55,59,60,63]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"Gm6(9)","voicing":[52,57,58,62]},{"name":"Am7(b5)","voicing":[55,59,60,63]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"G7(b9.b13)","voicing":[53,56,59,63]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]},{"name":"Am7(b5)","voicing":[55,59,60,63]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"Gb7(9)","voicing":[52,56,58,61]},{"name":"Fm7(9)","voicing":[63,67,68,72]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"G7(b9.b13)","voicing":[53,56,59,63]}]'::jsonb
  ),
  (
    'songs', 11, 'progression', 'Moon', 'Moon', 'easy',
    '', 'Jazz Standards 1', 'Jazz Standards 1',
    NULL, NULL, NULL,
    'jazz_standards_1', false, NULL,
    '[{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"CM7(9)","voicing":[52,55,59,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Bm7(b5)","voicing":[57,61,62,65]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"CM7(9)","voicing":[52,55,59,62]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"CM7(9)","voicing":[52,55,59,62]},{"name":"Bm7(b5)","voicing":[57,61,62,65]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"CM7(9)","voicing":[52,55,59,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Bm7(b5)","voicing":[57,61,62,65]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"D#dim7","voicing":[51,54,57,60]},{"name":"Em7","voicing":[55,59,62,66]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"CM7(9)","voicing":[52,55,59,62]},{"name":"Bm7(b5)","voicing":[57,61,62,65]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]}]'::jsonb
  ),
  (
    'songs', 12, 'progression', 'Part of Me', 'Part of Me', 'easy',
    '', 'Jazz Standards 1', 'Jazz Standards 1',
    NULL, NULL, NULL,
    'jazz_standards_1', false, NULL,
    '[{"name":"C6(9)","voicing":[52,55,57,62]},{"name":"C6(9)","voicing":[52,55,57,62]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"Bm7(b5)","voicing":[57,61,62,65]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"D7(9.13)","voicing":[54,59,60,64]},{"name":"D7(9.13)","voicing":[54,59,60,64]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"C6(9)","voicing":[52,55,57,62]},{"name":"C6(9)","voicing":[52,55,57,62]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Fm6(9)","voicing":[62,67,68,72]},{"name":"Em7","voicing":[55,59,62,66]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"C6(9)","voicing":[52,55,57,62]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]}]'::jsonb
  ),
  (
    'songs', 13, 'progression', 'My Eyes', 'My Eyes', 'easy',
    '', 'Jazz Standards 1', 'Jazz Standards 1',
    NULL, NULL, NULL,
    'jazz_standards_1', false, NULL,
    '[{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Em7(b5)","voicing":[55,58,62,66]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Bm7(b5)","voicing":[57,61,62,65]},{"name":"E7(b9.b13)","voicing":[56,60,62,65]},{"name":"Am7(9)","voicing":[55,59,60,64]},{"name":"Ab7(9)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]}]'::jsonb
  ),
  (
    'songs', 14, 'progression', 'Roses', 'Roses', 'easy',
    '', 'Jazz Standards 1', 'Jazz Standards 1',
    NULL, NULL, NULL,
    'jazz_standards_1', false, NULL,
    '[{"name":"FM7(9)","voicing":[64,67,69,72]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"Am7(b5)","voicing":[55,59,60,63]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"Am7","voicing":[55,59,60,64]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"Em7(b5)","voicing":[55,58,62,66]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]}]'::jsonb
  ),
  (
    'songs', 15, 'progression', 'Leaves Boss', 'Leaves Boss', 'easy',
    '', 'Jazz Standards 1', 'Jazz Standards 1',
    NULL, NULL, NULL,
    'jazz_standards_1', false, NULL,
    '[{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]},{"name":"Am7(b5)","voicing":[55,59,60,63]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"G7(b9.b13)","voicing":[53,56,59,63]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]},{"name":"Am7(b5)","voicing":[55,59,60,63]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"Gm6(9)","voicing":[52,57,58,62]},{"name":"Am7(b5)","voicing":[55,59,60,63]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"G7(b9.b13)","voicing":[53,56,59,63]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"BbM7(9)","voicing":[62,65,69,72]},{"name":"EbM7(9)","voicing":[50,53,55,58]},{"name":"Am7(b5)","voicing":[55,59,60,63]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"Gb7(9)","voicing":[52,56,58,61]},{"name":"Fm7(9)","voicing":[63,67,68,72]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"G7(b9.b13)","voicing":[53,56,59,63]}]'::jsonb
  );

COMMIT;
