-- 週次: メインクエスト第1章（クエスト + 課題クリア）
-- 対象: 直近7日の新規プロフィール（auth.users JOIN profiles）
-- 1ブロックずつ実行すること。

-- ============================================================
-- A. 第1章課題マスタ確認
-- ============================================================
SELECT
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
-- B. クエスト単位（いずれか1課題クリア）
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
ch1 AS (
  SELECT l.id, l.order_index
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  WHERE c.is_main_course = true AND l.block_number = 1
),
per_user AS (
  SELECT
    np.id,
    np.signup_platform,
    bool_or(l.order_index = 0 AND ulrp.is_completed) AS q1,
    bool_or(l.order_index = 1 AND ulrp.is_completed) AS q2,
    bool_or(l.order_index = 2 AND ulrp.is_completed) AS q3
  FROM new_profiles np
  LEFT JOIN public.user_lesson_requirements_progress ulrp
    ON ulrp.user_id = np.id AND ulrp.is_completed = true
  LEFT JOIN public.lesson_songs ls ON ls.id = ulrp.lesson_song_id
  LEFT JOIN ch1 l ON l.id = ls.lesson_id
  GROUP BY np.id, np.signup_platform
)
SELECT
  count(*) AS new_profiles,
  count(*) FILTER (WHERE NOT coalesce(q1, false)) AS none_cleared,
  count(*) FILTER (WHERE q1) AS q1_cleared,
  count(*) FILTER (WHERE q2) AS q2_cleared,
  count(*) FILTER (WHERE q3) AS q3_cleared,
  count(*) FILTER (WHERE q1 AND NOT coalesce(q2, false)) AS q1_only,
  count(*) FILTER (WHERE q2 AND NOT coalesce(q3, false)) AS q2_not_q3
FROM per_user;

-- ============================================================
-- C. クエスト単位 × プラットフォーム
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
ch1 AS (
  SELECT l.id, l.order_index
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  WHERE c.is_main_course = true AND l.block_number = 1
),
per_user AS (
  SELECT
    np.id,
    np.signup_platform,
    bool_or(l.order_index = 0 AND ulrp.is_completed) AS q1,
    bool_or(l.order_index = 1 AND ulrp.is_completed) AS q2,
    bool_or(l.order_index = 2 AND ulrp.is_completed) AS q3
  FROM new_profiles np
  LEFT JOIN public.user_lesson_requirements_progress ulrp
    ON ulrp.user_id = np.id AND ulrp.is_completed = true
  LEFT JOIN public.lesson_songs ls ON ls.id = ulrp.lesson_song_id
  LEFT JOIN ch1 l ON l.id = ls.lesson_id
  GROUP BY np.id, np.signup_platform
)
SELECT
  coalesce(signup_platform, '(null)') AS platform,
  count(*) AS profiles,
  count(*) FILTER (WHERE NOT coalesce(q1, false)) AS none_q1,
  count(*) FILTER (WHERE q1) AS q1,
  count(*) FILTER (WHERE q2) AS q2,
  count(*) FILTER (WHERE q3) AS q3
FROM per_user
GROUP BY 1
ORDER BY 1;

-- ============================================================
-- D. 課題単位クリア（プロフィール35相当 / 分母=新規プロフィール数）
-- ============================================================
WITH new_profiles AS (
  SELECT p.id, p.signup_platform
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
ch1_assignments AS (
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
FROM ch1_assignments a
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
ch1_assignments AS (
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
FROM ch1_assignments a
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
-- F. 連続課題クリアの脱落（タイトル固定。マスタ変更時は更新）
-- ============================================================
WITH new_profiles AS (
  SELECT p.id
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE u.created_at >= now() - interval '7 days'
),
assignments AS (
  SELECT ls.id, ls.title AS assignment_title
  FROM public.lessons l
  JOIN public.courses c ON c.id = l.course_id
  JOIN public.lesson_songs ls ON ls.lesson_id = l.id
  WHERE c.is_main_course = true AND l.block_number = 1
),
per_user AS (
  SELECT
    np.id,
    a.assignment_title,
    EXISTS (
      SELECT 1
      FROM public.user_lesson_requirements_progress ulrp
      WHERE ulrp.user_id = np.id
        AND ulrp.lesson_song_id = a.id
        AND ulrp.is_completed = true
    ) AS cleared
  FROM new_profiles np
  CROSS JOIN assignments a
),
pivoted AS (
  SELECT
    id,
    bool_or(cleared) FILTER (WHERE assignment_title = '1-1. ドとソをまねしよう') AS c_11,
    bool_or(cleared) FILTER (WHERE assignment_title = '2-1. 2音でもコードの響きになる') AS c_21,
    bool_or(cleared) FILTER (WHERE assignment_title = '3-2. Cブルースを通して見る') AS c_32,
    bool_or(cleared) FILTER (WHERE assignment_title = '3-3. リズムに合わせて1拍目だけ弾く') AS c_33
  FROM per_user
  GROUP BY id
)
SELECT
  count(*) AS profiles,
  count(*) FILTER (WHERE c_11) AS cleared_11,
  count(*) FILTER (WHERE c_11 AND NOT coalesce(c_21, false)) AS drop_11_to_21,
  count(*) FILTER (WHERE c_21) AS cleared_21,
  count(*) FILTER (WHERE c_21 AND NOT coalesce(c_32, false)) AS drop_21_to_32,
  count(*) FILTER (WHERE c_32) AS cleared_32,
  count(*) FILTER (WHERE c_32 AND NOT coalesce(c_33, false)) AS drop_32_to_33,
  count(*) FILTER (WHERE c_33) AS cleared_33
FROM pivoted;

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
