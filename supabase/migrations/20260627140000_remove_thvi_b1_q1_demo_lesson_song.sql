-- 両手ヴォイシングコース(中級) レッスン1: デモ課題を削除

DELETE FROM public.user_lesson_requirements_progress
WHERE lesson_song_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-demo-lsong');

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-demo-lsong');

DELETE FROM public.survival_tutorial_scripts
WHERE id = 'thvi-demo-b1-q1';

UPDATE public.lesson_songs
SET order_index = 0
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz-lsong');

UPDATE public.lesson_songs
SET order_index = 1
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-lsong');

UPDATE public.lesson_songs
SET order_index = 2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-survival-lsong');
