-- コード名を隠して譜面の音符を読む sight-reading 系課題を追加。
-- 対象: 耳コピバトル chord_quiz / サバイバル / 風船ラッシュ。

BEGIN;

ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS hide_chord_names_in_battle boolean NOT NULL DEFAULT false;

ALTER TABLE public.survival_stages
  ADD COLUMN IF NOT EXISTS hide_chord_names_in_battle boolean NOT NULL DEFAULT false;

ALTER TABLE public.balloon_rush_stages
  ADD COLUMN IF NOT EXISTS hide_chord_names_in_battle boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_stages.hide_chord_names_in_battle IS
  'コードクイズでコード名/HUD チップを隠し、譜面の音符だけで出題する';
COMMENT ON COLUMN public.survival_stages.hide_chord_names_in_battle IS
  'サバイバル/コードラン中央譜面でコード名ラベルを隠し、譜面の音符だけで出題する';
COMMENT ON COLUMN public.balloon_rush_stages.hide_chord_names_in_battle IS
  '風船ラッシュ中央譜面でコード名ラベルを隠し、譜面の音符だけで出題する';

DELETE FROM public.lesson_songs
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-survival-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-balloon-lsong')
);

DELETE FROM public.lessons
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-survival-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-balloon-lesson')
);

DELETE FROM public.ear_training_chord_quiz_items
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-stage');

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-stage');

INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, key_fifths, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase,
  count_in_beats, time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active, mode,
  quiz_duration_seconds, quiz_question_order, quiz_show_notation_in_battle,
  hide_chord_names_in_battle, quiz_required_correct_count, show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-stage'),
  'dev-sightreading-chord-quiz-cde-triads',
  '譜読みコードクイズ CDE（開発テスト）',
  'Sight-reading chord quiz C/D/E (dev test)',
  'コード名とコードチップを隠し、譜面に常時表示される C/D/E トライアドを読んで弾くテストです。',
  'Chord names and HUD chips are hidden. Read always-visible C/D/E triads from the staff.',
  100, 0, 4, 4, 2, 6,
  0, 180, 100, 80,
  0, 0, 0, 0,
  0, 10, 0, 2,
  'blue_club', true, 'chord_quiz',
  90, 'sequential', true,
  true, 3, false
);

INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-i0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-stage'),
    0, 1, 1, 4, 'C',
    ARRAY['C4', 'E4', 'G4']::text[],
    ARRAY[1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-i1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-stage'),
    1, 1, 1, 4, 'D',
    ARRAY['D4', 'F#4', 'A4']::text[],
    ARRAY[1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-i2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-stage'),
    2, 1, 1, 4, 'E',
    ARRAY['E4', 'G#4', 'B4']::text[],
    ARRAY[1, 1, 1]::smallint[]
  );

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, production_staff_hint_mode, production_keyboard_hint_mode,
  hide_chord_names_in_battle
) VALUES (
  'lesson', 901, 'progression', 'survival',
  '開発: 譜読みサバイバル',
  'Dev: sight-reading survival',
  'easy',
  '', '譜読み', 'Sight-reading',
  NULL, '', '',
  'sightreading', false, NULL,
  '[
    {"name":"C","voicing":[60,64,67],"voicing_names":["C4","E4","G4"],"key_fifths":0,"voicing_staves":[1,1,1]},
    {"name":"D","voicing":[62,66,69],"voicing_names":["D4","F#4","A4"],"key_fifths":0,"voicing_staves":[1,1,1]},
    {"name":"E","voicing":[64,68,71],"voicing_names":["E4","G#4","B4"],"key_fifths":0,"voicing_staves":[1,1,1]}
  ]'::jsonb,
  true, 'always', 'hidden_until_pressed',
  true
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
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.balloon_rush_stages (
  id, slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern, allowed_chords, chord_progression,
  time_limit_sec, pop_quota, balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active,
  production_staff_hint_mode, production_keyboard_hint_mode, hide_chord_names_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-balloon-stage'),
  'dev-sightreading-balloon-cde-triads',
  '譜読み風船ラッシュ CDE（開発テスト）',
  'Sight-reading Balloon Rush C/D/E (dev test)',
  'コード名を隠し、譜面に常時表示される C/D/E トライアドを読んで風船を割るテストです。',
  'Chord names are hidden. Read always-visible C/D/E triads from the staff and pop balloons.',
  'progression', '', NULL, NULL,
  '[
    {"name":"C","voicing":[60,64,67],"voicing_names":["C4","E4","G4"],"key_fifths":0,"voicing_staves":[1,1,1]},
    {"name":"D","voicing":[62,66,69],"voicing_names":["D4","F#4","A4"],"key_fifths":0,"voicing_staves":[1,1,1]},
    {"name":"E","voicing":[64,68,71],"voicing_names":["E4","G#4","B4"],"key_fifths":0,"voicing_staves":[1,1,1]}
  ]'::jsonb,
  90, 6, 10, 4, 3,
  'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3',
  0, true, true,
  'always', 'hidden_until_pressed', true
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  stage_type = EXCLUDED.stage_type,
  chord_suffix = EXCLUDED.chord_suffix,
  root_pattern = EXCLUDED.root_pattern,
  allowed_chords = EXCLUDED.allowed_chords,
  chord_progression = EXCLUDED.chord_progression,
  time_limit_sec = EXCLUDED.time_limit_sec,
  pop_quota = EXCLUDED.pop_quota,
  balloon_lifetime_sec = EXCLUDED.balloon_lifetime_sec,
  max_concurrent = EXCLUDED.max_concurrent,
  respawn_delay_sec = EXCLUDED.respawn_delay_sec,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  lesson_only = EXCLUDED.lesson_only,
  is_active = EXCLUDED.is_active,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  hide_chord_names_in_battle = EXCLUDED.hide_chord_names_in_battle,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-lesson'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
    '譜読みコードクイズ（テスト）',
    'Sight-reading chord quiz (test)',
    'コード名なし・譜面常時表示のバトルコードクイズです。',
    'Battle chord quiz with hidden chord names and always-visible staff notes.',
    false, 9101, 1, 'テスト', 'Test',
    '[]'::jsonb,
    'コード名ではなく、譜面の音符を読んで C/D/E トライアドを弾いてください。',
    'Read the staff notes, not chord names, and play C/D/E triads.'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-survival-lesson'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
    '譜読みサバイバル（テスト）',
    'Sight-reading survival (test)',
    'コード名なし・譜面常時表示のサバイバル課題です。',
    'Survival assignment with hidden chord names and always-visible staff notes.',
    false, 9102, 1, 'テスト', 'Test',
    '[]'::jsonb,
    '譜面の音符を読んで敵を倒してください。コード名ラベルは表示されません。',
    'Read the staff notes to defeat enemies. Chord labels are hidden.'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-balloon-lesson'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
    '譜読み風船ラッシュ（テスト）',
    'Sight-reading Balloon Rush (test)',
    'コード名なし・譜面常時表示の風船ラッシュ課題です。',
    'Balloon Rush assignment with hidden chord names and always-visible staff notes.',
    false, 9103, 1, 'テスト', 'Test',
    '[]'::jsonb,
    '譜面の音符を読んで風船を割ってください。コード名ラベルは表示されません。',
    'Read the staff notes to pop balloons. Chord labels are hidden.'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category,
  is_balloon_rush, balloon_rush_stage_id,
  is_ear_training, ear_training_stage_id,
  title, title_en
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-lsong'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-lesson'),
    NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
    FALSE, NULL,
    FALSE, NULL, NULL,
    FALSE, NULL,
    TRUE, uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-ear-quiz-stage'),
    '課題（譜読みコードクイズ）',
    'Assignment (sight-reading chord quiz)'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-survival-lsong'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-survival-lesson'),
    NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
    FALSE, NULL,
    TRUE, 901, 'lesson',
    FALSE, NULL,
    FALSE, NULL,
    '課題（譜読みサバイバル）',
    'Assignment (sight-reading survival)'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-balloon-lsong'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-sightreading-balloon-lesson'),
    NULL, 0, '{"count":1,"rank":"C"}'::jsonb,
    FALSE, NULL,
    FALSE, NULL, NULL,
    TRUE, (SELECT id FROM public.balloon_rush_stages WHERE slug = 'dev-sightreading-balloon-cde-triads'),
    FALSE, NULL,
    '課題（譜読み風船ラッシュ）',
    'Assignment (sight-reading Balloon Rush)'
  )
ON CONFLICT (id) DO UPDATE SET
  clear_conditions = EXCLUDED.clear_conditions,
  is_fantasy = EXCLUDED.is_fantasy,
  fantasy_stage_id = EXCLUDED.fantasy_stage_id,
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
