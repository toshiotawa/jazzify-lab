-- コードラン初級・中級: ソフトランディング化 + 1ブロック目を1クエストのみに再配置
-- 1ブロック目の残りは2ブロック目へ、以降はところてん式に +1
BEGIN;

UPDATE public.courses
SET soft_landing_order = 1, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-beginner');

UPDATE public.courses
SET soft_landing_order = 2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-intermediate');

-- 初級: 6ブロック → 7ブロック
UPDATE public.lessons
SET block_number = block_number + 1, updated_at = now()
WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-beginner')
  AND block_number >= 2;

UPDATE public.lessons
SET block_number = 2, updated_at = now()
WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-beginner')
  AND block_number = 1
  AND order_index > 0;

-- 中級: 4ブロック → 5ブロック
UPDATE public.lessons
SET block_number = block_number + 1, updated_at = now()
WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-intermediate')
  AND block_number >= 2;

UPDATE public.lessons
SET block_number = 2, updated_at = now()
WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-intermediate')
  AND block_number = 1
  AND order_index > 0;

COMMIT;
