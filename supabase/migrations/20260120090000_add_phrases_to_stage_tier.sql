-- Add 'phrases' option to stage_tier column in fantasy_stages table

-- First, drop the existing CHECK constraint
ALTER TABLE public.fantasy_stages
  DROP CONSTRAINT IF EXISTS fantasy_stages_stage_tier_check;

-- Add new CHECK constraint that includes 'phrases'
ALTER TABLE public.fantasy_stages
  ADD CONSTRAINT fantasy_stages_stage_tier_check 
  CHECK (stage_tier IN ('basic', 'advanced', 'phrases'));

-- Update the column comment
COMMENT ON COLUMN public.fantasy_stages.stage_tier IS 'ステージ種別: basic, advanced, or phrases';
