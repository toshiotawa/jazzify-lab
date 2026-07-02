-- Developer test course: Savoy Db6(9) fix + Sir Duke / Moanin / Killer Joe / Rock With You Code Run lessons
-- Maps: dev_run_11+, specialty code_run_* maps not used by chord-run beginner course
BEGIN;

-- Savoy: Db6(9) の 3rd を C → Bb に修正（全6ステージ）
UPDATE public.survival_stages s
SET
  chord_progression = sub.fixed,
  updated_at = now()
FROM (
  SELECT
    ss.map_category,
    ss.stage_number,
    jsonb_agg(
      CASE
        WHEN elem->>'name' = 'Db6(9)' THEN
          jsonb_set(
            jsonb_set(
              elem,
              '{voicing}',
              '[53,56,58,63]'::jsonb
            ),
            '{voicing_names}',
            '["F3","Ab3","Bb3","Eb4"]'::jsonb
          )
        ELSE elem
      END
      ORDER BY ord
    ) AS fixed
  FROM public.survival_stages ss
  CROSS JOIN LATERAL jsonb_array_elements(ss.chord_progression) WITH ORDINALITY AS t(elem, ord)
  WHERE ss.map_category = 'basic'
    AND ss.stage_number BETWEEN 183 AND 188
    AND ss.play_mode = 'code_run'
    AND ss.block_key = 'savoy'
  GROUP BY ss.map_category, ss.stage_number
) sub
WHERE s.map_category = sub.map_category
  AND s.stage_number = sub.stage_number;

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
    ('basic', 189, 'progression', 'code_run', '開発: コードラン Sir Duke 1', 'Dev: Code Run Sir Duke 1', 'normal', '', 'Sir Duke', 'Sir Duke', NULL, '', '', 'sir_duke', '[{"name":"BM7(9)","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":5},{"name":"Fm7(9)","voicing":[56,60,63,67],"voicing_names":["Ab3","C4","Eb4","G4"],"key_fifths":1},{"name":"EM7(9)","voicing":[56,59,63,66],"voicing_names":["G#3","B3","D#4","F#4"],"key_fifths":4},{"name":"D#m7","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":3},{"name":"C#m7(9)","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5},{"name":"C#m7(9) / F#","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5}]'::jsonb, 'dev_run_11'),
    ('basic', 190, 'progression', 'code_run', '開発: コードラン Sir Duke 2', 'Dev: Code Run Sir Duke 2', 'normal', '', 'Sir Duke', 'Sir Duke', NULL, '', '', 'sir_duke', '[{"name":"BM7(9)","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":5},{"name":"Fm7(9)","voicing":[56,60,63,67],"voicing_names":["Ab3","C4","Eb4","G4"],"key_fifths":1},{"name":"EM7(9)","voicing":[56,59,63,66],"voicing_names":["G#3","B3","D#4","F#4"],"key_fifths":4},{"name":"D#m7","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":3},{"name":"C#m7(9)","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5},{"name":"C#m7(9) / F#","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5}]'::jsonb, 'dev_run_12'),
    ('basic', 191, 'progression', 'code_run', '開発: コードラン Sir Duke 3', 'Dev: Code Run Sir Duke 3', 'normal', '', 'Sir Duke', 'Sir Duke', NULL, '', '', 'sir_duke', '[{"name":"BM7(9)","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":5},{"name":"Fm7(9)","voicing":[56,60,63,67],"voicing_names":["Ab3","C4","Eb4","G4"],"key_fifths":1},{"name":"EM7(9)","voicing":[56,59,63,66],"voicing_names":["G#3","B3","D#4","F#4"],"key_fifths":4},{"name":"D#m7","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":3},{"name":"C#m7(9)","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5},{"name":"C#m7(9) / F#","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5}]'::jsonb, 'dev_run_13'),
    ('basic', 192, 'progression', 'code_run', '開発: コードラン Sir Duke 4', 'Dev: Code Run Sir Duke 4', 'normal', '', 'Sir Duke', 'Sir Duke', NULL, '', '', 'sir_duke', '[{"name":"BM7(9)","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":5},{"name":"Fm7(9)","voicing":[56,60,63,67],"voicing_names":["Ab3","C4","Eb4","G4"],"key_fifths":1},{"name":"EM7(9)","voicing":[56,59,63,66],"voicing_names":["G#3","B3","D#4","F#4"],"key_fifths":4},{"name":"D#m7","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":3},{"name":"C#m7(9)","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5},{"name":"C#m7(9) / F#","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5}]'::jsonb, 'dev_run_14'),
    ('basic', 193, 'progression', 'code_run', '開発: コードラン Sir Duke 5', 'Dev: Code Run Sir Duke 5', 'normal', '', 'Sir Duke', 'Sir Duke', NULL, '', '', 'sir_duke', '[{"name":"BM7(9)","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":5},{"name":"Fm7(9)","voicing":[56,60,63,67],"voicing_names":["Ab3","C4","Eb4","G4"],"key_fifths":1},{"name":"EM7(9)","voicing":[56,59,63,66],"voicing_names":["G#3","B3","D#4","F#4"],"key_fifths":4},{"name":"D#m7","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":3},{"name":"C#m7(9)","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5},{"name":"C#m7(9) / F#","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5}]'::jsonb, 'dev_run_15'),
    ('basic', 194, 'progression', 'code_run', '開発: コードラン Sir Duke 6', 'Dev: Code Run Sir Duke 6', 'normal', '', 'Sir Duke', 'Sir Duke', NULL, '', '', 'sir_duke', '[{"name":"BM7(9)","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":5},{"name":"Fm7(9)","voicing":[56,60,63,67],"voicing_names":["Ab3","C4","Eb4","G4"],"key_fifths":1},{"name":"EM7(9)","voicing":[56,59,63,66],"voicing_names":["G#3","B3","D#4","F#4"],"key_fifths":4},{"name":"D#m7","voicing":[58,61,63,66],"voicing_names":["A#3","C#4","D#4","F#4"],"key_fifths":3},{"name":"C#m7(9)","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5},{"name":"C#m7(9) / F#","voicing":[59,63,64,68],"voicing_names":["B3","D#4","E4","G#4"],"key_fifths":5}]'::jsonb, 'code_run_athletic_01'),
    ('basic', 195, 'progression', 'code_run', '開発: コードラン Moanin 1', 'Dev: Code Run Moanin 1', 'normal', '', 'Moanin', 'Moanin', NULL, '', '', 'moanin', '[{"name":"Bb / F","voicing":[53,58,62],"voicing_names":["F3","Bb3","D4"],"key_fifths":1},{"name":"F","voicing":[53,57,60],"voicing_names":["F3","A3","C4"],"key_fifths":1}]'::jsonb, 'graveyard_run_02'),
    ('basic', 196, 'progression', 'code_run', '開発: コードラン Moanin 2', 'Dev: Code Run Moanin 2', 'normal', '', 'Moanin', 'Moanin', NULL, '', '', 'moanin', '[{"name":"Bb / F","voicing":[53,58,62],"voicing_names":["F3","Bb3","D4"],"key_fifths":1},{"name":"F","voicing":[53,57,60],"voicing_names":["F3","A3","C4"],"key_fifths":1}]'::jsonb, 'graveyard_run_03'),
    ('basic', 197, 'progression', 'code_run', '開発: コードラン Moanin 3', 'Dev: Code Run Moanin 3', 'normal', '', 'Moanin', 'Moanin', NULL, '', '', 'moanin', '[{"name":"Bb / F","voicing":[53,58,62],"voicing_names":["F3","Bb3","D4"],"key_fifths":1},{"name":"F","voicing":[53,57,60],"voicing_names":["F3","A3","C4"],"key_fifths":1}]'::jsonb, 'code_run_crate_cave_01'),
    ('basic', 198, 'progression', 'code_run', '開発: コードラン Killer Joe 1', 'Dev: Code Run Killer Joe 1', 'normal', '', 'Killer Joe', 'Killer Joe', NULL, '', '', 'killer_joe', '[{"name":"C7(9.13)","voicing":[52,57,58,62],"voicing_names":["E3","A3","Bb3","D4"],"key_fifths":0},{"name":"Bb7(9.13)","voicing":[50,55,56,60],"voicing_names":["D3","G3","Ab3","C4"],"key_fifths":-1}]'::jsonb, 'code_run_crate_bars_01'),
    ('basic', 199, 'progression', 'code_run', '開発: コードラン Killer Joe 2', 'Dev: Code Run Killer Joe 2', 'normal', '', 'Killer Joe', 'Killer Joe', NULL, '', '', 'killer_joe', '[{"name":"C7(9.13)","voicing":[52,57,58,62],"voicing_names":["E3","A3","Bb3","D4"],"key_fifths":0},{"name":"Bb7(9.13)","voicing":[50,55,56,60],"voicing_names":["D3","G3","Ab3","C4"],"key_fifths":-1}]'::jsonb, 'code_run_spike_gap_recovery_01'),
    ('basic', 200, 'progression', 'code_run', '開発: コードラン Killer Joe 3', 'Dev: Code Run Killer Joe 3', 'normal', '', 'Killer Joe', 'Killer Joe', NULL, '', '', 'killer_joe', '[{"name":"C7(9.13)","voicing":[52,57,58,62],"voicing_names":["E3","A3","Bb3","D4"],"key_fifths":0},{"name":"Bb7(9.13)","voicing":[50,55,56,60],"voicing_names":["D3","G3","Ab3","C4"],"key_fifths":-1}]'::jsonb, 'code_run_jump_only_01'),
    ('basic', 201, 'progression', 'code_run', '開発: コードラン Rock With You A', 'Dev: Code Run Rock With You A', 'normal', '', 'Rock With You', 'Rock With You', NULL, '', '', 'rock_with_you', '[{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3}]'::jsonb, 'code_run_big_underground_01'),
    ('basic', 202, 'progression', 'code_run', '開発: コードラン Rock With You B', 'Dev: Code Run Rock With You B', 'normal', '', 'Rock With You', 'Rock With You', NULL, '', '', 'rock_with_you', '[{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Cb / Db","voicing":[59,62,66],"voicing_names":["B3","D4","F#4"],"key_fifths":-5}]'::jsonb, 'tower_run_01'),
    ('basic', 203, 'progression', 'code_run', '開発: コードラン Rock With You C', 'Dev: Code Run Rock With You C', 'normal', '', 'Rock With You', 'Rock With You', NULL, '', '', 'rock_with_you', '[{"name":"Ebm7","voicing":[54,58,61,65],"voicing_names":["Gb3","Bb3","Db4","F4"],"key_fifths":-3},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4},{"name":"Bb / Ab","voicing":[58,62,65],"voicing_names":["Bb3","D4","F4"],"key_fifths":-3}]'::jsonb, 'code_run_crate_tower_02'),
    ('basic', 204, 'progression', 'code_run', '開発: コードラン Rock With You D', 'Dev: Code Run Rock With You D', 'normal', '', 'Rock With You', 'Rock With You', NULL, '', '', 'rock_with_you', '[{"name":"Gb / Ab","voicing":[54,58,61],"voicing_names":["Gb3","Bb3","Db4"],"key_fifths":-6},{"name":"Ab","voicing":[56,60,63],"voicing_names":["Ab3","C4","Eb4"],"key_fifths":-4}]'::jsonb, 'snow_climb_run_01')
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
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

