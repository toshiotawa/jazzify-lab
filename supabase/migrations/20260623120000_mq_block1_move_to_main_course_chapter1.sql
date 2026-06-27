-- メインクエスト第1チャプター「Cブルースのはじまり」へ MQ Block1 クエスト1〜3 を移動
BEGIN;

-- 準備中プレースホルダーを削除
DELETE FROM public.user_lesson_requirements_progress
WHERE lesson_id = 'c0000000-0000-4000-8000-000000000001'::uuid;

DELETE FROM public.user_lesson_progress
WHERE lesson_id = 'c0000000-0000-4000-8000-000000000001'::uuid;

DELETE FROM public.lesson_songs
WHERE lesson_id = 'c0000000-0000-4000-8000-000000000001'::uuid;

DELETE FROM public.lessons
WHERE id = 'c0000000-0000-4000-8000-000000000001'::uuid;

-- 開発者テストコース → メインクエスト（is_main_course）第1チャプター
UPDATE public.lessons
SET
  course_id = 'a0000000-0000-0000-0000-000000000001'::uuid,
  block_number = 1,
  block_name = 'Cブルースのはじまり',
  block_name_en = 'The Beginning of C Blues',
  order_index = CASE id
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-lesson') THEN 0
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson') THEN 1
    WHEN uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson') THEN 2
  END,
  manual_completion_disabled = false,
  updated_at = now()
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson')
);

UPDATE public.user_lesson_progress
SET
  course_id = 'a0000000-0000-0000-0000-000000000001'::uuid,
  updated_at = now()
WHERE lesson_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson')
);

UPDATE public.courses
SET
  description = 'ジャズ初心者が順番に進める一本道のコース。まずはCブルースから。',
  description_en = 'A step-by-step path for jazz beginners. Start with C blues.',
  updated_at = now()
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

COMMIT;
