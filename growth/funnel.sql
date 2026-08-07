-- Jazzify Growth ファネル（Supabase SQL Editor / MCP で1クエリずつ実行）
-- 期間: 直近7日の新規登録者（profiles.created_at）

-- ============================================================
-- A. 全体ファネル（7日登録者）
-- ============================================================
SELECT
  count(*) AS signups,
  count(*) FILTER (WHERE m.first_play_at IS NOT NULL) AS first_play,
  count(*) FILTER (WHERE m.first_success_at IS NOT NULL) AS first_success,
  count(*) FILTER (WHERE m.free_tier_wall_view_at IS NOT NULL) AS paywall_view,
  count(*) FILTER (WHERE m.checkout_click_at IS NOT NULL) AS checkout_click,
  count(*) FILTER (WHERE m.trial_start_at IS NOT NULL) AS trial_start,
  count(*) FILTER (WHERE m.paid_at IS NOT NULL) AS paid,
  round(100.0 * count(*) FILTER (WHERE m.trial_start_at IS NOT NULL) / nullif(count(*), 0), 2) AS trial_start_pct,
  round(100.0 * count(*) FILTER (WHERE p.first_touch_captured_at IS NOT NULL) / nullif(count(*), 0), 1) AS attribution_capture_pct,
  round(100.0 * count(*) FILTER (WHERE p.marketing_email_opt_in = true) / nullif(count(*), 0), 1) AS email_opt_in_pct
FROM profiles p
LEFT JOIN user_milestones m ON m.user_id = p.id
WHERE p.created_at >= now() - interval '7 days';

-- ============================================================
-- B. paywall 出所別（7日登録者）
-- ============================================================
SELECT
  coalesce(m.free_tier_wall_view_source, '(unknown)') AS paywall_source,
  count(*) FILTER (WHERE m.free_tier_wall_view_at IS NOT NULL) AS paywall_views,
  count(*) FILTER (WHERE m.checkout_click_at IS NOT NULL) AS checkout_clicks,
  count(*) FILTER (WHERE m.trial_start_at IS NOT NULL) AS trials,
  count(*) FILTER (WHERE m.paid_at IS NOT NULL) AS paid,
  round(
    100.0 * count(*) FILTER (WHERE m.checkout_click_at IS NOT NULL)
    / nullif(count(*) FILTER (WHERE m.free_tier_wall_view_at IS NOT NULL), 0),
    1
  ) AS view_to_checkout_pct
FROM profiles p
JOIN user_milestones m ON m.user_id = p.id
WHERE p.created_at >= now() - interval '7 days'
  AND m.free_tier_wall_view_at IS NOT NULL
GROUP BY 1
ORDER BY paywall_views DESC;

-- ============================================================
-- C. checkout 出所別（7日登録者）
-- ============================================================
SELECT
  coalesce(m.checkout_click_source, m.free_tier_wall_view_source, '(unknown)') AS checkout_source,
  count(*) AS checkout_clicks,
  count(*) FILTER (WHERE m.trial_start_at IS NOT NULL) AS trials,
  count(*) FILTER (WHERE m.paid_at IS NOT NULL) AS paid
FROM profiles p
JOIN user_milestones m ON m.user_id = p.id
WHERE p.created_at >= now() - interval '7 days'
  AND m.checkout_click_at IS NOT NULL
GROUP BY 1
ORDER BY checkout_clicks DESC;

-- ============================================================
-- D. UTM別（7日登録者）
-- ============================================================
SELECT
  coalesce(p.first_touch_utm_source, '(none)') AS utm_source,
  coalesce(p.first_touch_utm_medium, '(none)') AS utm_medium,
  count(*) AS signups,
  count(*) FILTER (WHERE m.trial_start_at IS NOT NULL) AS trials,
  count(*) FILTER (WHERE m.paid_at IS NOT NULL) AS paid
FROM profiles p
LEFT JOIN user_milestones m ON m.user_id = p.id
WHERE p.created_at >= now() - interval '7 days'
GROUP BY 1, 2
ORDER BY signups DESC
LIMIT 30;

-- ============================================================
-- E. 有料 MRR スナップショット
-- ============================================================
SELECT
  count(*) FILTER (WHERE status = 'active') AS billing_active,
  count(*) FILTER (WHERE status = 'expired') AS billing_expired
FROM billing_subscriptions;

SELECT plan_code, count(*) AS cnt
FROM billing_subscriptions
WHERE status = 'active'
GROUP BY 1;
