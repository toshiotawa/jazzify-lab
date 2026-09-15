-- Training mode fixes: mixed intervals, scale play_root_on_correct, scale rank thresholds
BEGIN;

-- 1) 度数まとめ上 / 下
INSERT INTO public.trainings (
  id,
  category_id,
  slug,
  title_ja,
  title_en,
  sort_order,
  kind,
  clef_mode,
  use_key_signature,
  play_root_on_correct,
  bgm_url,
  config,
  is_active
) VALUES
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-interval-mixed-up'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-interval'),
    'interval-mixed-up',
    '度数まとめ上',
    'Mixed Intervals Up',
    23,
    'interval',
    'instrument',
    false,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"direction":"up"}'::jsonb,
    true
  ),
  (
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-interval-mixed-down'),
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-interval'),
    'interval-mixed-down',
    '度数まとめ下',
    'Mixed Intervals Down',
    24,
    'interval',
    'instrument',
    false,
    true,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
    '{"direction":"down"}'::jsonb,
    true
  )
ON CONFLICT (slug) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  sort_order = EXCLUDED.sort_order,
  kind = EXCLUDED.kind,
  clef_mode = EXCLUDED.clef_mode,
  play_root_on_correct = EXCLUDED.play_root_on_correct,
  bgm_url = EXCLUDED.bgm_url,
  config = EXCLUDED.config,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- 2) スケール系は正解時ルート音を鳴らさない
UPDATE public.trainings
SET play_root_on_correct = false, updated_at = now()
WHERE kind = 'scale';

-- 3) ランク閾値: スケール系は目標正解数を 1/2
CREATE OR REPLACE FUNCTION public.training_score_to_rank(p_score integer, p_kind text DEFAULT 'chord')
RETURNS text AS $$
BEGIN
  IF p_kind = 'scale' THEN
    IF p_score >= 30 THEN RETURN 'S'; END IF;
    IF p_score >= 25 THEN RETURN 'A'; END IF;
    IF p_score >= 20 THEN RETURN 'B'; END IF;
    IF p_score >= 15 THEN RETURN 'C'; END IF;
    IF p_score >= 10 THEN RETURN 'D'; END IF;
    IF p_score >= 5 THEN RETURN 'E'; END IF;
    RETURN 'F';
  END IF;

  IF p_score >= 60 THEN RETURN 'S'; END IF;
  IF p_score >= 50 THEN RETURN 'A'; END IF;
  IF p_score >= 40 THEN RETURN 'B'; END IF;
  IF p_score >= 30 THEN RETURN 'C'; END IF;
  IF p_score >= 20 THEN RETURN 'D'; END IF;
  IF p_score >= 10 THEN RETURN 'E'; END IF;
  RETURN 'F';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

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
  v_kind text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_score IS NULL OR p_score < 0 THEN
    RAISE EXCEPTION 'Invalid score';
  END IF;

  SELECT kind INTO v_kind
  FROM public.trainings
  WHERE id = p_training_id;

  IF v_kind IS NULL THEN
    RAISE EXCEPTION 'Training not found';
  END IF;

  SELECT ts.best_score INTO v_prev
  FROM public.training_scores ts
  WHERE ts.user_id = v_uid AND ts.training_id = p_training_id;

  v_new := GREATEST(COALESCE(v_prev, 0), p_score);

  INSERT INTO public.training_scores (user_id, training_id, best_score, best_rank, achieved_at, play_count, updated_at)
  VALUES (v_uid, p_training_id, v_new, public.training_score_to_rank(v_new, v_kind), now(), 1, now())
  ON CONFLICT (user_id, training_id) DO UPDATE SET
    play_count = public.training_scores.play_count + 1,
    updated_at = now(),
    best_score = v_new,
    best_rank = public.training_score_to_rank(v_new, v_kind),
    achieved_at = CASE
      WHEN v_new > public.training_scores.best_score THEN now()
      ELSE public.training_scores.achieved_at
    END;

  best_score := v_new;
  best_rank := public.training_score_to_rank(v_new, v_kind);
  is_new_best := (v_new = p_score AND p_score > COALESCE(v_prev, -1));

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) 既存スケール系 best_rank を再計算
UPDATE public.training_scores ts
SET best_rank = public.training_score_to_rank(ts.best_score, 'scale'),
    updated_at = now()
FROM public.trainings t
WHERE t.id = ts.training_id
  AND t.kind = 'scale';

COMMIT;
