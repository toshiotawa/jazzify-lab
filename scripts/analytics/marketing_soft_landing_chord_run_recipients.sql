-- 母数確認: メインクエスト第1章クリア済み × コードラン初級 block1 未完了 × 未送信
-- 実行: Supabase SQL Editor または psql

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
chord_run_beginner AS (
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
  JOIN chord_run_beginner cr ON l.course_id = cr.id
  WHERE l.block_number = 1
),
per_user AS (
  SELECT
    p.id,
    p.email,
    p.marketing_email_opt_in,
    NOT EXISTS (
      SELECT 1
      FROM mq_b1 b
      LEFT JOIN user_lesson_progress ulp
        ON ulp.user_id = p.id
        AND ulp.lesson_id = b.lesson_id
        AND ulp.completed = true
      WHERE ulp.lesson_id IS NULL
    ) AS mq_b1_complete,
    EXISTS (
      SELECT 1
      FROM cr_b1 b
      LEFT JOIN user_lesson_progress ulp
        ON ulp.user_id = p.id
        AND ulp.lesson_id = b.lesson_id
        AND ulp.completed = true
      WHERE ulp.lesson_id IS NULL
    ) AS chord_run_b1_incomplete,
    (
      SELECT MAX(ulp.updated_at)
      FROM mq_b1 b
      JOIN user_lesson_progress ulp
        ON ulp.user_id = p.id
        AND ulp.lesson_id = b.lesson_id
        AND ulp.completed = true
    ) AS mq_b1_completed_at
  FROM profiles p
  WHERE p.marketing_email_opt_in = true
    AND p.email IS NOT NULL
    AND p.id NOT IN (SELECT user_id FROM paid_users)
)
SELECT count(*) AS eligible_now
FROM per_user
WHERE mq_b1_complete
  AND chord_run_b1_incomplete
  AND mq_b1_completed_at IS NOT NULL
  AND mq_b1_completed_at <= NOW() - INTERVAL '24 hours'
  AND NOT EXISTS (
    SELECT 1
    FROM marketing_email_sends mes
    WHERE mes.user_id = per_user.id
      AND mes.email_key = 'soft_landing_chord_run'
  );

-- 詳細プレビュー（先頭20件）
-- SELECT id, email, mq_b1_completed_at
-- FROM per_user
-- WHERE mq_b1_complete
--   AND chord_run_b1_incomplete
--   AND mq_b1_completed_at IS NOT NULL
--   AND mq_b1_completed_at <= NOW() - INTERVAL '24 hours'
--   AND NOT EXISTS (
--     SELECT 1 FROM marketing_email_sends mes
--     WHERE mes.user_id = per_user.id AND mes.email_key = 'soft_landing_chord_run'
--   )
-- ORDER BY mq_b1_completed_at DESC
-- LIMIT 20;
