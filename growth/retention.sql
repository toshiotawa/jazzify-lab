-- Jazzify 継続・解約分析（MCP / SQL Editor、1クエリずつ）

-- ============================================================
-- A. 失効サブスクの在籍期間
-- ============================================================
SELECT
  bs.provider,
  bs.plan_code,
  bs.status,
  date(bs.provider_created_at AT TIME ZONE 'Asia/Tokyo') AS started_jst,
  date(coalesce(bs.ends_at, bs.cancelled_at) AT TIME ZONE 'Asia/Tokyo') AS ended_jst,
  round(
    extract(epoch FROM (coalesce(bs.ends_at, bs.cancelled_at, now()) - bs.provider_created_at)) / 86400,
    1
  ) AS days_active
FROM billing_subscriptions bs
WHERE bs.status = 'expired'
ORDER BY bs.provider_created_at DESC;

-- ============================================================
-- B. 課金後30日以内の利用（trial_start または paid 後）
-- ============================================================
WITH paid_users AS (
  SELECT
    m.user_id,
    coalesce(m.paid_at, m.trial_start_at) AS monetized_at
  FROM user_milestones m
  WHERE m.paid_at IS NOT NULL OR m.trial_start_at IS NOT NULL
)
SELECT
  count(*) AS monetized_users,
  count(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM user_lesson_progress ulp
      WHERE ulp.user_id = pu.user_id
        AND ulp.updated_at >= pu.monetized_at
        AND ulp.updated_at <= pu.monetized_at + interval '30 days'
    )
  ) AS active_lesson_within_30d,
  count(*) FILTER (
    WHERE EXISTS (
      SELECT 1 FROM fantasy_stage_clears fsc
      WHERE fsc.user_id = pu.user_id
        AND fsc.cleared_at >= pu.monetized_at
        AND fsc.cleared_at <= pu.monetized_at + interval '30 days'
    )
  ) AS fantasy_clear_within_30d
FROM paid_users pu;

-- ============================================================
-- C. 解約直前7日のセッション proxy（lesson progress 更新）
-- ============================================================
SELECT
  bs.user_id,
  bs.plan_code,
  date(bs.ends_at AT TIME ZONE 'Asia/Tokyo') AS ended_jst,
  (
    SELECT max(ulp.updated_at)
    FROM user_lesson_progress ulp
    WHERE ulp.user_id = bs.user_id
  ) AS last_lesson_activity,
  (
    SELECT count(*)
    FROM user_lesson_progress ulp
    WHERE ulp.user_id = bs.user_id
      AND ulp.updated_at >= coalesce(bs.ends_at, now()) - interval '7 days'
      AND ulp.updated_at <= coalesce(bs.ends_at, now())
  ) AS lesson_updates_last_7d_before_end
FROM billing_subscriptions bs
WHERE bs.status = 'expired'
  AND bs.ends_at IS NOT NULL
ORDER BY bs.ends_at DESC;

-- ============================================================
-- D. 現在アクティブ有料の MRR 概算（JPY plan_code のみ）
-- ============================================================
SELECT
  bs.plan_code,
  count(*) AS active_cnt,
  sum(
    CASE bs.plan_code
      WHEN 'core_monthly' THEN 3980
      WHEN 'core_yearly' THEN round(34800 / 12.0)
      ELSE 0
    END
  ) AS approx_monthly_jpy
FROM billing_subscriptions bs
WHERE bs.status = 'active'
GROUP BY 1;