-- Lessons (1 song = 1 lesson)
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, v.lesson_key),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  v.title, v.title_en, v.description, v.description_en,
  false,
  COALESCE(mx.max_o, 0) + v.order_offset,
  1, 'テスト', 'Test',
  '[]'::jsonb,
  v.assignment_description, v.assignment_description_en
FROM (
  VALUES
    ('dev-survival-code-run-sir-duke-lesson', 1, 'サバイバル: コードラン Sir Duke（テスト）', 'Survival: Code Run Sir Duke (test)', 'Sir Duke のコード進行を dev_run_11〜15 と athletic マップでプレイする開発者向けテストです。', 'Developer test for the Sir Duke chord progression on dev_run_11–15 and athletic maps.', '各課題を順番にクリアしてください。', 'Clear each assignment in order.'),
    ('dev-survival-code-run-moanin-lesson', 2, 'サバイバル: コードラン Moanin（テスト）', 'Survival: Code Run Moanin (test)', 'Moanin のコード進行（Bb/F・F）を graveyard / crate cave マップでプレイする開発者向けテストです。', 'Developer test for Moanin on graveyard and crate cave Code Run maps.', '各課題を順番にクリアしてください。', 'Clear each assignment in order.'),
    ('dev-survival-code-run-killer-joe-lesson', 3, 'サバイバル: コードラン Killer Joe（テスト）', 'Survival: Code Run Killer Joe (test)', 'Killer Joe のコード進行を crate bars / spike / jump マップでプレイする開発者向けテストです。', 'Developer test for Killer Joe on specialty Code Run maps.', '各課題を順番にクリアしてください。', 'Clear each assignment in order.'),
    ('dev-survival-code-run-rock-with-you-lesson', 4, 'サバイバル: コードラン Rock With You（テスト）', 'Survival: Code Run Rock With You (test)', 'Rock With You の4パターン進行を big underground / tower / crate tower / snow climb マップでプレイする開発者向けテストです。', 'Developer test for Rock With You section progressions on four specialty Code Run maps.', '各課題を順番にクリアしてください。', 'Clear each assignment in order.')
) AS v(lesson_key, order_offset, title, title_en, description, description_en, assignment_description, assignment_description_en)
CROSS JOIN (
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
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number, survival_map_category,
  is_ear_training, ear_training_stage_id, title, title_en, survival_lesson_overrides
) VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-sir-duke-lsong-11'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-sir-duke-lesson'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 189, 'basic', false, NULL, '課題（dev_run_11）', 'Assignment (dev_run_11)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-sir-duke-lsong-12'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-sir-duke-lesson'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 190, 'basic', false, NULL, '課題（dev_run_12）', 'Assignment (dev_run_12)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-sir-duke-lsong-13'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-sir-duke-lesson'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 191, 'basic', false, NULL, '課題（dev_run_13）', 'Assignment (dev_run_13)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-sir-duke-lsong-14'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-sir-duke-lesson'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 192, 'basic', false, NULL, '課題（dev_run_14）', 'Assignment (dev_run_14)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-sir-duke-lsong-15'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-sir-duke-lesson'), NULL, 4, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 193, 'basic', false, NULL, '課題（dev_run_15）', 'Assignment (dev_run_15)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-sir-duke-lsong-ath'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-sir-duke-lesson'), NULL, 5, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 194, 'basic', false, NULL, '課題（athletic）', 'Assignment (athletic)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-moanin-lsong-g2'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-moanin-lesson'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 195, 'basic', false, NULL, '課題（graveyard_run_02）', 'Assignment (graveyard_run_02)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-moanin-lsong-g3'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-moanin-lesson'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 196, 'basic', false, NULL, '課題（graveyard_run_03）', 'Assignment (graveyard_run_03)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-moanin-lsong-cave'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-moanin-lesson'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 197, 'basic', false, NULL, '課題（crate_cave）', 'Assignment (crate_cave)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-killer-lsong-bars'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-killer-joe-lesson'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 198, 'basic', false, NULL, '課題（crate_bars）', 'Assignment (crate_bars)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-killer-lsong-spike'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-killer-joe-lesson'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 199, 'basic', false, NULL, '課題（spike_gap）', 'Assignment (spike_gap)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-killer-lsong-jump'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-killer-joe-lesson'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 200, 'basic', false, NULL, '課題（jump_only）', 'Assignment (jump_only)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-a'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-rock-with-you-lesson'), NULL, 0, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 201, 'basic', false, NULL, '課題（A: Ebm7-Ab-Bb/Ab）', 'Assignment (A)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-b'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-rock-with-you-lesson'), NULL, 1, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 202, 'basic', false, NULL, '課題（B: Cb/Db）', 'Assignment (B)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-c'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-rock-with-you-lesson'), NULL, 2, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 203, 'basic', false, NULL, '課題（C: リフリート）', 'Assignment (C)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cr-rock-lsong-d'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-rock-with-you-lesson'), NULL, 3, '{"count":1,"rank":"C"}'::jsonb, false, NULL, true, 204, 'basic', false, NULL, '課題（D: Gb/Ab）', 'Assignment (D)', '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb)
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
