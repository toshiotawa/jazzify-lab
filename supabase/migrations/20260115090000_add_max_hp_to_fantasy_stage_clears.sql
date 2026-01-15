-- Add max_hp column to fantasy_stage_clears table
-- This stores the max HP at the time of clear for accurate no-damage clear detection
-- Created at: 2026-01-15

-- Add max_hp column with default value (for existing records, will be NULL)
ALTER TABLE public.fantasy_stage_clears
ADD COLUMN IF NOT EXISTS max_hp INTEGER DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.fantasy_stage_clears.max_hp IS 'クリア時点でのステージの最大HP（ノーダメージクリア判定に使用）';

-- Backfill existing records with max_hp from fantasy_stages
UPDATE public.fantasy_stage_clears fsc
SET max_hp = fs.max_hp
FROM public.fantasy_stages fs
WHERE fsc.stage_id = fs.id
  AND fsc.max_hp IS NULL;
