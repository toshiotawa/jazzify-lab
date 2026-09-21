-- 開発者テストコースのフレーズディフェンス系ステージをすべて難易度10に統一
UPDATE public.defense_stages ds
SET difficulty_level = 10
FROM public.lesson_songs ls
JOIN public.lessons l ON l.id = ls.lesson_id
WHERE ls.defense_stage_id = ds.id
  AND COALESCE(ls.is_defense, false) = true
  AND l.course_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'course-developer-test'
  );
