-- Phrase defense play map + quest-form nodes (hidden course).
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Hidden course for quest-form play map nodes
-- ---------------------------------------------------------------------------
INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial, is_visible,
  difficulty_tier, is_developer_only, is_main_course
)
VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-play-map-quests'),
  'プレイマップクエスト（非表示）',
  'Play Map Quests (hidden)',
  'コードラン/フレーズディフェンスマップ用のクエスト形式ノード',
  'Quest-form nodes for play maps',
  false,
  9999,
  'both',
  false,
  false,
  'beginner',
  true,
  false
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  is_visible = false,
  is_developer_only = true,
  updated_at = now();

-- Tutorial quest: code run
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pmq-cr-tutorial'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-play-map-quests'),
  'コードランへようこそ',
  'Welcome to Code Run',
  'コードを完成させるとジャンプしてゴールを目指します。オート操作で右へ進みます。',
  'Complete chords to jump toward the goal. Auto-run moves you to the right.',
  false, 0, 1, 'チュートリアル', 'Tutorial', '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = now();

-- Tutorial quest: phrase defense
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, nav_links
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pmq-pd-tutorial'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-play-map-quests'),
  'フレーズディフェンスへようこそ',
  'Welcome to Phrase Defense',
  '譜面の音を順番に演奏して敵を倒し、制限時間まで生き残りましょう。',
  'Play the notated phrase to slash enemies and survive until time runs out.',
  false, 1, 1, 'チュートリアル', 'Tutorial', '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  updated_at = now();

-- Defense test stage id (from defense_lesson_dev_course migration)
-- uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-survival-phrases-1-4')

-- ---------------------------------------------------------------------------
-- 2) Defense play map blocks (Basic / Advanced)
-- ---------------------------------------------------------------------------
INSERT INTO public.play_map_blocks (id, mode, tier, block_key, label, label_en, sort_order)
VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-basic-1'),
   'defense', 'basic', 'intro', 'はじめに', 'Introduction', 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-adv-1'),
   'defense', 'advanced', 'intro', 'はじめに', 'Introduction', 0)
ON CONFLICT (mode, tier, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  is_active = true,
  updated_at = now();

-- Quest tutorial nodes at map start
INSERT INTO public.play_map_nodes (
  id, block_id, sort_order, node_kind, lesson_id, title, title_en
)
VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-quest-cr-tutorial'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'cr-basic-major-triad'),
    -1,
    'quest',
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pmq-cr-tutorial'),
    'コードランへようこそ',
    'Welcome to Code Run'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-quest-pd-tutorial'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-basic-1'),
    -1,
    'quest',
    uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pmq-pd-tutorial'),
    'フレーズディフェンスへようこそ',
    'Welcome to Phrase Defense'
  )
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  is_active = true,
  updated_at = now();

-- Defense stage nodes (test course: 4 nodes using dev stage)
INSERT INTO public.play_map_nodes (
  id, block_id, sort_order, node_kind, defense_stage_id, title, title_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-node-basic-' || v.idx::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-basic-1'),
  v.idx,
  'stage',
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-survival-phrases-1-4'),
  v.title,
  v.title_en
FROM (
  VALUES
    (0, 'フレーズ I', 'Phrase I'),
    (1, 'フレーズ II', 'Phrase II'),
    (2, 'フレーズ III', 'Phrase III'),
    (3, 'フレーズ IV', 'Phrase IV')
) AS v(idx, title, title_en)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  is_active = true,
  updated_at = now();

INSERT INTO public.play_map_nodes (
  id, block_id, sort_order, node_kind, defense_stage_id, title, title_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-node-adv-' || v.idx::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-adv-1'),
  v.idx,
  'stage',
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'defense-dev-survival-phrases-1-4'),
  v.title || ' (Adv)',
  v.title_en || ' (Adv)'
FROM (
  VALUES
    (0, 'フレーズ I', 'Phrase I'),
    (1, 'フレーズ II', 'Phrase II'),
    (2, 'フレーズ III', 'Phrase III'),
    (3, 'フレーズ IV', 'Phrase IV')
) AS v(idx, title, title_en)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  is_active = true,
  updated_at = now();

COMMIT;
