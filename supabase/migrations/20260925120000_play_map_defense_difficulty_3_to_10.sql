-- Phrase Defense play-map nodes: Basic 1 = Lv.3 … Advanced 4 = Lv.10
BEGIN;

ALTER TABLE public.play_map_nodes
  ADD COLUMN IF NOT EXISTS difficulty_level smallint
    CHECK (difficulty_level IS NULL OR (difficulty_level >= 1 AND difficulty_level <= 10));

COMMENT ON COLUMN public.play_map_nodes.difficulty_level IS
  'Optional combat preset override for defense map nodes. NULL uses defense_stages.difficulty_level.';

UPDATE public.play_map_nodes AS n
SET difficulty_level = CASE
  WHEN b.tier = 'basic' THEN 3 + n.sort_order
  WHEN b.tier = 'advanced' THEN 7 + n.sort_order
  ELSE n.difficulty_level
END
FROM public.play_map_blocks AS b
WHERE n.block_id = b.id
  AND b.mode = 'defense'
  AND n.node_kind = 'stage'
  AND n.sort_order BETWEEN 0 AND 3;

COMMIT;
