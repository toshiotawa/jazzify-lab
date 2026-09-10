-- Fix rpc_upsert_training_score return values
CREATE OR REPLACE FUNCTION public.rpc_upsert_training_score(
  p_training_id uuid,
  p_score integer
)
RETURNS TABLE (
  best_score integer,
  best_rank text,
  is_new_best boolean
) AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_prev integer;
  v_new integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_score IS NULL OR p_score < 0 THEN
    RAISE EXCEPTION 'Invalid score';
  END IF;

  SELECT ts.best_score INTO v_prev
  FROM public.training_scores ts
  WHERE ts.user_id = v_uid AND ts.training_id = p_training_id;

  v_new := GREATEST(COALESCE(v_prev, 0), p_score);

  INSERT INTO public.training_scores (user_id, training_id, best_score, best_rank, achieved_at, play_count, updated_at)
  VALUES (v_uid, p_training_id, v_new, public.training_score_to_rank(v_new), now(), 1, now())
  ON CONFLICT (user_id, training_id) DO UPDATE SET
    play_count = public.training_scores.play_count + 1,
    updated_at = now(),
    best_score = v_new,
    best_rank = public.training_score_to_rank(v_new),
    achieved_at = CASE
      WHEN v_new > public.training_scores.best_score THEN now()
      ELSE public.training_scores.achieved_at
    END;

  best_score := v_new;
  best_rank := public.training_score_to_rank(v_new);
  is_new_best := (v_prev IS NULL OR p_score > v_prev);
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
