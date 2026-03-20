-- グローバル専用チュートリアルコースを廃止し、日本向けチュートリアル1本化。
-- global コースの進捗は order_index が一致する日本側レッスンへ移行してからコースを削除する。

BEGIN;

INSERT INTO public.user_lesson_progress (
  id,
  user_id,
  lesson_id,
  course_id,
  completed,
  completion_date,
  unlock_date,
  created_at,
  updated_at,
  is_unlocked
)
SELECT
  gen_random_uuid(),
  ulp.user_id,
  jl.id,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  ulp.completed,
  ulp.completion_date,
  ulp.unlock_date,
  ulp.created_at,
  ulp.updated_at,
  ulp.is_unlocked
FROM public.user_lesson_progress ulp
JOIN public.lessons gl ON gl.id = ulp.lesson_id
  AND gl.course_id = 'b0000000-0000-0000-0000-000000000001'::uuid
JOIN public.lessons jl ON jl.course_id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND jl.order_index = gl.order_index
ON CONFLICT (user_id, lesson_id) DO UPDATE SET
  completed = public.user_lesson_progress.completed OR EXCLUDED.completed,
  completion_date = CASE
    WHEN public.user_lesson_progress.completion_date IS NULL THEN EXCLUDED.completion_date
    WHEN EXCLUDED.completion_date IS NULL THEN public.user_lesson_progress.completion_date
    ELSE GREATEST(public.user_lesson_progress.completion_date, EXCLUDED.completion_date)
  END,
  updated_at = GREATEST(
    COALESCE(public.user_lesson_progress.updated_at, '-infinity'::timestamptz),
    COALESCE(EXCLUDED.updated_at, '-infinity'::timestamptz)
  ),
  is_unlocked = public.user_lesson_progress.is_unlocked OR EXCLUDED.is_unlocked,
  unlock_date = CASE
    WHEN public.user_lesson_progress.unlock_date IS NULL THEN EXCLUDED.unlock_date
    WHEN EXCLUDED.unlock_date IS NULL THEN public.user_lesson_progress.unlock_date
    ELSE LEAST(public.user_lesson_progress.unlock_date, EXCLUDED.unlock_date)
  END;

DELETE FROM public.courses WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid;

UPDATE public.courses
SET
  audience = 'both',
  title_en = COALESCE(NULLIF(btrim(title_en), ''), 'Tutorial')
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

COMMIT;
