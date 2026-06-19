-- 開発者テストコース: サバイバルチュートリアル V4 (developer-v4-native) を iOS から到達可能にする
BEGIN;

UPDATE public.survival_tutorial_scripts
SET is_active = true, updated_at = now()
WHERE id = 'developer-v4-native';

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
  assignment_description
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-v4-native-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバルチュートリアル V4（ネイティブ）',
  'Survival Tutorial V4 (native)',
  'dialogue / demo / play の V4 manifest を Web/iOS ランタイムで検証する開発者用レッスンです。',
  'Developer lesson for V4 runtime (dialogue, demo, play) on Web and iOS.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons
   WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  nav_links = EXCLUDED.nav_links,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  is_survival_tutorial,
  survival_tutorial_script_id,
  clear_conditions,
  order_index,
  title,
  title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-v4-native-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-survival-tutorial-v4-native-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  true,
  'developer-v4-native',
  '{"count": 1, "rank": "S"}'::jsonb,
  1,
  'サバイバルチュートリアル V4',
  'Survival Tutorial V4'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_survival_tutorial = EXCLUDED.is_survival_tutorial,
  survival_tutorial_script_id = EXCLUDED.survival_tutorial_script_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
