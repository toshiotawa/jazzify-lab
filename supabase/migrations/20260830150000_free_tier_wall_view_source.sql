-- ペイウォール表示元（初回のみ記録）
ALTER TABLE user_milestones ADD COLUMN IF NOT EXISTS free_tier_wall_view_source text;

CREATE OR REPLACE FUNCTION record_user_milestone(
  p_user_id uuid,
  p_milestone text,
  p_source text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_column text;
BEGIN
  IF p_user_id IS DISTINCT FROM auth.uid() AND auth.role() <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  v_column := CASE p_milestone
    WHEN 'first_play' THEN 'first_play_at'
    WHEN 'first_success' THEN 'first_success_at'
    WHEN 'free_tier_wall_view' THEN 'free_tier_wall_view_at'
    WHEN 'checkout_click' THEN 'checkout_click_at'
    WHEN 'trial_start' THEN 'trial_start_at'
    WHEN 'paid' THEN 'paid_at'
    ELSE NULL
  END;
  IF v_column IS NULL THEN
    RAISE EXCEPTION 'invalid milestone: %', p_milestone;
  END IF;

  INSERT INTO user_milestones (user_id) VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  EXECUTE format(
    'UPDATE user_milestones SET %I = COALESCE(%I, now()), updated_at = now() WHERE user_id = $1',
    v_column, v_column
  ) USING p_user_id;

  IF p_milestone = 'free_tier_wall_view'
     AND p_source IS NOT NULL
     AND length(trim(p_source)) > 0 THEN
    UPDATE user_milestones
    SET free_tier_wall_view_source = COALESCE(free_tier_wall_view_source, trim(p_source)),
        updated_at = now()
    WHERE user_id = p_user_id;
  END IF;
END;
$$;
