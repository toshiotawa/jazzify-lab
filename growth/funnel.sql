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

-- ============================================================
-- F. paywall 到達・未購入のその後（7日登録者）
-- 「その後遊んだ」= 到達時刻より後の lesson_progress / assignment_starts / fantasy_clears
-- ============================================================
WITH paid_users AS (
  SELECT DISTINCT s.user_id
  FROM subscriptions s
  WHERE s.entitlement_state IN (
    'active',
    'payment_issue_with_access',
    'cancelled_but_active_until_end'
  )
  UNION
  SELECT m.user_id
  FROM user_milestones m
  WHERE m.trial_start_at IS NOT NULL OR m.paid_at IS NOT NULL
),
cohort AS (
  SELECT
    m.user_id,
    m.free_tier_wall_view_at AS paywall_at,
    m.checkout_click_at,
    coalesce(m.free_tier_wall_view_source, '(unknown)') AS paywall_source
  FROM profiles p
  JOIN user_milestones m ON m.user_id = p.id
  WHERE p.created_at >= now() - interval '7 days'
    AND m.free_tier_wall_view_at IS NOT NULL
    AND m.user_id NOT IN (SELECT user_id FROM paid_users)
),
activity_after AS (
  SELECT
    c.user_id,
    GREATEST(
      coalesce(
        (SELECT max(ulp.updated_at)
         FROM user_lesson_progress ulp
         WHERE ulp.user_id = c.user_id AND ulp.updated_at > c.paywall_at),
        '-infinity'::timestamptz
      ),
      coalesce(
        (SELECT max(uas.first_started_at)
         FROM user_assignment_starts uas
         WHERE uas.user_id = c.user_id AND uas.first_started_at > c.paywall_at),
        '-infinity'::timestamptz
      ),
      coalesce(
        (SELECT max(fsc.cleared_at)
         FROM fantasy_stage_clears fsc
         WHERE fsc.user_id = c.user_id AND fsc.cleared_at > c.paywall_at),
        '-infinity'::timestamptz
      )
    ) AS last_after_paywall
  FROM cohort c
)
SELECT
  count(*) AS paywall_no_purchase,
  count(*) FILTER (WHERE c.checkout_click_at IS NULL) AS paywall_only,
  count(*) FILTER (WHERE c.checkout_click_at IS NOT NULL) AS paywall_and_checkout,
  count(*) FILTER (WHERE a.last_after_paywall = '-infinity'::timestamptz) AS no_play_after_paywall,
  round(
    100.0 * count(*) FILTER (WHERE a.last_after_paywall = '-infinity'::timestamptz)
      / nullif(count(*), 0),
    1
  ) AS no_play_after_paywall_pct,
  count(*) FILTER (
    WHERE a.last_after_paywall > c.paywall_at
      AND a.last_after_paywall <= c.paywall_at + interval '1 day'
  ) AS played_again_within_1d,
  count(*) FILTER (
    WHERE a.last_after_paywall > c.paywall_at + interval '1 day'
      AND a.last_after_paywall <= c.paywall_at + interval '7 days'
  ) AS played_again_1d_to_7d,
  count(*) FILTER (
    WHERE a.last_after_paywall > c.paywall_at + interval '7 days'
  ) AS played_again_after_7d
FROM cohort c
JOIN activity_after a ON a.user_id = c.user_id;

WITH paid_users AS (
  SELECT DISTINCT s.user_id
  FROM subscriptions s
  WHERE s.entitlement_state IN (
    'active',
    'payment_issue_with_access',
    'cancelled_but_active_until_end'
  )
  UNION
  SELECT m.user_id
  FROM user_milestones m
  WHERE m.trial_start_at IS NOT NULL OR m.paid_at IS NOT NULL
),
cohort AS (
  SELECT
    m.user_id,
    m.free_tier_wall_view_at AS paywall_at,
    coalesce(m.free_tier_wall_view_source, '(unknown)') AS paywall_source
  FROM profiles p
  JOIN user_milestones m ON m.user_id = p.id
  WHERE p.created_at >= now() - interval '7 days'
    AND m.free_tier_wall_view_at IS NOT NULL
    AND m.user_id NOT IN (SELECT user_id FROM paid_users)
),
activity_after AS (
  SELECT
    c.user_id,
    GREATEST(
      coalesce(
        (SELECT max(ulp.updated_at)
         FROM user_lesson_progress ulp
         WHERE ulp.user_id = c.user_id AND ulp.updated_at > c.paywall_at),
        '-infinity'::timestamptz
      ),
      coalesce(
        (SELECT max(uas.first_started_at)
         FROM user_assignment_starts uas
         WHERE uas.user_id = c.user_id AND uas.first_started_at > c.paywall_at),
        '-infinity'::timestamptz
      ),
      coalesce(
        (SELECT max(fsc.cleared_at)
         FROM fantasy_stage_clears fsc
         WHERE fsc.user_id = c.user_id AND fsc.cleared_at > c.paywall_at),
        '-infinity'::timestamptz
      )
    ) AS last_after_paywall
  FROM cohort c
)
SELECT
  c.paywall_source,
  count(*) AS no_purchase_users,
  count(*) FILTER (WHERE a.last_after_paywall = '-infinity'::timestamptz) AS no_play_after,
  count(*) FILTER (WHERE a.last_after_paywall <> '-infinity'::timestamptz) AS returned_after,
  round(
    100.0 * count(*) FILTER (WHERE a.last_after_paywall = '-infinity'::timestamptz)
      / nullif(count(*), 0),
    1
  ) AS no_play_after_pct
FROM cohort c
JOIN activity_after a ON a.user_id = c.user_id
GROUP BY 1
ORDER BY no_purchase_users DESC;

-- ============================================================
-- G. MIDI デバイス接続（7日登録者・本番課題開始ログあり）
-- ============================================================
WITH recent AS (
  SELECT p.id
  FROM profiles p
  WHERE p.created_at >= now() - interval '7 days'
),
per_user AS (
  SELECT
    s.user_id,
    coalesce(s.platform, '(null)') AS platform,
    bool_or(coalesce(s.midi_connected, false)) AS ever_midi,
    bool_or(coalesce(s.midi_api_available, false)) AS ever_api,
    max(s.midi_device_count) AS max_device_count,
    bool_or(s.input_method = 'midi') AS used_midi_input,
    bool_or(s.input_method = 'voice') AS used_voice_input
  FROM user_assignment_starts s
  JOIN recent r ON r.id = s.user_id
  WHERE s.is_practice = false
  GROUP BY s.user_id, coalesce(s.platform, '(null)')
)
SELECT
  platform,
  count(*) AS users_with_start,
  count(*) FILTER (WHERE ever_midi) AS ever_midi_connected,
  count(*) FILTER (WHERE ever_api) AS midi_api_available,
  count(*) FILTER (WHERE coalesce(max_device_count, 0) >= 1) AS device_count_ge_1,
  count(*) FILTER (WHERE coalesce(max_device_count, 0) = 0) AS device_count_0,
  count(*) FILTER (WHERE used_midi_input) AS input_method_midi,
  count(*) FILTER (WHERE used_voice_input) AS input_method_voice,
  round(100.0 * count(*) FILTER (WHERE ever_midi) / nullif(count(*), 0), 1) AS midi_connected_pct
FROM per_user
GROUP BY platform
ORDER BY users_with_start DESC;
