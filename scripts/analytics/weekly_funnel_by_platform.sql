-- 週次ファネル（signup_platform別）
-- Supabase SQL Editor で実行。直近7日の新規登録者を対象。
SELECT
  coalesce(p.signup_platform, 'unknown') AS platform,
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
GROUP BY 1
ORDER BY signups DESC;
