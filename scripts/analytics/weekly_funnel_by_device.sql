-- 週次ファネル（signup_device_category × signup_os）
-- Supabase SQL Editor で実行。直近7日の Web 新規登録者を対象。
SELECT
  coalesce(p.signup_device_category, 'unknown') AS device,
  coalesce(p.signup_os, 'unknown') AS os,
  coalesce(p.signup_browser, 'unknown') AS browser,
  count(*) AS signups,
  count(m.first_play_at) AS first_played,
  count(m.first_success_at) AS first_success,
  count(m.free_tier_wall_view_at) AS wall_reached,
  count(m.checkout_click_at) AS checkout_clicks,
  count(s.trial_used_at) AS trials,
  count(*) FILTER (
    WHERE s.entitlement_state = 'active' AND s.status <> 'trial'
  ) AS paid
FROM profiles p
LEFT JOIN user_milestones m ON m.user_id = p.id
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.created_at >= now() - interval '7 days'
  AND coalesce(p.signup_platform, 'web') = 'web'
GROUP BY 1, 2, 3
ORDER BY signups DESC;
