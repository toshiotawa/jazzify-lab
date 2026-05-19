-- Extend map_category CHECK on survival_stage_clears and survival_stage_progress for Phrases mode.
BEGIN;

ALTER TABLE public.survival_stage_clears
  DROP CONSTRAINT IF EXISTS survival_stage_clears_map_category_check;

ALTER TABLE public.survival_stage_clears
  ADD CONSTRAINT survival_stage_clears_map_category_check
  CHECK (map_category IN ('basic', 'songs', 'phrases'));

ALTER TABLE public.survival_stage_progress
  DROP CONSTRAINT IF EXISTS survival_stage_progress_map_category_check;

ALTER TABLE public.survival_stage_progress
  ADD CONSTRAINT survival_stage_progress_map_category_check
  CHECK (map_category IN ('basic', 'songs', 'phrases'));

COMMIT;
