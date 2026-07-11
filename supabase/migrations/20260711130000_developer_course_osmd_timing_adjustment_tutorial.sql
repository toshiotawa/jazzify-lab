-- 開発者テストコース: OSMDタイミング調整チュートリアル（専用レッスン + 課題）
BEGIN;

INSERT INTO public.lessons (
  id,
  course_id,
  title,
  title_en,
  description,
  description_en,
  premium_only,
  order_index,
  block_number,
  block_name,
  block_name_en,
  nav_links,
  assignment_description,
  assignment_description_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-osmd-timing-adjustment-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'OSMDタイミング調整チュートリアル',
  'OSMD Timing Adjustment Tutorial',
  'Bluetooth遅延のタイミング調整を確認する開発用チュートリアルです。',
  'Developer tutorial for verifying Bluetooth latency timing adjustment.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons
   WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  'タイミングを合わせて1ループ確認し、進むを押してください。',
  'Align timing, confirm one loop, then press Next.'
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en,
  premium_only = EXCLUDED.premium_only,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  is_ear_training_tutorial,
  ear_training_tutorial_script_id,
  ear_training_stage_id,
  clear_conditions,
  order_index,
  title,
  title_en,
  is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-timing-adjustment-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-osmd-timing-adjustment-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'osmd-timing-adjustment-v1',
  NULL,
  '{"count": 1, "rank": "S"}'::jsonb,
  0,
  'OSMDタイミング調整チュートリアル',
  'OSMD Timing Adjustment Tutorial',
  false
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  is_ear_training_tutorial = EXCLUDED.is_ear_training_tutorial,
  ear_training_tutorial_script_id = EXCLUDED.ear_training_tutorial_script_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  clear_conditions = EXCLUDED.clear_conditions,
  order_index = EXCLUDED.order_index;

COMMIT;
