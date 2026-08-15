-- 両手ヴォイシングコース(中級・上級): クイズ課題を削除
BEGIN;

WITH thv_courses AS (
  SELECT id
  FROM public.courses
  WHERE id IN (
    '2dc2882a-6a40-5a21-958d-86195ddac0ea',
    '4173e2d5-063a-5533-bcb2-79473be491be'
  )
),
quiz_lesson_songs AS (
  SELECT ls.id AS lesson_song_id
  FROM public.lessons l
  JOIN thv_courses c ON c.id = l.course_id
  JOIN public.lesson_songs ls ON ls.lesson_id = l.id
  JOIN public.ear_training_stages s ON s.id = ls.ear_training_stage_id
  WHERE s.mode = 'chord_quiz'
)
DELETE FROM public.user_assignment_starts
WHERE lesson_song_id IN (SELECT lesson_song_id FROM quiz_lesson_songs);

DELETE FROM public.user_lesson_requirements_progress
WHERE lesson_song_id IN (
  SELECT ls.id
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  JOIN public.lesson_songs ls ON ls.lesson_id = l.id
  JOIN public.ear_training_stages s ON s.id = ls.ear_training_stage_id
  WHERE c.id IN (
    '2dc2882a-6a40-5a21-958d-86195ddac0ea',
    '4173e2d5-063a-5533-bcb2-79473be491be'
  )
    AND s.mode = 'chord_quiz'
);

DELETE FROM public.lesson_songs
WHERE id IN (
  SELECT ls.id
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  JOIN public.lesson_songs ls ON ls.lesson_id = l.id
  JOIN public.ear_training_stages s ON s.id = ls.ear_training_stage_id
  WHERE c.id IN (
    '2dc2882a-6a40-5a21-958d-86195ddac0ea',
    '4173e2d5-063a-5533-bcb2-79473be491be'
  )
    AND s.mode = 'chord_quiz'
);

DELETE FROM public.ear_training_chord_quiz_items
WHERE stage_id IN (
  SELECT s.id
  FROM public.ear_training_stages s
  WHERE s.mode = 'chord_quiz'
    AND (
      s.slug LIKE 'thvi-%'
      OR s.slug LIKE 'thva-%'
    )
);

DELETE FROM public.ear_training_stages
WHERE mode = 'chord_quiz'
  AND (
    slug LIKE 'thvi-%'
    OR slug LIKE 'thva-%'
  );

WITH thv_lessons AS (
  SELECT l.id AS lesson_id
  FROM public.lessons l
  WHERE l.course_id IN (
    '2dc2882a-6a40-5a21-958d-86195ddac0ea',
    '4173e2d5-063a-5533-bcb2-79473be491be'
  )
),
ranked AS (
  SELECT
    ls.id,
    ROW_NUMBER() OVER (
      PARTITION BY ls.lesson_id
      ORDER BY ls.order_index, ls.id
    ) - 1 AS new_order_index
  FROM public.lesson_songs ls
  JOIN thv_lessons tl ON tl.lesson_id = ls.lesson_id
)
UPDATE public.lesson_songs ls
SET order_index = ranked.new_order_index
FROM ranked
WHERE ls.id = ranked.id;

UPDATE public.lessons
SET
  assignment_description = '①バトル ②サバイバル',
  assignment_description_en = '① Battle ② Survival',
  updated_at = now()
WHERE course_id IN (
  '2dc2882a-6a40-5a21-958d-86195ddac0ea',
  '4173e2d5-063a-5533-bcb2-79473be491be'
)
AND assignment_description = '①クイズ ②バトル ③サバイバル';

UPDATE public.lessons
SET
  assignment_description = '①サバイバル: 全キー順番',
  assignment_description_en = '① Survival: all keys in order',
  updated_at = now()
WHERE course_id IN (
  '2dc2882a-6a40-5a21-958d-86195ddac0ea',
  '4173e2d5-063a-5533-bcb2-79473be491be'
)
AND assignment_description = '①クイズ: 60秒20問 ②サバイバル: 全キー順番';

UPDATE public.lessons
SET
  assignment_description = '①デモ ②2キーずつ×サバイバル ③全キーまとめ',
  assignment_description_en = '① Demo ② 2 keys at a time × survival ③ All-keys review',
  updated_at = now()
WHERE course_id IN (
  '2dc2882a-6a40-5a21-958d-86195ddac0ea',
  '4173e2d5-063a-5533-bcb2-79473be491be'
)
AND assignment_description = '①デモ ②2キーずつ×クイズ/サバイバル ③全キーまとめ';

UPDATE public.lessons
SET
  assignment_description = '①デモ ②3進行×バトル/サバイバル ③全キーまとめ',
  assignment_description_en = '① Demo ② 3 progressions × battle/survival ③ All-keys review',
  updated_at = now()
WHERE course_id IN (
  '2dc2882a-6a40-5a21-958d-86195ddac0ea',
  '4173e2d5-063a-5533-bcb2-79473be491be'
)
AND assignment_description = '①デモ ②3進行×クイズ/バトル/サバイバル ③全キーまとめ';

UPDATE public.courses
SET
  description = 'Drop2 の II-V-I ヴォイシングを、バトル・サバイバルで身につけましょう。',
  description_en = 'Master Drop 2 II-V-I voicings through battle and survival modes.',
  updated_at = now()
WHERE id = '2dc2882a-6a40-5a21-958d-86195ddac0ea';

UPDATE public.courses
SET
  description = 'So What / UST の 5 音ヴォイシングとメジャー II-V-I を、バトル・サバイバルで身につけましょう。',
  description_en = 'Master So What / UST five-note voicings and major II-V-I through battle and survival modes.',
  updated_at = now()
WHERE id = '4173e2d5-063a-5533-bcb2-79473be491be';

COMMIT;
