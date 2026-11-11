-- Phrase Defense map: one visible tier (advanced).
-- Keep existing advanced node ids so clears survive. Basic rows stay for the
-- production web build that still shows the Basic tab.

CREATE OR REPLACE FUNCTION public.defense_play_map_uuid(p_name text)
RETURNS uuid
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, p_name);
$$;

UPDATE public.play_map_nodes AS n
SET
  title = v.title,
  title_en = v.title_en,
  updated_at = now()
FROM (
  VALUES
    (0, 'ステージ 1-1', 'Stage 1-1'),
    (1, 'ステージ 1-2', 'Stage 1-2'),
    (2, 'ステージ 1-3', 'Stage 1-3'),
    (3, 'ステージ 1-4', 'Stage 1-4')
) AS v(idx, title, title_en)
WHERE n.id = public.defense_play_map_uuid('pd-node-adv-' || v.idx::text);

INSERT INTO public.play_map_nodes (
  id,
  block_id,
  sort_order,
  node_kind,
  defense_stage_id,
  title,
  title_en,
  difficulty_level,
  required_rank,
  is_active
)
SELECT
  public.defense_play_map_uuid('pd-node-adv-4'),
  source.block_id,
  4,
  'stage',
  source.defense_stage_id,
  'ステージ 1-5',
  'Stage 1-5',
  10,
  source.required_rank,
  true
FROM public.play_map_nodes AS source
WHERE source.id = public.defense_play_map_uuid('pd-node-adv-3')
ON CONFLICT (id) DO UPDATE SET
  block_id = EXCLUDED.block_id,
  sort_order = EXCLUDED.sort_order,
  defense_stage_id = EXCLUDED.defense_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  difficulty_level = EXCLUDED.difficulty_level,
  is_active = true,
  updated_at = now();

INSERT INTO public.play_map_blocks (
  id, mode, tier, block_key, label, label_en, sort_order, is_active
)
VALUES (
  public.defense_play_map_uuid('pd-adv-2'),
  'defense',
  'advanced',
  'floor-2',
  '第2階層',
  'Floor 2',
  1,
  true
)
ON CONFLICT (mode, tier, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

INSERT INTO public.play_map_nodes (
  id,
  block_id,
  sort_order,
  node_kind,
  defense_stage_id,
  title,
  title_en,
  difficulty_level,
  required_rank,
  is_active
)
SELECT
  public.defense_play_map_uuid('pd-node-adv-2-1'),
  public.defense_play_map_uuid('pd-adv-2'),
  0,
  'stage',
  source.defense_stage_id,
  'ステージ 2-1',
  'Stage 2-1',
  10,
  source.required_rank,
  true
FROM public.play_map_nodes AS source
WHERE source.id = public.defense_play_map_uuid('pd-node-adv-3')
ON CONFLICT (id) DO UPDATE SET
  block_id = EXCLUDED.block_id,
  sort_order = EXCLUDED.sort_order,
  defense_stage_id = EXCLUDED.defense_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  difficulty_level = EXCLUDED.difficulty_level,
  is_active = true,
  updated_at = now();

UPDATE public.play_map_nodes
SET
  block_id = public.defense_play_map_uuid('pd-adv-1'),
  sort_order = -1,
  is_active = true,
  updated_at = now()
WHERE id = public.defense_play_map_uuid('pd-tutorial-input-setup');

DO $$
BEGIN
  IF (
    SELECT count(*)
    FROM public.play_map_nodes
    WHERE id IN (
      public.defense_play_map_uuid('pd-node-adv-0'),
      public.defense_play_map_uuid('pd-node-adv-1'),
      public.defense_play_map_uuid('pd-node-adv-2'),
      public.defense_play_map_uuid('pd-node-adv-3'),
      public.defense_play_map_uuid('pd-node-adv-4'),
      public.defense_play_map_uuid('pd-node-adv-2-1')
    )
    AND is_active
  ) <> 6 THEN
    RAISE EXCEPTION 'defense advanced stage nodes were not all written';
  END IF;
END $$;

DROP FUNCTION public.defense_play_map_uuid(text);
