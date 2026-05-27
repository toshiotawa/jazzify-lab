-- 開発者用テストコースに「風船ラッシュ」テスト課題（balloon-rush-dm7-01）を追加
-- MCP apply_migration 適用済み環境とは履歴キーがずれることがあるため、SQL はべき等（ON CONFLICT）で運用する。

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.balloon_rush_stages WHERE slug = 'balloon-rush-dm7-01'
  ) THEN
    RAISE EXCEPTION 'balloon-rush-dm7-01 が未定義です。balloon_rush 系 migration を先に適用してください。';
  END IF;
END $$;

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
)
VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-balloon-rush-lab-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  '風船ラッシュ（テスト / Dm7）',
  'Balloon Rush (test / Dm7)',
  '90秒以内に風船を20個割るテストステージ balloon-rush-dm7-01（B列のみ）。',
  'Test stage balloon-rush-dm7-01 — pop 20 balloons in 90s (slot B melee only).',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only;

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  fantasy_stage_id,
  is_fantasy,
  is_survival,
  is_ear_training,
  survival_stage_number,
  survival_composite_config,
  ear_training_stage_id,
  is_balloon_rush,
  balloon_rush_stage_id,
  is_survival_tutorial,
  survival_tutorial_script_id,
  is_ear_training_tutorial,
  ear_training_tutorial_script_id,
  clear_conditions,
  order_index,
  title,
  title_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-balloon-rush-lab-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-balloon-rush-lab-lesson'),
  NULL,
  NULL,
  false,
  false,
  false,
  NULL,
  NULL,
  NULL,
  true,
  br.id,
  false,
  NULL,
  false,
  NULL,
  '{"count": 1, "rank": "S"}'::jsonb,
  0,
  '風船ラッシュ Dm7',
  'Balloon Rush Dm7'
FROM public.balloon_rush_stages br
WHERE br.slug = 'balloon-rush-dm7-01'
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_balloon_rush = EXCLUDED.is_balloon_rush,
  balloon_rush_stage_id = EXCLUDED.balloon_rush_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;
