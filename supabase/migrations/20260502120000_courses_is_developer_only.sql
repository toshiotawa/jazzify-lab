-- 開発者専用コースフラグ + テストコース・ダミーレッスン
BEGIN;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_developer_only boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.courses.is_developer_only IS '開発者向けテストコース。本番クライアントでは一覧・単体取得から除外する';

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial,
  is_visible, difficulty_tier, min_rank, is_developer_only
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  '開発者用テストコース',
  'Developer Test Course',
  '開発者向けのテスト用コースです。',
  'Developer-only test course.',
  false,
  99999,
  'both',
  false,
  true,
  'beginner',
  'free'::public.membership_rank,
  true
) ON CONFLICT (id) DO NOTHING;

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-test-dummy-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'ダミーレッスン',
  'Dummy Lesson',
  '開発・検証用のダミー情報レッスンです。',
  'Dummy information lesson for development and QA.',
  false,
  0,
  1,
  'テスト',
  'Test',
  '["information"]'::jsonb,
  NULL
) ON CONFLICT (id) DO NOTHING;

COMMIT;
