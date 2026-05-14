-- 開発者テストコースに「C D E メジャートライアド」コードクイズのレッスンを1つ、課題（lesson_songs）を2つ追加。
-- 課題①: バトル中の譜面・未押下符の非表示 ON（quiz_show_notation_in_battle = false）
-- 課題②: 非表示 OFF（true / デフォルト相当）
-- UUID は uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, '<name>')

BEGIN;

DELETE FROM public.lesson_songs
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-lsong-hidden'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-lsong-shown')
);

DELETE FROM public.lessons
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-ear-cde-triad-quiz-lesson'
);

DELETE FROM public.ear_training_chord_quiz_items
WHERE stage_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-hidden'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-shown')
);

DELETE FROM public.ear_training_stages
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-hidden'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-shown')
);

-- 共通: C D E メジャートライアドのみ、90秒、必要正解数 10、プールは3問ランダムで回す
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
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-hidden'),
    'dev-chord-quiz-cde-triad-hide-notation',
    'コードクイズ CDE トライアド（符ヘッズ非表示）',
    'Chord quiz C/D/E majors (hide unpressed notation)',
    'C・D・E メジャートライアドのみ。本番で未押下の符を譜から隠します（quiz_show_notation_in_battle=false）。',
    'Major triads C, D, and E only. In battle mode, hide unplayed notes on staff.',
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
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-shown'),
    'dev-chord-quiz-cde-triad-show-notation',
    'コードクイズ CDE トライアド（符常時表示）',
    'Chord quiz C/D/E majors (always show notation)',
    'C・D・E メジャートライアドのみ。バトル中も構成音は常に譜に表示されます。',
    'Major triads C, D, and E only. All chord tones stay visible on the staff.',
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
    true,
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
  -- hidden ステージ向け
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cde-qz-h-i0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-hidden'),
    0,
    'C',
    ARRAY['C4', 'E4', 'G4']::text[],
    ARRAY[1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cde-qz-h-i1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-hidden'),
    1,
    'D',
    ARRAY['D4', 'F#4', 'A4']::text[],
    ARRAY[1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cde-qz-h-i2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-hidden'),
    2,
    'E',
    ARRAY['E4', 'G#4', 'B4']::text[],
    ARRAY[1, 1, 1]::smallint[]
  ),
  -- shown ステージ向け（同じ出題セット）
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cde-qz-s-i0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-shown'),
    0,
    'C',
    ARRAY['C4', 'E4', 'G4']::text[],
    ARRAY[1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cde-qz-s-i1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-shown'),
    1,
    'D',
    ARRAY['D4', 'F#4', 'A4']::text[],
    ARRAY[1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-cde-qz-s-i2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-shown'),
    2,
    'E',
    ARRAY['E4', 'G#4', 'B4']::text[],
    ARRAY[1, 1, 1]::smallint[]
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'コードクイズ CDE メジャートライアド',
  'Chord quiz: C D E major triads',
  'C・D・E のメジャートライアドのみ出題です。必要正解数は各課題 10（90秒タイム）。課題①はバトル中に未押下の符を隠します。課題②は構成音を常に表示します。',
  'Practice C, D, and E major triads only. Ten correct answers required per assignment within 90s. Assignment 1 hides unplayed heads; assignment 2 keeps chord tones visible.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '2つのコードクイズ課題をそれぞれクリアしてください（各10正解、符の表示設定が異なります）。',
  'Clear both chord-quiz assignments (10 correct each; different notation visibility).'
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
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-lsong-hidden'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-lesson'),
    NULL,
    0,
    '{"count":1,"rank":"S"}'::jsonb,
    FALSE,
    NULL,
    FALSE,
    NULL,
    TRUE,
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-hidden'),
    '課題① バトルで符非表示（ON）',
    'Assignment 1: Hide unplayed notes in battle'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-lsong-shown'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-lesson'),
    NULL,
    1,
    '{"count":1,"rank":"S"}'::jsonb,
    FALSE,
    NULL,
    FALSE,
    NULL,
    TRUE,
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-cde-triad-quiz-stage-shown'),
    '課題② 構成音は常に表示（OFF）',
    'Assignment 2: Always show chord tones'
  );

COMMIT;
