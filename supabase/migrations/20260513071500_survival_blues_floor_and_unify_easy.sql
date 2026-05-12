-- Survival Songs map: Blues フロア（Progression 4 曲）追加 + 全 survival_stages の難易度を easy に統一
BEGIN;

-- (1) 既存 Basic/Songs を含む全 survival_stages の難易度を easy に統一
UPDATE public.survival_stages SET difficulty = 'easy' WHERE difficulty <> 'easy';

-- (2) Songs に Blues ブロックを追加（II-V-I の次, sort_order=1）
INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('songs', 'blues', 'Blues', 'Blues', 1)
ON CONFLICT (map_category, block_key) DO UPDATE
SET label = EXCLUDED.label,
    label_en = EXCLUDED.label_en,
    sort_order = EXCLUDED.sort_order;

-- (3) Blues 4 ステージ（stage_number=6〜9）を progression として挿入
INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES
  (
    'songs', 6, 'progression', 'F Blues', 'F Blues', 'easy',
    '', 'Blues', 'Blues',
    NULL, NULL, NULL,
    'blues', false, NULL,
    '[{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"Bdim7","voicing":[53,56,59,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]}]'::jsonb
  ),
  (
    'songs', 7, 'progression', 'Bb Blues', 'Bb Blues', 'easy',
    '', 'Blues', 'Blues',
    NULL, NULL, NULL,
    'blues', false, NULL,
    '[{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"Eb7(9.13)","voicing":[55,60,61,65]},{"name":"Edim7","voicing":[52,55,58,61]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"G7(b9.b13)","voicing":[53,56,59,63]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"G7(b9.b13)","voicing":[53,56,59,63]},{"name":"Cm7(9)","voicing":[51,55,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]}]'::jsonb
  ),
  (
    'songs', 8, 'progression', 'C Blues', 'C Blues', 'easy',
    '', 'Blues', 'Blues',
    NULL, NULL, NULL,
    'blues', false, NULL,
    '[{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"F#dim7","voicing":[54,57,60,63]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"A7(b9.b13)","voicing":[55,58,61,65]},{"name":"Dm7(9)","voicing":[53,57,60,64]},{"name":"G7(9.13)","voicing":[53,57,59,64]}]'::jsonb
  ),
  (
    'songs', 9, 'progression', 'F Blues Boss', 'F Blues Boss', 'easy',
    '', 'Blues', 'Blues',
    NULL, NULL, NULL,
    'blues', false, NULL,
    '[{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"Bb7(9.13)","voicing":[62,67,68,72]},{"name":"Bdim7","voicing":[53,56,59,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]},{"name":"F7(9.13)","voicing":[51,55,57,62]},{"name":"D7(b9.b13)","voicing":[54,58,60,63]},{"name":"Gm7(9)","voicing":[53,57,58,62]},{"name":"C7(9.13)","voicing":[52,57,58,62]}]'::jsonb
  );

COMMIT;
