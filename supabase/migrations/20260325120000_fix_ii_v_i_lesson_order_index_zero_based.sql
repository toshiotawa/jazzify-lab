-- II-V-I コース: lessons.order_index はアプリ上 0 始まり（表示で +1）。
-- 初回投入が 1..120 だったため、先頭レッスンが「レッスン2」と表示されていた。
-- 既に 0..119 の環境では MAX=119 のため更新されない。
UPDATE public.lessons l
SET order_index = l.order_index - 1
WHERE l.course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course')
  AND (
    SELECT COALESCE(MAX(order_index), -1)
    FROM public.lessons
    WHERE course_id = l.course_id
  ) = 120;
