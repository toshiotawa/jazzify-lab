-- Backfill one production play log per training_scores row that has no logs.
-- Needed for scores saved before training_play_logs was written in rpc_upsert_training_score.

INSERT INTO public.training_play_logs (user_id, training_id, score, rank, played_at)
SELECT
  ts.user_id,
  ts.training_id,
  ts.best_score,
  ts.best_rank,
  ts.achieved_at
FROM public.training_scores AS ts
WHERE NOT EXISTS (
  SELECT 1
  FROM public.training_play_logs AS tpl
  WHERE tpl.user_id = ts.user_id
    AND tpl.training_id = ts.training_id
);