-- 横スクロールコードラン:初級を目的別コース一覧の最上位へ（order_index = 可視コースの MIN - 1）
-- 初級コース「音符の読み方」「音楽理論初級」を削除（CASCADE で lessons / progress 等も削除）
BEGIN;

UPDATE public.courses
SET
  order_index = COALESCE((
    SELECT MIN(c.order_index)
    FROM public.courses c
    WHERE COALESCE(c.is_developer_only, false) = false
      AND COALESCE(c.is_visible, true) = true
      AND c.is_main_course = false
      AND c.id <> uuid_generate_v5(
        'a0000000-0000-4000-8000-000000000001'::uuid,
        'course-chord-run-beginner'
      )
  ), 0) - 1,
  updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'course-chord-run-beginner'
);

DELETE FROM public.courses
WHERE id IN (
  'a2fe7c8c-a754-4a11-8b60-890abf37329e'::uuid,
  'e0c6ecbc-3cdc-57be-b929-496e8cd67e36'::uuid
);

COMMIT;
