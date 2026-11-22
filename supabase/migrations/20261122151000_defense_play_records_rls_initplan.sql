-- Optimize defense_play_records RLS initplan and add covering FK index for stage_id.
BEGIN;

CREATE INDEX IF NOT EXISTS idx_defense_play_records_stage_id
  ON public.defense_play_records (stage_id);

DROP POLICY IF EXISTS defense_play_records_select_own ON public.defense_play_records;
CREATE POLICY defense_play_records_select_own ON public.defense_play_records
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS defense_play_records_insert_own ON public.defense_play_records;
CREATE POLICY defense_play_records_insert_own ON public.defense_play_records
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS defense_play_records_update_own ON public.defense_play_records;
CREATE POLICY defense_play_records_update_own ON public.defense_play_records
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

COMMIT;
