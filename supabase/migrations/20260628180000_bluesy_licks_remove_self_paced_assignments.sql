-- Bluesy Licks: セルフペース課題を削除（Slow/等速の order_index を復元）
BEGIN;

DELETE FROM public.user_lesson_requirements_progress
WHERE lesson_song_id IN (
  SELECT uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, format('bl-%s-self-lsong', n))
  FROM generate_series(1, 11) AS n
);

DELETE FROM public.lesson_songs
WHERE id IN (
  SELECT uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, format('bl-%s-self-lsong', n))
  FROM generate_series(1, 11) AS n
);

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id IN (
  SELECT ep.id
  FROM public.ear_training_phrases ep
  JOIN public.ear_training_stages s ON s.id = ep.stage_id
  WHERE s.slug ~ '^bl-stage-[0-9]+-self$'
);

DELETE FROM public.ear_training_phrases
WHERE stage_id IN (
  SELECT id
  FROM public.ear_training_stages
  WHERE slug ~ '^bl-stage-[0-9]+-self$'
);

DELETE FROM public.ear_training_stages
WHERE slug ~ '^bl-stage-[0-9]+-self$';

UPDATE public.lesson_songs
SET order_index = 0
WHERE id IN (
  SELECT uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, format('bl-%s-slow-lsong', n))
  FROM generate_series(1, 11) AS n
);

UPDATE public.lesson_songs
SET order_index = 1
WHERE id IN (
  SELECT uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, format('bl-%s-normal-lsong', n))
  FROM generate_series(1, 11) AS n
);

COMMIT;
