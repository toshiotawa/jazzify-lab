-- Rock With You: dev_run_11–15 maps (5 assignments), keep full 11-chord progression
BEGIN;

UPDATE public.survival_stages AS s
SET
  name = v.name,
  name_en = v.name_en,
  chord_progression = chords.chord_progression,
  run_map_id = v.run_map_id,
  updated_at = now()
FROM (
  VALUES
    (201, '開発: コードラン Rock With You 1', 'Dev: Code Run Rock With You 1', 'dev_run_11'),
    (202, '開発: コードラン Rock With You 2', 'Dev: Code Run Rock With You 2', 'dev_run_12'),
    (203, '開発: コードラン Rock With You 3', 'Dev: Code Run Rock With You 3', 'dev_run_13'),
    (204, '開発: コードラン Rock With You 4', 'Dev: Code Run Rock With You 4', 'dev_run_14')
) AS v(stage_number, name, name_en, run_map_id)
CROSS JOIN (
  SELECT '[{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Cb / Db","voicing":[59,62,66],"voicing_names":["B3","D4","F#4"],"key_fifths":-5},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3},{"name":"Gb / Ab","voicing":[54,58,61],"voicing_names":["Gb3","Bb3","Db4"],"key_fifths":-6},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4}]'::jsonb AS chord_progression
) AS chords
WHERE s.map_category = 'basic'
  AND s.stage_number = v.stage_number
  AND s.play_mode = 'code_run'
  AND s.block_key = 'rock_with_you';

INSERT INTO public.survival_stages (
  map_category,
  stage_number,
  stage_type,
  play_mode,
  name,
  name_en,
  difficulty,
  chord_suffix,
  chord_display_name,
  chord_display_name_en,
  root_pattern,
  root_pattern_name,
  root_pattern_name_en,
  block_key,
  is_mixed_stage,
  mixed_group_key,
  chord_progression,
  lesson_only,
  run_map_id,
  run_time_limit_sec,
  run_dialogue_script,
  production_staff_hint_mode,
  production_keyboard_hint_mode
)
VALUES (
  'basic',
  211,
  'progression',
  'code_run',
  '開発: コードラン Rock With You 5',
  'Dev: Code Run Rock With You 5',
  'normal',
  '',
  'Rock With You',
  'Rock With You',
  NULL,
  '',
  '',
  'rock_with_you',
  false,
  NULL,
  '[{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Cb / Db","voicing":[59,62,66],"voicing_names":["B3","D4","F#4"],"key_fifths":-5},{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3},{"name":"Gb / Ab","voicing":[54,58,61],"voicing_names":["Gb3","Bb3","Db4"],"key_fifths":-6},{"name":"Ab / Bb","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4}]'::jsonb,
  true,
  'dev_run_15',
  110,
  NULL,
  'fade_15s',
  'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
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
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

UPDATE public.lessons
SET
  description = 'Rock With You のフル進行（11コード）を dev_run_11〜15 マップでプレイする開発者向けテストです。',
  description_en = 'Developer test for the full Rock With You progression (11 chords) on dev_run_11–15 maps.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-rock-with-you-lesson');

UPDATE public.lesson_songs
SET survival_stage_number = 201, order_index = 0, title = '課題（dev_run_11）', title_en = 'Assignment (dev_run_11)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-a');

UPDATE public.lesson_songs
SET survival_stage_number = 202, order_index = 1, title = '課題（dev_run_12）', title_en = 'Assignment (dev_run_12)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-b');

UPDATE public.lesson_songs
SET survival_stage_number = 203, order_index = 2, title = '課題（dev_run_13）', title_en = 'Assignment (dev_run_13)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-c');

UPDATE public.lesson_songs
SET survival_stage_number = 204, order_index = 3, title = '課題（dev_run_14）', title_en = 'Assignment (dev_run_14)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-d');

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number, survival_map_category,
  is_ear_training, ear_training_stage_id, title, title_en, survival_lesson_overrides
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-rock-with-you-lesson'),
  NULL, 4, '{"count":1,"rank":"C"}'::jsonb,
  false, NULL, true, 211, 'basic', false, NULL,
  '課題（dev_run_15）', 'Assignment (dev_run_15)',
  '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  survival_lesson_overrides = EXCLUDED.survival_lesson_overrides;

COMMIT;
