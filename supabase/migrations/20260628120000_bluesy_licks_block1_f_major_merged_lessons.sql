-- Bluesy Licks: ブロック1 → F Major、Slow/等速を 1 クエストに統合
BEGIN;

-- phrase 1
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 1',
  'Phrase 1',
  'Slow BPM 120 → 等速 BPM 240・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 120 BPM → full 240 BPM, 8 bars × 4 loops.',
  true,
  0, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = false
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-1');

-- phrase 2
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 2',
  'Phrase 2',
  'Slow BPM 80 → 等速 BPM 160・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 80 BPM → full 160 BPM, 8 bars × 4 loops.',
  true,
  1, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-2');

-- phrase 3
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 3',
  'Phrase 3',
  'Slow BPM 80 → 等速 BPM 160・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 80 BPM → full 160 BPM, 8 bars × 4 loops.',
  true,
  2, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-3');

-- phrase 4
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 4',
  'Phrase 4',
  'Slow BPM 100 → 等速 BPM 200・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 100 BPM → full 200 BPM, 8 bars × 4 loops.',
  true,
  3, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-4');

-- phrase 5
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 5',
  'Phrase 5',
  'Slow BPM 120 → 等速 BPM 240・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 120 BPM → full 240 BPM, 8 bars × 4 loops.',
  true,
  4, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = false
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-5');

-- phrase 6
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 6',
  'Phrase 6',
  'Slow BPM 80 → 等速 BPM 160・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 80 BPM → full 160 BPM, 8 bars × 4 loops.',
  true,
  5, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-6');

-- phrase 7
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 7',
  'Phrase 7',
  'Slow BPM 120 → 等速 BPM 240・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 120 BPM → full 240 BPM, 8 bars × 4 loops.',
  true,
  6, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = false
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-7');

-- phrase 8
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 8',
  'Phrase 8',
  'Slow BPM 150 → 等速 BPM 300・12小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 150 BPM → full 300 BPM, 12 bars × 4 loops.',
  true,
  7, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = false
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-8');

-- phrase 9
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 9',
  'Phrase 9',
  'Slow BPM 120 → 等速 BPM 240・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 120 BPM → full 240 BPM, 8 bars × 4 loops.',
  true,
  8, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = false
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-9');

-- phrase 10
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 10',
  'Phrase 10',
  'Slow BPM 80 → 等速 BPM 160・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 80 BPM → full 160 BPM, 8 bars × 4 loops.',
  true,
  9, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-10');

-- phrase 11
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  nav_links, assignment_description, assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks'),
  'フレーズ 11',
  'Phrase 11',
  'Slow BPM 150 → 等速 BPM 300・8小節×4ループの OSMD 耳コピバトル。',
  'OSMD ear-copy battle: slow 150 BPM → full 300 BPM, 8 bars × 4 loops.',
  true,
  10, 1, 'F Major', 'F Major',
  '[]'::jsonb,
  '敵HPを0にしてください。',
  'Reduce the enemy HP to 0.'
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11'),
  title = 'Slow',
  title_en = 'Slow',
  order_index = 0,
  is_clear_required = true
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-slow-lsong');

UPDATE public.lesson_songs SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11'),
  title = '等速',
  title_en = 'Full tempo',
  order_index = 1,
  is_clear_required = false
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-normal-lsong');

UPDATE public.user_lesson_requirements_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11')
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-normal'));

UPDATE public.user_lesson_progress SET
  lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11'),
  completed = true,
  completion_date = COALESCE(completion_date, now()),
  updated_at = now()
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-normal'))
  AND completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.user_lesson_progress ulp
    WHERE ulp.user_id = user_lesson_progress.user_id
      AND ulp.lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11')
  );

DELETE FROM public.user_lesson_progress
WHERE lesson_id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-normal'));

DELETE FROM public.lessons
WHERE id IN (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-slow'), uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11-normal'))
  AND id <> uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'bl-11');

COMMIT;
