-- 週次: メインクエスト無料枠（block_number = 1）＋ペイウォール
-- 正本: src/utils/mainQuestFreeTier.ts の MAIN_QUEST_FREE_MAX_BLOCK_NUMBER = 1
-- 無料会員は第1ブロックのみ。第2ブロック以降は有料ロック。
-- 対象: 直近7日の新規プロフィール（auth.users JOIN profiles）
-- 1ステートメントずつ実行すること。

-- ============================================================
-- A. 無料枠（block 1）課題マスタ確認
-- ============================================================
SELECT
  l.block_number,
  l.order_index AS quest_order,
  l.title AS quest_title,
  ls.order_index AS song_order,
  ls.title AS assignment_title
FROM public.lessons l
JOIN public.courses c ON c.id = l.course_id
JOIN public.lesson_songs ls ON ls.lesson_id = l.id
WHERE c.is_main_course = true
  AND l.block_number = 1
ORDER BY l.order_index, ls.order_index;

-- ============================================================
-- B. 無料枠クリア（block 1 のいずれかの課題完了）
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
b1 AS (
  SELECT l.id
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  WHERE c.is_main_course = true AND l.block_number = 1
),
per_user AS (
  SELECT
    np.id,
    np.signup_platform,
    bool_or(ulrp.is_completed) AS cleared_free_block
  FROM new_profiles np
  LEFT JOIN public.user_lesson_requirements_progress ulrp
    ON ulrp.user_id = np.id AND ulrp.is_completed = true
  LEFT JOIN public.lesson_songs ls ON ls.id = ulrp.lesson_song_id
  LEFT JOIN b1 l ON l.id = ls.lesson_id
  GROUP BY np.id, np.signup_platform
)
SELECT
  count(*) AS new_profiles,
  count(*) FILTER (WHERE NOT coalesce(cleared_free_block, false)) AS none_cleared,
  count(*) FILTER (WHERE cleared_free_block) AS free_block_cleared
FROM per_user;

-- ============================================================
-- C. 無料枠クリア × プラットフォーム
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
b1 AS (
  SELECT l.id
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  WHERE c.is_main_course = true AND l.block_number = 1
),
per_user AS (
  SELECT
    np.id,
    np.signup_platform,
    bool_or(ulrp.is_completed) AS cleared_free_block
  FROM new_profiles np
  LEFT JOIN public.user_lesson_requirements_progress ulrp
    ON ulrp.user_id = np.id AND ulrp.is_completed = true
  LEFT JOIN public.lesson_songs ls ON ls.id = ulrp.lesson_song_id
  LEFT JOIN b1 l ON l.id = ls.lesson_id
  GROUP BY np.id, np.signup_platform
)
SELECT
  coalesce(signup_platform, '(null)') AS platform,
  count(*) AS profiles,
  count(*) FILTER (WHERE NOT coalesce(cleared_free_block, false)) AS none_cleared,
  count(*) FILTER (WHERE cleared_free_block) AS free_block_cleared
FROM per_user
GROUP BY 1
ORDER BY 1;

-- ============================================================
-- D. 課題単位クリア（分母=新規プロフィール数）
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
b1_assignments AS (
  SELECT
    l.order_index AS quest_order,
    l.title AS quest_title,
    ls.order_index AS song_order,
    ls.id AS lesson_song_id,
    ls.title AS assignment_title
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  JOIN public.lesson_songs ls ON ls.lesson_id = l.id
  WHERE c.is_main_course = true AND l.block_number = 1
)
SELECT
  a.quest_order,
  a.quest_title,
  a.song_order,
  a.assignment_title,
  (SELECT count(*) FROM new_profiles) AS new_profiles,
  count(DISTINCT np.id) FILTER (WHERE ulrp.is_completed) AS cleared_users,
  count(DISTINCT s.user_id) AS started_users,
  count(DISTINCT s.user_id) FILTER (WHERE s.midi_connected) AS started_midi_on,
  round(
    100.0 * count(DISTINCT np.id) FILTER (WHERE ulrp.is_completed)
      / nullif((SELECT count(*) FROM new_profiles), 0),
    1
  ) AS clear_pct
FROM b1_assignments a
CROSS JOIN new_profiles np
LEFT JOIN public.user_lesson_requirements_progress ulrp
  ON ulrp.lesson_song_id = a.lesson_song_id
  AND ulrp.user_id = np.id
  AND ulrp.is_completed = true
LEFT JOIN public.user_assignment_starts s
  ON s.lesson_song_id = a.lesson_song_id
  AND s.user_id = np.id
  AND s.is_practice = false
GROUP BY a.quest_order, a.quest_title, a.song_order, a.assignment_title, a.lesson_song_id
ORDER BY a.quest_order, a.song_order;

