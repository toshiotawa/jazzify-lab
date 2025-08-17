-- Indexes to speed up fantasy clears aggregations
-- Created at: 2025-08-17

CREATE INDEX IF NOT EXISTS fantasy_stage_clears_clear_type_user_id_idx
  ON public.fantasy_stage_clears (clear_type, user_id);