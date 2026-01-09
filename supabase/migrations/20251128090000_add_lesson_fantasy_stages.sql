-- Add usage_type column and make stage_number nullable for lesson-only fantasy stages
-- Created at: 2025-11-28

BEGIN;

-- 1. Add usage_type column to fantasy_stages
-- 'fantasy': ファンタジーモード専用（既存ステージのデフォルト）
-- 'lesson': レッスンモード専用
-- 'both': 両方で使用可能
ALTER TABLE public.fantasy_stages
  ADD COLUMN IF NOT EXISTS usage_type TEXT DEFAULT 'fantasy' NOT NULL;

-- 2. Add check constraint for usage_type
ALTER TABLE public.fantasy_stages
  ADD CONSTRAINT fantasy_stages_usage_type_check 
  CHECK (usage_type IN ('fantasy', 'lesson', 'both'));

-- 3. Make stage_number nullable for lesson-only stages
-- First, drop the existing unique constraint
ALTER TABLE public.fantasy_stages
  DROP CONSTRAINT IF EXISTS fantasy_stages_tier_stage_number_key;

-- Make stage_number nullable
ALTER TABLE public.fantasy_stages
  ALTER COLUMN stage_number DROP NOT NULL;

-- 4. Create a partial unique constraint for non-null stage_numbers
-- This allows multiple NULL stage_numbers while keeping uniqueness for non-NULL values
CREATE UNIQUE INDEX IF NOT EXISTS fantasy_stages_tier_stage_number_unique_idx
  ON public.fantasy_stages (stage_tier, stage_number)
  WHERE stage_number IS NOT NULL;

-- 5. Create index for usage_type filtering
CREATE INDEX IF NOT EXISTS fantasy_stages_usage_type_idx
  ON public.fantasy_stages (usage_type);

-- 6. Add comment for new column
COMMENT ON COLUMN public.fantasy_stages.usage_type IS '使用タイプ: fantasy=ファンタジーモード専用, lesson=レッスンモード専用, both=両方で使用';

COMMIT;
