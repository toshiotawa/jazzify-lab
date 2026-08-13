-- クエスト3: 「3-1. 2音・頭拍」課題を削除
DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-1-lsong');

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage');

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-2-6-stage');

UPDATE public.lesson_songs
SET order_index = order_index - 1
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q3-lesson')
  AND order_index > 1;
