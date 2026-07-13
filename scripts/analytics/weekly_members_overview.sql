-- 週次: 新規会員・有料・端末・地域・導線
-- 対象: auth.users 直近7日。1ブロックずつ実行すること。

-- ============================================================
-- A. 新規会員サマリー
-- ============================================================
SELECT
  now() AT TIME ZONE 'Asia/Tokyo' AS queried_at_jst,
  count(*) AS new_members,
  count(*) FILTER (WHERE u.email_confirmed_at IS NOT NULL) AS email_confirmed,
  count(*) FILTER (WHERE u.last_sign_in_at IS NOT NULL) AS has_signed_in,
  count(*) FILTER (WHERE p.id IS NOT NULL) AS has_profile,
  count(*) FILTER (WHERE p.id IS NULL) AS no_profile
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.created_at >= now() - interval '7 days';

-- ============================================================
-- B. 日次 × プラットフォーム
-- ============================================================
SELECT
  date(u.created_at AT TIME ZONE 'Asia/Tokyo') AS signup_date_jst,
  count(*) AS signups,
  count(*) FILTER (WHERE p.signup_platform = 'web') AS web,
  count(*) FILTER (WHERE p.signup_platform = 'ios') AS ios,
  count(*) FILTER (WHERE p.id IS NULL) AS no_profile,
  count(*) FILTER (WHERE u.email_confirmed_at IS NOT NULL) AS confirmed
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY 1;

-- ============================================================
-- C. 有料スナップショット（現時点）
-- ============================================================
SELECT p.rank::text AS rank, count(*) AS cnt
FROM public.profiles p
GROUP BY p.rank
ORDER BY cnt DESC;

SELECT
  status,
  provider,
  plan_code,
  count(*) AS cnt
FROM public.subscriptions
GROUP BY 1, 2, 3
ORDER BY 1, 2, 3;

-- ============================================================
-- D. 直近7日のサブスク増減
-- ============================================================
SELECT
  date(s.created_at AT TIME ZONE 'Asia/Tokyo') AS d,
  s.status,
  s.provider,
  s.plan_code,
  date(u.created_at AT TIME ZONE 'Asia/Tokyo') AS user_signup_jst,
  p.signup_platform,
  p.rank::text AS rank
FROM public.subscriptions s
JOIN auth.users u ON u.id = s.user_id
LEFT JOIN public.profiles p ON p.id = s.user_id
WHERE s.created_at >= now() - interval '7 days'
ORDER BY s.created_at;

SELECT
  event_type,
  provider,
  count(*) AS cnt
FROM public.subscription_events
WHERE created_at >= now() - interval '7 days'
GROUP BY 1, 2
ORDER BY cnt DESC;

-- ============================================================
-- E. 新規プロフィールの端末・地域・ロケール
-- ============================================================
SELECT coalesce(p.signup_platform, '(null)') AS signup_platform, count(*) AS cnt
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY cnt DESC;

SELECT coalesce(p.signup_device_category, '(null)') AS device, count(*) AS cnt
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY cnt DESC;

SELECT coalesce(p.country, '(null)') AS country, count(*) AS cnt
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY cnt DESC;

SELECT coalesce(p.preferred_locale, '(null)') AS locale, count(*) AS cnt
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY cnt DESC;

-- ============================================================
-- F. first-touch UTM / landing
-- ============================================================
SELECT
  coalesce(p.first_touch_utm_source, '(none)') AS utm_source,
  coalesce(p.first_touch_utm_medium, '(none)') AS utm_medium,
  coalesce(p.first_touch_utm_campaign, '(none)') AS utm_campaign,
  coalesce(p.first_touch_utm_content, '(none)') AS utm_content,
  count(*) AS cnt
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= now() - interval '7 days'
GROUP BY 1, 2, 3, 4
ORDER BY cnt DESC
LIMIT 30;

SELECT
  coalesce(p.first_touch_landing_path, '(none)') AS landing_path,
  count(*) AS cnt
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY cnt DESC
LIMIT 20;

-- ============================================================
-- G. user_milestones（新規登録者）
-- ============================================================
SELECT
  count(*) AS new_users_total,
  count(*) FILTER (WHERE m.first_play_at IS NOT NULL) AS first_play,
  count(*) FILTER (WHERE m.first_success_at IS NOT NULL) AS first_success,
  count(*) FILTER (WHERE m.free_tier_wall_view_at IS NOT NULL) AS paywall_view,
  count(*) FILTER (WHERE m.checkout_click_at IS NOT NULL) AS checkout_click,
  count(*) FILTER (WHERE m.trial_start_at IS NOT NULL) AS trial_start,
  count(*) FILTER (WHERE m.paid_at IS NOT NULL) AS paid_milestone
FROM auth.users u
LEFT JOIN public.user_milestones m ON m.user_id = u.id
WHERE u.created_at >= now() - interval '7 days';
