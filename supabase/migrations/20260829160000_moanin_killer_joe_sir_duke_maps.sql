-- Moanin / Killer Joe: original chord progressions + Sir Duke map layout (dev_run_11–15 + athletic)
BEGIN;

-- Moanin stages 195–200 (6 maps, same as Sir Duke; 198–200 were formerly Killer Joe)
UPDATE public.survival_stages AS s
SET
  name = v.name,
  name_en = v.name_en,
  chord_display_name = 'Moanin',
  chord_display_name_en = 'Moanin',
  block_key = 'moanin',
  chord_progression = chords.chord_progression,
  run_map_id = v.run_map_id,
  updated_at = now()
FROM (
  VALUES
    (195, '開発: コードラン Moanin 1', 'Dev: Code Run Moanin 1', 'dev_run_11'),
    (196, '開発: コードラン Moanin 2', 'Dev: Code Run Moanin 2', 'dev_run_12'),
    (197, '開発: コードラン Moanin 3', 'Dev: Code Run Moanin 3', 'dev_run_13'),
    (198, '開発: コードラン Moanin 4', 'Dev: Code Run Moanin 4', 'dev_run_14'),
    (199, '開発: コードラン Moanin 5', 'Dev: Code Run Moanin 5', 'dev_run_15'),
    (200, '開発: コードラン Moanin 6', 'Dev: Code Run Moanin 6', 'code_run_athletic_01')
) AS v(stage_number, name, name_en, run_map_id)
CROSS JOIN (
  SELECT '[{"name":"Bb / F","voicing":[53,58,62],"voicing_names":["F3","Bb3","D4"],"key_fifths":1},{"name":"F","voicing":[53,57,60],"voicing_names":["F3","A3","C4"],"key_fifths":1}]'::jsonb AS chord_progression
) AS chords
WHERE s.map_category = 'basic'
  AND s.stage_number = v.stage_number
  AND s.play_mode = 'code_run'
  AND s.stage_number BETWEEN 195 AND 200;

-- Killer Joe stages 205–210 (6 maps, same as Sir Duke)
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
  'basic',
  v.stage_number,
  'progression',
  'code_run',
  v.name,
  v.name_en,
  'normal',
  '',
  'Killer Joe',
  'Killer Joe',
  NULL,
  '',
  '',
  'killer_joe',
  false,
  NULL,
  '[{"name":"C7(9.13)","voicing":[52,57,58,62],"voicing_names":["E3","A3","Bb3","D4"],"key_fifths":0},{"name":"Bb7(9.13)","voicing":[50,55,56,60],"voicing_names":["D3","G3","Ab3","C4"],"key_fifths":-1}]'::jsonb,
  true,
  v.run_map_id,
  110,
  NULL,
  'fade_15s',
  'fade_15s'
FROM (
  VALUES
    (205, '開発: コードラン Killer Joe 1', 'Dev: Code Run Killer Joe 1', 'dev_run_11'),
    (206, '開発: コードラン Killer Joe 2', 'Dev: Code Run Killer Joe 2', 'dev_run_12'),
    (207, '開発: コードラン Killer Joe 3', 'Dev: Code Run Killer Joe 3', 'dev_run_13'),
    (208, '開発: コードラン Killer Joe 4', 'Dev: Code Run Killer Joe 4', 'dev_run_14'),
    (209, '開発: コードラン Killer Joe 5', 'Dev: Code Run Killer Joe 5', 'dev_run_15'),
    (210, '開発: コードラン Killer Joe 6', 'Dev: Code Run Killer Joe 6', 'code_run_athletic_01')
) AS v(stage_number, name, name_en, run_map_id)
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
  description = 'Moanin のコード進行（Bb/F・F）を Sir Duke と同じ dev_run_11〜15 と athletic マップでプレイする開発者向けテストです。',
  description_en = 'Developer test for Moanin (Bb/F, F) on the same dev_run_11–15 and athletic maps as Sir Duke.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-moanin-lesson');

UPDATE public.lessons
SET
  description = 'Killer Joe のコード進行を Sir Duke と同じ dev_run_11〜15 と athletic マップでプレイする開発者向けテストです。',
  description_en = 'Developer test for Killer Joe on the same dev_run_11–15 and athletic maps as Sir Duke.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-killer-joe-lesson');

-- Moanin lesson_songs (6 assignments)
UPDATE public.lesson_songs
SET
  survival_stage_number = 195,
  order_index = 0,
  title = '課題（dev_run_11）',
  title_en = 'Assignment (dev_run_11)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-moanin-lsong-g2');

UPDATE public.lesson_songs
SET
  survival_stage_number = 196,
  order_index = 1,
  title = '課題（dev_run_12）',
  title_en = 'Assignment (dev_run_12)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-moanin-lsong-g3');

UPDATE public.lesson_songs
SET
  survival_stage_number = 197,
  order_index = 2,
  title = '課題（dev_run_13）',
  title_en = 'Assignment (dev_run_13)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-moanin-lsong-cave');

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number, survival_map_category,
  is_ear_training, ear_training_stage_id, title, title_en, survival_lesson_overrides
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-moanin-lsong-14'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-moanin-lesson'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 198, 'basic', false, NULL, '課題（dev_run_14）', 'Assignment (dev_run_14)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-moanin-lsong-15'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-moanin-lesson'), NULL, 4, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 199, 'basic', false, NULL, '課題（dev_run_15）', 'Assignment (dev_run_15)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-moanin-lsong-ath'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-moanin-lesson'), NULL, 5, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 200, 'basic', false, NULL, '課題（athletic）', 'Assignment (athletic)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb)
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

-- Killer Joe lesson_songs (6 assignments, stages 205–210)
UPDATE public.lesson_songs
SET
  survival_stage_number = 205,
  order_index = 0,
  title = '課題（dev_run_11）',
  title_en = 'Assignment (dev_run_11)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-killer-lsong-bars');

UPDATE public.lesson_songs
SET
  survival_stage_number = 206,
  order_index = 1,
  title = '課題（dev_run_12）',
  title_en = 'Assignment (dev_run_12)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-killer-lsong-spike');

UPDATE public.lesson_songs
SET
  survival_stage_number = 207,
  order_index = 2,
  title = '課題（dev_run_13）',
  title_en = 'Assignment (dev_run_13)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-killer-lsong-jump');

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number, survival_map_category,
  is_ear_training, ear_training_stage_id, title, title_en, survival_lesson_overrides
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-killer-lsong-14'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-killer-joe-lesson'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 208, 'basic', false, NULL, '課題（dev_run_14）', 'Assignment (dev_run_14)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-killer-lsong-15'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-killer-joe-lesson'), NULL, 4, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 209, 'basic', false, NULL, '課題（dev_run_15）', 'Assignment (dev_run_15)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-killer-lsong-ath'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-killer-joe-lesson'), NULL, 5, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 210, 'basic', false, NULL, '課題（athletic）', 'Assignment (athletic)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb)
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
