-- 週次: ソフトランディング・メルマガ・paywall出所・ドとソMIDI
-- 対象: auth.users 直近7日（プロフィール作成者）。1ステートメントずつ実行すること。
-- 全体スナップショットは soft_landing_funnel.sql を参照。

-- ============================================================
-- A. ソフトランディング（order=1 コードラン初級 B1）× 7日コホート
-- MQ block1 全レッスン完了 → コードラン B1 開始/完了
-- 進捗: user_lesson_progress.completed
-- ============================================================
WITH new_profiles AS (
  SELECT p.id
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
main_course AS (
  SELECT id
  FROM public.courses
  WHERE is_main_course = true
    AND is_visible = true
    AND is_developer_only = false
  ORDER BY order_index ASC
  LIMIT 1
),
chord_run AS (
  SELECT id
  FROM public.courses
  WHERE soft_landing_order = 1
    AND is_visible = true
    AND is_developer_only = false
  LIMIT 1
),
mq_b1 AS (
  SELECT l.id AS lesson_id
  FROM public.lessons l
  JOIN main_course mc ON l.course_id = mc.id
  WHERE l.block_number = 1
),
cr_b1 AS (
  SELECT l.id AS lesson_id
  FROM public.lessons l
  JOIN chord_run cr ON l.course_id = cr.id
  WHERE l.block_number = 1
),
mq_done AS (
  SELECT np.id
  FROM new_profiles np
  WHERE NOT EXISTS (
    SELECT 1
    FROM mq_b1 b
    LEFT JOIN public.user_lesson_progress ulp
      ON ulp.user_id = np.id
      AND ulp.lesson_id = b.lesson_id
      AND ulp.completed = true
    WHERE ulp.lesson_id IS NULL
  )
),
cr_started AS (
  SELECT DISTINCT ulp.user_id
  FROM public.user_lesson_progress ulp
  JOIN cr_b1 b ON ulp.lesson_id = b.lesson_id
  WHERE ulp.user_id IN (SELECT id FROM mq_done)
),
cr_b1_done AS (
  SELECT np.id
  FROM new_profiles np
  WHERE NOT EXISTS (
    SELECT 1
    FROM cr_b1 b
    LEFT JOIN public.user_lesson_progress ulp
      ON ulp.user_id = np.id
      AND ulp.lesson_id = b.lesson_id
      AND ulp.completed = true
    WHERE ulp.lesson_id IS NULL
  )
  AND np.id IN (SELECT id FROM mq_done)
)
SELECT
  (SELECT count(*) FROM new_profiles) AS new_profiles,
  (SELECT count(*) FROM mq_done) AS mq_b1_complete,
  (SELECT count(*) FROM cr_started) AS chord_run_b1_started,
  (SELECT count(*) FROM cr_b1_done) AS chord_run_b1_complete,
  round(
    100.0 * (SELECT count(*) FROM cr_started)
    / nullif((SELECT count(*) FROM mq_done), 0),
    1
  ) AS start_rate_pct,
  round(
    100.0 * (SELECT count(*) FROM cr_b1_done)
    / nullif((SELECT count(*) FROM mq_done), 0),
    1
  ) AS complete_rate_pct;

-- ============================================================
-- B. ソフトランディング（order=1）× signup_platform
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
main_course AS (
  SELECT id
  FROM public.courses
  WHERE is_main_course = true
    AND is_visible = true
    AND is_developer_only = false
  ORDER BY order_index ASC
  LIMIT 1
),
chord_run AS (
  SELECT id
  FROM public.courses
  WHERE soft_landing_order = 1
    AND is_visible = true
    AND is_developer_only = false
  LIMIT 1
),
mq_b1 AS (
  SELECT l.id AS lesson_id
  FROM public.lessons l
  JOIN main_course mc ON l.course_id = mc.id
  WHERE l.block_number = 1
),
cr_b1 AS (
  SELECT l.id AS lesson_id
  FROM public.lessons l
  JOIN chord_run cr ON l.course_id = cr.id
  WHERE l.block_number = 1
),
per_user AS (
  SELECT
    np.id,
    np.signup_platform,
    NOT EXISTS (
      SELECT 1
      FROM mq_b1 b
      LEFT JOIN public.user_lesson_progress ulp
        ON ulp.user_id = np.id
        AND ulp.lesson_id = b.lesson_id
        AND ulp.completed = true
      WHERE ulp.lesson_id IS NULL
    ) AS mq_b1_complete,
    EXISTS (
      SELECT 1
      FROM public.user_lesson_progress ulp
      JOIN cr_b1 b ON ulp.lesson_id = b.lesson_id
      WHERE ulp.user_id = np.id
    ) AS chord_run_b1_started,
    NOT EXISTS (
      SELECT 1
      FROM cr_b1 b
      LEFT JOIN public.user_lesson_progress ulp
        ON ulp.user_id = np.id
        AND ulp.lesson_id = b.lesson_id
        AND ulp.completed = true
      WHERE ulp.lesson_id IS NULL
    ) AS chord_run_b1_complete
  FROM new_profiles np
)
SELECT
  coalesce(signup_platform, '(null)') AS platform,
  count(*) AS profiles,
  count(*) FILTER (WHERE mq_b1_complete) AS mq_b1_complete,
  count(*) FILTER (WHERE mq_b1_complete AND chord_run_b1_started) AS chord_run_started,
  count(*) FILTER (WHERE mq_b1_complete AND chord_run_b1_complete) AS chord_run_b1_complete
FROM per_user
GROUP BY 1
ORDER BY profiles DESC;

-- ============================================================
-- C. ソフトランディング order=2（中級）× MQ B1 完了コホート
-- order=1 B1 完了後に order=2 B1 開始/完了
-- ============================================================
WITH new_profiles AS (
  SELECT p.id
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
chord_run_beginner AS (
  SELECT id
  FROM public.courses
  WHERE soft_landing_order = 1
    AND is_visible = true
    AND is_developer_only = false
  LIMIT 1
),
chord_run_intermediate AS (
  SELECT id
  FROM public.courses
  WHERE soft_landing_order = 2
    AND is_visible = true
    AND is_developer_only = false
  LIMIT 1
),
cr1_b1 AS (
  SELECT l.id AS lesson_id
  FROM public.lessons l
  JOIN chord_run_beginner cr ON l.course_id = cr.id
  WHERE l.block_number = 1
),
cr2_b1 AS (
  SELECT l.id AS lesson_id
  FROM public.lessons l
  JOIN chord_run_intermediate cr ON l.course_id = cr.id
  WHERE l.block_number = 1
),
cr1_done AS (
  SELECT np.id
  FROM new_profiles np
  WHERE NOT EXISTS (
    SELECT 1
    FROM cr1_b1 b
    LEFT JOIN public.user_lesson_progress ulp
      ON ulp.user_id = np.id
      AND ulp.lesson_id = b.lesson_id
      AND ulp.completed = true
    WHERE ulp.lesson_id IS NULL
  )
),
cr2_started AS (
  SELECT DISTINCT ulp.user_id
  FROM public.user_lesson_progress ulp
  JOIN cr2_b1 b ON ulp.lesson_id = b.lesson_id
  WHERE ulp.user_id IN (SELECT id FROM cr1_done)
),
cr2_done AS (
  SELECT np.id
  FROM new_profiles np
  WHERE NOT EXISTS (
    SELECT 1
    FROM cr2_b1 b
    LEFT JOIN public.user_lesson_progress ulp
      ON ulp.user_id = np.id
      AND ulp.lesson_id = b.lesson_id
      AND ulp.completed = true
    WHERE ulp.lesson_id IS NULL
  )
  AND np.id IN (SELECT id FROM cr1_done)
)
SELECT
  (SELECT count(*) FROM cr1_done) AS chord_run_beginner_b1_complete,
  (SELECT count(*) FROM cr2_started) AS chord_run_intermediate_b1_started,
  (SELECT count(*) FROM cr2_done) AS chord_run_intermediate_b1_complete,
  round(
    100.0 * (SELECT count(*) FROM cr2_started)
    / nullif((SELECT count(*) FROM cr1_done), 0),
    1
  ) AS intermediate_start_rate_pct;

-- ============================================================
-- D. paywall 出所 × checkout / trial（7日コホート）
-- ============================================================
WITH new_users AS (
  SELECT u.id FROM auth.users u WHERE u.created_at >= now() - interval '7 days'
)
SELECT
  coalesce(m.free_tier_wall_view_source, '(unknown)') AS paywall_source,
  count(*) FILTER (WHERE m.free_tier_wall_view_at IS NOT NULL) AS paywall_users,
  count(*) FILTER (WHERE m.checkout_click_at IS NOT NULL) AS checkout_clicked,
  count(*) FILTER (WHERE m.trial_start_at IS NOT NULL) AS trial_started,
  count(*) FILTER (WHERE m.paid_at IS NOT NULL) AS paid_milestone,
  round(
    100.0 * count(*) FILTER (WHERE m.checkout_click_at IS NOT NULL)
      / nullif(count(*) FILTER (WHERE m.free_tier_wall_view_at IS NOT NULL), 0),
    1
  ) AS paywall_to_checkout_pct
FROM new_users nu
JOIN public.user_milestones m ON m.user_id = nu.id
WHERE m.free_tier_wall_view_at IS NOT NULL
GROUP BY 1
ORDER BY paywall_users DESC;

-- ============================================================
-- E. checkout 出所別（7日コホート）
-- ============================================================
WITH new_users AS (
  SELECT u.id FROM auth.users u WHERE u.created_at >= now() - interval '7 days'
)
SELECT
  coalesce(m.checkout_click_source, m.free_tier_wall_view_source, '(unknown)') AS checkout_source,
  count(*) AS checkout_clicks,
  count(*) FILTER (WHERE m.trial_start_at IS NOT NULL) AS trial_started,
  count(*) FILTER (WHERE m.paid_at IS NOT NULL) AS paid_milestone
FROM new_users nu
JOIN public.user_milestones m ON m.user_id = nu.id
WHERE m.checkout_click_at IS NOT NULL
GROUP BY 1
ORDER BY checkout_clicks DESC;

-- ============================================================
-- F. marketing_email_opt_in（7日コホート）
-- ============================================================
SELECT
  count(*) AS new_profiles,
  count(*) FILTER (WHERE p.marketing_email_opt_in = true) AS opt_in,
  round(
    100.0 * count(*) FILTER (WHERE p.marketing_email_opt_in = true) / nullif(count(*), 0),
    1
  ) AS opt_in_pct
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= now() - interval '7 days';

SELECT
  coalesce(p.signup_platform, '(null)') AS signup_platform,
  count(*) AS profiles,
  count(*) FILTER (WHERE p.marketing_email_opt_in = true) AS opt_in,
  round(
    100.0 * count(*) FILTER (WHERE p.marketing_email_opt_in = true) / nullif(count(*), 0),
    1
  ) AS opt_in_pct
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY profiles DESC;

SELECT
  coalesce(p.marketing_email_opt_in_source, '(null)') AS opt_in_source,
  count(*) AS opt_in_users
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.created_at >= now() - interval '7 days'
  AND p.marketing_email_opt_in = true
GROUP BY 1
ORDER BY opt_in_users DESC;

-- ============================================================
-- G. marketing_email_sends（直近7日送信 × email_key）
-- ============================================================
SELECT
  mes.email_key,
  count(*) AS sends,
  count(DISTINCT mes.user_id) AS unique_users
FROM public.marketing_email_sends mes
WHERE mes.sent_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY sends DESC;

SELECT
  date(mes.sent_at AT TIME ZONE 'Asia/Tokyo') AS sent_date_jst,
  mes.email_key,
  count(*) AS sends
FROM public.marketing_email_sends mes
WHERE mes.sent_at >= now() - interval '7 days'
GROUP BY 1, 2
ORDER BY 1, sends DESC;

-- ============================================================
-- H. 「1-1. ドとソをまねしよう」クリア vs 開始ログ vs MIDI（7日コホート）
-- lesson_song_id: c3287633-fab3-5551-9a2c-a56d6f5fb4bc（OSMDタイミング調整）
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
do_so AS (
  SELECT 'c3287633-fab3-5551-9a2c-a56d6f5fb4bc'::uuid AS lesson_song_id
),
per_user AS (
  SELECT
    np.id,
    np.signup_platform,
    EXISTS (
      SELECT 1
      FROM public.user_lesson_requirements_progress ulrp
      CROSS JOIN do_so d
      WHERE ulrp.user_id = np.id
        AND ulrp.lesson_song_id = d.lesson_song_id
        AND ulrp.is_completed = true
    ) AS cleared,
    EXISTS (
      SELECT 1
      FROM public.user_assignment_starts s
      CROSS JOIN do_so d
      WHERE s.user_id = np.id
        AND s.lesson_song_id = d.lesson_song_id
        AND s.is_practice = false
    ) AS has_start,
    (
      SELECT bool_or(coalesce(s.midi_connected, false))
      FROM public.user_assignment_starts s
      CROSS JOIN do_so d
      WHERE s.user_id = np.id
        AND s.lesson_song_id = d.lesson_song_id
        AND s.is_practice = false
    ) AS ever_midi
  FROM new_profiles np
)
SELECT
  count(*) AS new_profiles,
  count(*) FILTER (WHERE cleared) AS cleared_users,
  count(*) FILTER (WHERE has_start) AS started_users,
  count(*) FILTER (WHERE cleared AND NOT has_start) AS cleared_no_start,
  count(*) FILTER (WHERE has_start AND ever_midi) AS started_midi_on,
  count(*) FILTER (WHERE has_start AND NOT coalesce(ever_midi, false)) AS started_midi_off,
  round(100.0 * count(*) FILTER (WHERE cleared) / nullif(count(*), 0), 1) AS clear_pct,
  round(
    100.0 * count(*) FILTER (WHERE has_start AND ever_midi)
      / nullif(count(*) FILTER (WHERE has_start), 0),
    1
  ) AS midi_on_pct_of_starters
FROM per_user;

WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
do_so AS (
  SELECT 'c3287633-fab3-5551-9a2c-a56d6f5fb4bc'::uuid AS lesson_song_id
),
per_user AS (
  SELECT
    np.signup_platform,
    EXISTS (
      SELECT 1
      FROM public.user_lesson_requirements_progress ulrp
      CROSS JOIN do_so d
      WHERE ulrp.user_id = np.id
        AND ulrp.lesson_song_id = d.lesson_song_id
        AND ulrp.is_completed = true
    ) AS cleared,
    EXISTS (
      SELECT 1
      FROM public.user_assignment_starts s
      CROSS JOIN do_so d
      WHERE s.user_id = np.id
        AND s.lesson_song_id = d.lesson_song_id
        AND s.is_practice = false
    ) AS has_start,
    (
      SELECT bool_or(coalesce(s.midi_connected, false))
      FROM public.user_assignment_starts s
      CROSS JOIN do_so d
      WHERE s.user_id = np.id
        AND s.lesson_song_id = d.lesson_song_id
        AND s.is_practice = false
    ) AS ever_midi
  FROM new_profiles np
)
SELECT
  coalesce(signup_platform, '(null)') AS platform,
  count(*) AS profiles,
  count(*) FILTER (WHERE cleared) AS cleared,
  count(*) FILTER (WHERE has_start) AS started,
  count(*) FILTER (WHERE has_start AND ever_midi) AS midi_on,
  count(*) FILTER (WHERE cleared AND NOT has_start) AS cleared_no_start
FROM per_user
GROUP BY 1
ORDER BY profiles DESC;
