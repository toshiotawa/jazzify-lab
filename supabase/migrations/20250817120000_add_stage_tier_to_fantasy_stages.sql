-- Add stage_tier (Basic/Advanced) to fantasy_stages
-- Created at: 2025-08-17

BEGIN;

ALTER TABLE public.fantasy_stages
  ADD COLUMN IF NOT EXISTS stage_tier text NOT NULL DEFAULT 'basic' CHECK (stage_tier IN ('basic','advanced'));

COMMENT ON COLUMN public.fantasy_stages.stage_tier IS 'ステージ種別: basic or advanced';

COMMIT;