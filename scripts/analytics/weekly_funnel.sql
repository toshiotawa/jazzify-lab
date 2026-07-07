-- 週次ファネル（utm_source別）
-- Supabase SQL Editor で実行。直近7日の新規登録者を対象。
SELECT
  coalesce(p.first_touch_utm_source, 'organic') AS source,
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

-- 課題ファネル（メインクエスト第1章・直近7日登録者）
-- 1-1 開始 → 1-1 クリア → 1-2 開始 → 1-2 クリア … を order_index で追跡
WITH recent_users AS (
  SELECT id
  FROM profiles
  WHERE created_at >= now() - interval '7 days'
),
mq_block1_lessons AS (
  SELECT l.id AS lesson_id, l.order_index AS lesson_order
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  WHERE c.is_main_course = true
    AND l.block_number = 1
),
mq_block1_assignments AS (
  SELECT
    ls.id AS lesson_song_id,
    ls.lesson_id,
    ml.lesson_order,
    ls.order_index AS assignment_order
  FROM lesson_songs ls
  JOIN mq_block1_lessons ml ON ml.lesson_id = ls.lesson_id
)
SELECT
  a.lesson_order,
  a.assignment_order,
  count(DISTINCT s.user_id) FILTER (
    WHERE s.is_practice = false
  ) AS started,
  count(DISTINCT p.user_id) FILTER (
    WHERE p.is_completed
  ) AS cleared
FROM mq_block1_assignments a
LEFT JOIN user_assignment_starts s
  ON s.lesson_song_id = a.lesson_song_id
  AND s.user_id IN (SELECT id FROM recent_users)
LEFT JOIN user_lesson_requirements_progress p
  ON p.lesson_song_id = a.lesson_song_id
  AND p.user_id IN (SELECT id FROM recent_users)
GROUP BY a.lesson_order, a.assignment_order
ORDER BY a.lesson_order, a.assignment_order;

-- MQ第1章・MIDI接続別クリア率（直近7日登録者・本番課題のみ）
WITH recent_users AS (
  SELECT id
  FROM profiles
  WHERE created_at >= now() - interval '7 days'
),
mq_block1_lessons AS (
  SELECT l.id AS lesson_id, l.order_index AS lesson_order
  FROM lessons l
  JOIN courses c ON c.id = l.course_id
  WHERE c.is_main_course = true
    AND l.block_number = 1
),
mq_block1_assignments AS (
  SELECT
    ls.id AS lesson_song_id,
    ls.lesson_id,
    ml.lesson_order,
    ls.order_index AS assignment_order
  FROM lesson_songs ls
  JOIN mq_block1_lessons ml ON ml.lesson_id = ls.lesson_id
)
SELECT
  a.lesson_order,
  a.assignment_order,
  coalesce(s.midi_connected::text, 'unknown') AS midi_connected,
  coalesce(s.input_method, 'unknown') AS input_method,
  count(DISTINCT s.user_id) AS started,
  count(DISTINCT p.user_id) FILTER (
    WHERE p.is_completed
  ) AS cleared
FROM mq_block1_assignments a
LEFT JOIN user_assignment_starts s
  ON s.lesson_song_id = a.lesson_song_id
  AND s.user_id IN (SELECT id FROM recent_users)
  AND s.is_practice = false
LEFT JOIN user_lesson_requirements_progress p
  ON p.lesson_song_id = a.lesson_song_id
  AND p.user_id IN (SELECT id FROM recent_users)
GROUP BY a.lesson_order, a.assignment_order, s.midi_connected, s.input_method
ORDER BY a.lesson_order, a.assignment_order, midi_connected, input_method;
