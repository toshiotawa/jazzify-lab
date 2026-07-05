-- profiles: 初回接点の属性 + GAクライアントID
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_touch_utm_source text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_touch_utm_medium text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_touch_utm_campaign text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_touch_utm_content text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_touch_utm_term text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_touch_referrer text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_touch_landing_path text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_touch_captured_at timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS ga_client_id text;

-- user_milestones: 登録後のプロダクト内マイルストーン（1ユーザー1行、初回到達時刻のみ保持）
CREATE TABLE IF NOT EXISTS user_milestones (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  first_play_at timestamptz,
  first_success_at timestamptz,
  free_tier_wall_view_at timestamptz,
  checkout_click_at timestamptz,
  trial_start_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_milestones_select_own" ON user_milestones
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_milestones_insert_own" ON user_milestones
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_milestones_update_own" ON user_milestones
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 汎用マイルストーン記録RPC（クライアント: 自分のuser_id / サーバー: service_role）
CREATE OR REPLACE FUNCTION record_user_milestone(p_user_id uuid, p_milestone text)
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
END;
$$;