-- ============================================================
-- E. 課題単位 × プラットフォーム
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
b1_assignments AS (
  SELECT
    l.order_index AS quest_order,
    ls.order_index AS song_order,
    ls.id AS lesson_song_id,
    ls.title AS assignment_title
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  JOIN public.lesson_songs ls ON ls.lesson_id = l.id
  WHERE c.is_main_course = true AND l.block_number = 1
)
SELECT
  a.assignment_title,
  coalesce(np.signup_platform, '(null)') AS platform,
  count(DISTINCT np.id) FILTER (WHERE ulrp.is_completed) AS cleared,
  count(DISTINCT np.id) FILTER (
    WHERE s.user_id IS NOT NULL AND NOT coalesce(ulrp.is_completed, false)
  ) AS started_not_cleared
FROM b1_assignments a
CROSS JOIN new_profiles np
LEFT JOIN public.user_lesson_requirements_progress ulrp
  ON ulrp.user_id = np.id
  AND ulrp.lesson_song_id = a.lesson_song_id
  AND ulrp.is_completed = true
LEFT JOIN public.user_assignment_starts s
  ON s.user_id = np.id
  AND s.lesson_song_id = a.lesson_song_id
  AND s.is_practice = false
GROUP BY a.assignment_title, a.quest_order, a.song_order, np.signup_platform
ORDER BY a.quest_order, a.song_order, platform;

-- ============================================================
-- F. 無料完走 → ペイウォール → 課金（無料ファネルの正本）
-- block 2+ クリアは有料会員向け。無料離脱指標に使わない。
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
b1 AS (
  SELECT ls.id AS lesson_song_id
  FROM public.lesson_songs ls
  JOIN public.lessons l ON l.id = ls.lesson_id
  JOIN public.courses c ON c.id = l.course_id
  WHERE c.is_main_course = true AND l.block_number = 1
),
per_user AS (
  SELECT
    np.id,
    np.signup_platform,
    EXISTS (
      SELECT 1
      FROM public.user_lesson_requirements_progress ulrp
      WHERE ulrp.user_id = np.id
        AND ulrp.lesson_song_id IN (SELECT lesson_song_id FROM b1)
        AND ulrp.is_completed = true
    ) AS cleared_free_block,
    m.free_tier_wall_view_at IS NOT NULL AS paywall,
    m.checkout_click_at IS NOT NULL AS checkout,
    m.trial_start_at IS NOT NULL AS trial,
    m.paid_at IS NOT NULL AS paid
  FROM new_profiles np
  LEFT JOIN public.user_milestones m ON m.user_id = np.id
)
SELECT
  count(*) AS new_profiles,
  count(*) FILTER (WHERE cleared_free_block) AS free_block_cleared,
  count(*) FILTER (WHERE paywall) AS paywall_viewed,
  count(*) FILTER (WHERE cleared_free_block AND paywall) AS free_cleared_and_paywall,
  count(*) FILTER (WHERE checkout) AS checkout_clicked,
  count(*) FILTER (WHERE trial) AS trial_started,
  count(*) FILTER (WHERE paid) AS paid_milestone,
  count(*) FILTER (WHERE cleared_free_block AND NOT paywall) AS free_cleared_no_paywall,
  count(*) FILTER (WHERE paywall AND NOT checkout) AS paywall_no_checkout
FROM per_user;

-- ============================================================
-- G. MIDI（新規登録者・本番課題開始）
-- ============================================================
WITH new_users AS (
  SELECT u.id FROM auth.users u WHERE u.created_at >= now() - interval '7 days'
)
SELECT
  coalesce(s.platform, '(null)') AS platform,
  count(*) AS rows,
  count(DISTINCT s.user_id) AS users,
  count(*) FILTER (WHERE s.midi_connected) AS midi_on_rows,
  count(DISTINCT s.user_id) FILTER (WHERE s.midi_connected) AS users_midi_on
FROM public.user_assignment_starts s
JOIN new_users nu ON nu.id = s.user_id
WHERE s.is_practice = false
GROUP BY 1
ORDER BY users DESC;

WITH new_users AS (
  SELECT u.id FROM auth.users u WHERE u.created_at >= now() - interval '7 days'
),
user_midi AS (
  SELECT
    nu.id,
    bool_or(coalesce(s.midi_connected, false)) AS ever_midi,
    count(s.user_id) > 0 AS has_start
  FROM new_users nu
  LEFT JOIN public.user_assignment_starts s
    ON s.user_id = nu.id AND s.is_practice = false
  GROUP BY nu.id
)
SELECT
  count(*) AS new_users,
  count(*) FILTER (WHERE has_start) AS started_assignment,
  count(*) FILTER (WHERE ever_midi) AS ever_midi_connected,
  count(*) FILTER (WHERE has_start AND NOT ever_midi) AS started_without_midi,
  count(*) FILTER (WHERE NOT has_start) AS no_assignment_start
FROM user_midi;
