-- ソフトランディング（コードラン初級 block1）の進捗ファネル（全会員スナップショット）
-- 7日コホート版: scripts/analytics/weekly_soft_landing_marketing.sql（節 A–C）
-- 実行: Supabase SQL Editor または psql
--
-- 2026-08-11 時点スナップショット（無料ユーザー）:
--   MQ B1 完了: 81
--   その後コードラン B1 開始: 38（47%）
--   その後コードラン B1 完了: 2（2.5%）
--
-- アプリ内オファー（GA4）:
--   soft_landing_offer_viewed / _accepted / _dismissed
--   entry: chapter_complete | soft_landing | dashboard
--   GA4 で viewed→accepted 率と、accepted 後の再訪（コードラン B1 開始）を突き合わせる。

WITH paid_users AS (
  SELECT DISTINCT s.user_id
  FROM subscriptions s
  WHERE s.entitlement_state IN (
    'active', 'payment_issue_with_access', 'cancelled_but_active_until_end'
  )
),
main_course AS (
  SELECT id
  FROM courses
  WHERE is_main_course = true
    AND is_visible = true
    AND is_developer_only = false
  ORDER BY order_index ASC
  LIMIT 1
),
chord_run AS (
  SELECT id
  FROM courses
  WHERE soft_landing_order = 1
    AND is_visible = true
    AND is_developer_only = false
  LIMIT 1
),
mq_b1 AS (
  SELECT l.id AS lesson_id
  FROM lessons l
  JOIN main_course mc ON l.course_id = mc.id
  WHERE l.block_number = 1
),
cr_b1 AS (
  SELECT l.id AS lesson_id
  FROM lessons l
  JOIN chord_run cr ON l.course_id = cr.id
  WHERE l.block_number = 1
),
free_users AS (
  SELECT p.id
  FROM profiles p
  WHERE p.id NOT IN (SELECT user_id FROM paid_users)
),
mq_done AS (
  SELECT fu.id
  FROM free_users fu
  WHERE NOT EXISTS (
    SELECT 1
    FROM mq_b1 b
    LEFT JOIN user_lesson_progress ulp
      ON ulp.user_id = fu.id
      AND ulp.lesson_id = b.lesson_id
      AND ulp.completed = true
    WHERE ulp.lesson_id IS NULL
  )
),
cr_started AS (
  SELECT DISTINCT ulp.user_id
  FROM user_lesson_progress ulp
  JOIN cr_b1 b ON ulp.lesson_id = b.lesson_id
  WHERE ulp.user_id IN (SELECT id FROM mq_done)
),
cr_b1_done AS (
  SELECT fu.id
  FROM free_users fu
  WHERE NOT EXISTS (
    SELECT 1
    FROM cr_b1 b
    LEFT JOIN user_lesson_progress ulp
      ON ulp.user_id = fu.id
      AND ulp.lesson_id = b.lesson_id
      AND ulp.completed = true
    WHERE ulp.lesson_id IS NULL
  )
)
SELECT
  (SELECT count(*) FROM mq_done) AS mq_b1_complete_free,
  (SELECT count(*) FROM cr_started) AS chord_run_b1_started_after_mq,
  (SELECT count(*) FROM cr_b1_done WHERE id IN (SELECT id FROM mq_done)) AS chord_run_b1_complete_after_mq,
  round(
    100.0 * (SELECT count(*) FROM cr_started)
    / nullif((SELECT count(*) FROM mq_done), 0),
    1
  ) AS start_rate_pct,
  round(
    100.0 * (SELECT count(*) FROM cr_b1_done WHERE id IN (SELECT id FROM mq_done))
    / nullif((SELECT count(*) FROM mq_done), 0),
    1
  ) AS complete_rate_pct;
