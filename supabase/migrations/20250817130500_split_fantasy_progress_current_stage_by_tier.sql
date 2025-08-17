-- Split fantasy current stage by tier (Basic/Advanced)
-- Created at: 2025-08-17

BEGIN;

-- Add new columns for per-tier current stage
ALTER TABLE public.fantasy_user_progress
  ADD COLUMN IF NOT EXISTS current_stage_number_basic text NOT NULL DEFAULT '1-1',
  ADD COLUMN IF NOT EXISTS current_stage_number_advanced text NOT NULL DEFAULT '1-1';

-- Backfill from legacy column if present (only when empty/default)
UPDATE public.fantasy_user_progress
SET current_stage_number_basic = COALESCE(NULLIF(current_stage_number, ''), '1-1')
WHERE current_stage_number_basic IS NULL OR current_stage_number_basic = '1-1';

-- Optional: keep legacy current_stage_number as-is for backward compatibility
-- You may later update views or remove the old column after full migration.

COMMIT;