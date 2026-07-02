-- Developer test course: Code Run Savoy lesson (Stompin' at the Savoy progression)
-- Maps cycle chord-run course maps: snow_run_01, dev_run_06..10
BEGIN;

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
SELECT
  v.map_category,
  v.stage_number,
  v.stage_type,
  v.play_mode,
  v.name,
  v.name_en,
  v.difficulty,
  v.chord_suffix,
  v.chord_display_name,
  v.chord_display_name_en,
  v.root_pattern,
  v.root_pattern_name,
  v.root_pattern_name_en,
  v.block_key,
  false,
  NULL,
  v.chord_progression,
  true,
  v.run_map_id,
  110,
  NULL,
  'fade_15s',
  'fade_15s'
FROM (
  VALUES
    (
      'basic', 183, 'progression', 'code_run',
      '開発: コードラン Savoy 1', 'Dev: Code Run Savoy 1',
      'normal', '', 'Savoy', 'Savoy', NULL, '', '', 'savoy',
      '[{"name":"Ab7(9.13)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5},{"name":"Bb7(b9)","voicing":[56,59,62,65],"voicing_names":["Ab3","B3","D4","F4"],"key_fifths":-4},{"name":"Ebm7(9)","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(9)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5}]'::jsonb,
      'snow_run_01'
    ),
    (
      'basic', 184, 'progression', 'code_run',
      '開発: コードラン Savoy 2', 'Dev: Code Run Savoy 2',
      'normal', '', 'Savoy', 'Savoy', NULL, '', '', 'savoy',
      '[{"name":"Ab7(9.13)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5},{"name":"Bb7(b9)","voicing":[56,59,62,65],"voicing_names":["Ab3","B3","D4","F4"],"key_fifths":-4},{"name":"Ebm7(9)","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(9)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5}]'::jsonb,
      'dev_run_06'
    ),
    (
      'basic', 185, 'progression', 'code_run',
      '開発: コードラン Savoy 3', 'Dev: Code Run Savoy 3',
      'normal', '', 'Savoy', 'Savoy', NULL, '', '', 'savoy',
      '[{"name":"Ab7(9.13)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5},{"name":"Bb7(b9)","voicing":[56,59,62,65],"voicing_names":["Ab3","B3","D4","F4"],"key_fifths":-4},{"name":"Ebm7(9)","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(9)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5}]'::jsonb,
      'dev_run_07'
    ),
    (
      'basic', 186, 'progression', 'code_run',
      '開発: コードラン Savoy 4', 'Dev: Code Run Savoy 4',
      'normal', '', 'Savoy', 'Savoy', NULL, '', '', 'savoy',
      '[{"name":"Ab7(9.13)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5},{"name":"Bb7(b9)","voicing":[56,59,62,65],"voicing_names":["Ab3","B3","D4","F4"],"key_fifths":-4},{"name":"Ebm7(9)","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(9)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5}]'::jsonb,
      'dev_run_08'
    ),
    (
      'basic', 187, 'progression', 'code_run',
      '開発: コードラン Savoy 5', 'Dev: Code Run Savoy 5',
      'normal', '', 'Savoy', 'Savoy', NULL, '', '', 'savoy',
      '[{"name":"Ab7(9.13)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5},{"name":"Bb7(b9)","voicing":[56,59,62,65],"voicing_names":["Ab3","B3","D4","F4"],"key_fifths":-4},{"name":"Ebm7(9)","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(9)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5}]'::jsonb,
      'dev_run_09'
    ),
    (
      'basic', 188, 'progression', 'code_run',
      '開発: コードラン Savoy 6', 'Dev: Code Run Savoy 6',
      'normal', '', 'Savoy', 'Savoy', NULL, '', '', 'savoy',
      '[{"name":"Ab7(9.13)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5},{"name":"Bb7(b9)","voicing":[56,59,62,65],"voicing_names":["Ab3","B3","D4","F4"],"key_fifths":-4},{"name":"Ebm7(9)","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-5},{"name":"Ab7(9)","voicing":[54,58,60,65],"voicing_names":["Gb3","Bb3","C4","F4"],"key_fifths":-4},{"name":"Db6(9)","voicing":[53,56,58,63],"voicing_names":["F3","Ab3","Bb3","Eb4"],"key_fifths":-5}]'::jsonb,
      'dev_run_10'
    )
) AS v(
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
  chord_progression,
  run_map_id
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
  is_mixed_stage = EXCLUDED.is_mixed_stage,
  mixed_group_key = EXCLUDED.mixed_group_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.lessons (
  id,
  course_id,
  title,
  title_en,
  description,
  description_en,
  premium_only,
  order_index,
  block_number,
  block_name,
  block_name_en,
  nav_links,
  assignment_description,
  assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン Savoy（テスト）',
  'Survival: Code Run Savoy (test)',
  'Stompin'' at the Savoy のコード進行を、コードランコースと同じマップで6課題プレイする開発者向けテストです。',
  'Developer test lesson playing the Stompin'' at the Savoy chord progression across six Code Run maps from the chord-run course.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '各課題を順番にクリアしてください。6コードの進行を演奏しながらゴールを目指します。',
  'Clear each assignment in order. Play the six-chord progression and reach the goal.'
FROM (
  SELECT MAX(order_index) AS max_o
  FROM public.lessons
  WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')
) mx
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  order_index,
  clear_conditions,
  is_fantasy,
  fantasy_stage_id,
  is_survival,
  survival_stage_number,
  survival_map_category,
  is_ear_training,
  ear_training_stage_id,
  title,
  title_en,
  survival_lesson_overrides
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lsong-01'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lesson'),
    NULL, 0, '{"count":1,"rank":"C"}'::jsonb, FALSE, NULL, TRUE, 183, 'basic', FALSE, NULL,
    '課題（snow_run_01）', 'Assignment (snow_run_01)',
    '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lsong-02'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lesson'),
    NULL, 1, '{"count":1,"rank":"C"}'::jsonb, FALSE, NULL, TRUE, 184, 'basic', FALSE, NULL,
    '課題（dev_run_06）', 'Assignment (dev_run_06)',
    '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lsong-03'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lesson'),
    NULL, 2, '{"count":1,"rank":"C"}'::jsonb, FALSE, NULL, TRUE, 185, 'basic', FALSE, NULL,
    '課題（dev_run_07）', 'Assignment (dev_run_07)',
    '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lsong-04'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lesson'),
    NULL, 3, '{"count":1,"rank":"C"}'::jsonb, FALSE, NULL, TRUE, 186, 'basic', FALSE, NULL,
    '課題（dev_run_08）', 'Assignment (dev_run_08)',
    '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lsong-05'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lesson'),
    NULL, 4, '{"count":1,"rank":"C"}'::jsonb, FALSE, NULL, TRUE, 187, 'basic', FALSE, NULL,
    '課題（dev_run_09）', 'Assignment (dev_run_09)',
    '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lsong-06'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-savoy-lesson'),
    NULL, 5, '{"count":1,"rank":"C"}'::jsonb, FALSE, NULL, TRUE, 188, 'basic', FALSE, NULL,
    '課題（dev_run_10）', 'Assignment (dev_run_10)',
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
