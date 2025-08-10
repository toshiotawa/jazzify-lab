-- Add root note on correct setting and remove unused columns from fantasy_stages
-- Created at: 2025-08-10

BEGIN;

-- Add new column: play_root_on_correct
ALTER TABLE public.fantasy_stages
  ADD COLUMN IF NOT EXISTS play_root_on_correct BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN public.fantasy_stages.play_root_on_correct IS '正解時にルート音を鳴らす（true: 鳴らす, false: 鳴らさない）';

-- Drop unused columns
ALTER TABLE public.fantasy_stages
  DROP COLUMN IF EXISTS monster_icon,
  DROP COLUMN IF EXISTS show_sheet_music;

COMMIT;