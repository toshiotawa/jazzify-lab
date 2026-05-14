-- chord_quiz 開発用ステージ + 開発者テストコースへの課題リンク。

BEGIN;

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-chord-quiz-lsong'
);

DELETE FROM public.lessons
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-chord-quiz-lesson'
);

DELETE FROM public.ear_training_chord_quiz_items
WHERE stage_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-chord-quiz-stage'
);

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-chord-quiz-stage'
);

INSERT INTO public.ear_training_stages (
  id,
  slug,
  title,
  title_en,
  description,
  description_en,
  bpm,
  key_fifths,
  beats_per_measure,
  beat_type,
  loop_measures,
  max_loops_per_phrase,
  count_in_beats,
  time_limit_sec,
  player_hp,
  enemy_hp,
  per_correct_note_damage,
  good_completion_damage,
  great_completion_damage,
  perfect_completion_damage,
  miss_damage,
  fail_damage,
  perfect_max_misses,
  great_max_misses,
  background_theme,
  is_active,
  mode,
  quiz_duration_seconds,
  quiz_question_order,
  quiz_show_notation_in_battle,
  quiz_required_correct_count
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
  'dev-chord-quiz-bpm0-test',
  'コードクイズ（開発テスト）',
  'Chord quiz (dev test)',
  '90秒で正解数を競う chord_quiz。譜面はバトル本番で非表示（音符のみ隠す）のテスト設定。',
  'Timed chord quiz (90s). Battle notation hidden for testing.',
  100,
  0,
  4,
  4,
  2,
  6,
  0,
  180,
  100,
  80,
  0,
  0,
  0,
  0,
  0,
  10,
  0,
  2,
  'blue_club',
  true,
  'chord_quiz',
  90,
  'random',
  false,
  10
);

INSERT INTO public.ear_training_chord_quiz_items (
  id,
  stage_id,
  order_index,
  chord_name,
  voicing,
  voicing_staves
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    0,
    'CM7',
    ARRAY['C3', 'E3', 'G3', 'B3']::text[],
    ARRAY[2, 2, 2, 2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    1,
    'Dm7',
    ARRAY['D3', 'F3', 'A3', 'C4']::text[],
    ARRAY[2, 2, 2, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    2,
    'G7',
    ARRAY['G3', 'B3', 'D4', 'F4']::text[],
    ARRAY[2, 2, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    3,
    'Am7',
    ARRAY['A2', 'C4', 'E4', 'G4']::text[],
    ARRAY[2, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i4'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    4,
    'FM7',
    ARRAY['F3', 'A3', 'C4', 'E4']::text[],
    ARRAY[2, 2, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i5'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    5,
    'Em7',
    ARRAY['E3', 'G3', 'B3', 'D4']::text[],
    ARRAY[2, 2, 2, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i6'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    6,
    'Dm7b5',
    ARRAY['D3', 'F3', 'Ab3', 'C4']::text[],
    ARRAY[2, 2, 2, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i7'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    7,
    'G7b9',
    ARRAY['G3', 'Bb3', 'D4', 'Ab4']::text[],
    ARRAY[2, 2, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i8'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    8,
    'CM9',
    ARRAY['C3', 'E3', 'G3', 'D4']::text[],
    ARRAY[2, 2, 2, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cq-i9'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
    9,
    'FM9',
    ARRAY['F3', 'A3', 'C4', 'G4']::text[],
    ARRAY[2, 2, 1, 1]::smallint[]
  );

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'コードクイズ（テスト）',
  'Chord quiz (test)',
  '開発用コードクイズ（chord_quiz）タイムアタック課題です。',
  'Developer chord-quiz timed challenge.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  'コードクイズで規定の正答数まで到達してください（クリアとして記録されます）。',
  'Reach the required correct count in chord quiz.'
FROM (
  SELECT MAX(order_index) AS max_o
  FROM public.lessons
  WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')
) mx;

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
  is_ear_training,
  ear_training_stage_id,
  title,
  title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-lesson'),
  null,
  0,
  '{"count":1,"rank":"B"}'::jsonb,
  false,
  null,
  false,
  null,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-quiz-stage'),
  '課題（コードクイズ）',
  'Assignment (chord quiz)'
);

COMMIT;
