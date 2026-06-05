-- コードラン初級・中級: BGM を開発者テストコースのコードランと同じ Drums160 ループへ統一
BEGIN;

UPDATE public.lesson_songs ls
SET survival_lesson_overrides = jsonb_build_object(
  'bgmUrl', 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3'
)
FROM public.lessons l
WHERE l.id = ls.lesson_id
  AND l.course_id IN (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-beginner'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-chord-run-intermediate')
  )
  AND ls.is_survival = true;

COMMIT;
