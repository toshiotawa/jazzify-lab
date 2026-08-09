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

-- ============================================================
-- H. MIDI デバイス接続状況（新規登録者・本番課題開始ログあり）
-- midi_device_count / midi_api_available は初回開始スナップショット。
-- 開始ログなしは「不明」。iOS はカバレッジ不足あり。
-- ============================================================
WITH new_users AS (
  SELECT u.id FROM auth.users u WHERE u.created_at >= now() - interval '7 days'
),
starts AS (
  SELECT
    s.user_id,
    s.platform,
    s.midi_connected,
    s.midi_api_available,
    s.midi_device_count,
    s.input_method
  FROM public.user_assignment_starts s
  JOIN new_users nu ON nu.id = s.user_id
  WHERE s.is_practice = false
),
per_user AS (
  SELECT
    user_id,
    bool_or(coalesce(midi_connected, false)) AS ever_midi,
    bool_or(coalesce(midi_api_available, false)) AS ever_api,
    max(midi_device_count) AS max_device_count,
    bool_or(input_method = 'midi') AS used_midi_input,
    bool_or(input_method = 'voice') AS used_voice_input
  FROM starts
  GROUP BY user_id
)
SELECT
  count(*) AS users_with_start,
  count(*) FILTER (WHERE ever_midi) AS ever_midi_connected,
  count(*) FILTER (WHERE ever_api) AS midi_api_available,
  count(*) FILTER (WHERE coalesce(max_device_count, 0) >= 1) AS device_count_ge_1,
  count(*) FILTER (WHERE coalesce(max_device_count, 0) = 0) AS device_count_0,
  count(*) FILTER (WHERE max_device_count IS NULL) AS device_count_unknown,
  count(*) FILTER (WHERE used_midi_input) AS input_method_midi,
  count(*) FILTER (WHERE used_voice_input) AS input_method_voice,
  round(100.0 * count(*) FILTER (WHERE ever_midi) / nullif(count(*), 0), 1) AS midi_connected_pct
FROM per_user;

WITH new_users AS (
  SELECT u.id FROM auth.users u WHERE u.created_at >= now() - interval '7 days'
),
starts AS (
  SELECT
    s.user_id,
    coalesce(s.platform, '(null)') AS platform,
    s.midi_connected,
    s.midi_api_available,
    s.midi_device_count,
    s.input_method
  FROM public.user_assignment_starts s
  JOIN new_users nu ON nu.id = s.user_id
  WHERE s.is_practice = false
),
per_user AS (
  SELECT
    user_id,
    platform,
    bool_or(coalesce(midi_connected, false)) AS ever_midi,
    bool_or(coalesce(midi_api_available, false)) AS ever_api,
    max(midi_device_count) AS max_device_count,
    bool_or(input_method = 'midi') AS used_midi_input,
    bool_or(input_method = 'voice') AS used_voice_input
  FROM starts
  GROUP BY user_id, platform
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

-- ============================================================
-- I. paywall 出所別（新規登録者・到達者）
-- free_tier_wall_view_source 初回のみ。subscription_sheet は iOS デフォルト入口。
-- ============================================================
WITH new_users AS (
  SELECT u.id FROM auth.users u WHERE u.created_at >= now() - interval '7 days'
),
paid_users AS (
  SELECT DISTINCT s.user_id
  FROM public.subscriptions s
  WHERE s.entitlement_state IN (
    'active',
    'payment_issue_with_access',
    'cancelled_but_active_until_end'
  )
  UNION
  SELECT m.user_id
  FROM public.user_milestones m
  WHERE m.trial_start_at IS NOT NULL OR m.paid_at IS NOT NULL
)
SELECT
  coalesce(m.free_tier_wall_view_source, '(unknown)') AS paywall_source,
  coalesce(p.signup_platform, '(null)') AS platform,
  count(*) AS paywall_users,
  count(*) FILTER (WHERE m.checkout_click_at IS NOT NULL) AS checkout_clicked,
  count(*) FILTER (
    WHERE m.trial_start_at IS NOT NULL OR m.paid_at IS NOT NULL
      OR pu.user_id IS NOT NULL
  ) AS converted,
  count(*) FILTER (
    WHERE m.checkout_click_at IS NULL
      AND m.trial_start_at IS NULL
      AND m.paid_at IS NULL
      AND pu.user_id IS NULL
  ) AS no_checkout_no_purchase,
  count(*) FILTER (
    WHERE m.checkout_click_at IS NOT NULL
      AND m.trial_start_at IS NULL
      AND m.paid_at IS NULL
      AND pu.user_id IS NULL
  ) AS checkout_no_purchase
FROM new_users nu
JOIN public.user_milestones m ON m.user_id = nu.id
JOIN public.profiles p ON p.id = nu.id
LEFT JOIN paid_users pu ON pu.user_id = nu.id
WHERE m.free_tier_wall_view_at IS NOT NULL
GROUP BY 1, 2
ORDER BY paywall_users DESC;

-- ============================================================
-- J. paywall / checkout 到達・未購入のその後（新規登録者）
-- 「その後遊んだ」= 到達時刻より後の lesson_progress / assignment_starts / fantasy_clears
-- ============================================================
WITH new_users AS (
  SELECT u.id FROM auth.users u WHERE u.created_at >= now() - interval '7 days'
),
paid_users AS (
  SELECT DISTINCT s.user_id
  FROM public.subscriptions s
  WHERE s.entitlement_state IN (
    'active',
    'payment_issue_with_access',
    'cancelled_but_active_until_end'
  )
  UNION
  SELECT m.user_id
  FROM public.user_milestones m
  WHERE m.trial_start_at IS NOT NULL OR m.paid_at IS NOT NULL
),
cohort AS (
  SELECT
    m.user_id,
    m.free_tier_wall_view_at AS paywall_at,
    m.checkout_click_at,
    coalesce(m.free_tier_wall_view_source, '(unknown)') AS paywall_source
  FROM public.user_milestones m
  JOIN new_users nu ON nu.id = m.user_id
  WHERE m.free_tier_wall_view_at IS NOT NULL
    AND m.user_id NOT IN (SELECT user_id FROM paid_users)
),
activity_after AS (
  SELECT
    c.user_id,
    GREATEST(
      coalesce(
        (SELECT max(ulp.updated_at)
         FROM public.user_lesson_progress ulp
         WHERE ulp.user_id = c.user_id AND ulp.updated_at > c.paywall_at),
        '-infinity'::timestamptz
      ),
      coalesce(
        (SELECT max(uas.first_started_at)
         FROM public.user_assignment_starts uas
         WHERE uas.user_id = c.user_id AND uas.first_started_at > c.paywall_at),
        '-infinity'::timestamptz
      ),
      coalesce(
        (SELECT max(fsc.cleared_at)
         FROM public.fantasy_stage_clears fsc
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

WITH new_users AS (
  SELECT u.id FROM auth.users u WHERE u.created_at >= now() - interval '7 days'
),
paid_users AS (
  SELECT DISTINCT s.user_id
  FROM public.subscriptions s
  WHERE s.entitlement_state IN (
    'active',
    'payment_issue_with_access',
    'cancelled_but_active_until_end'
  )
  UNION
  SELECT m.user_id
  FROM public.user_milestones m
  WHERE m.trial_start_at IS NOT NULL OR m.paid_at IS NOT NULL
),
cohort AS (
  SELECT
    m.user_id,
    m.free_tier_wall_view_at AS paywall_at,
    coalesce(m.free_tier_wall_view_source, '(unknown)') AS paywall_source
  FROM public.user_milestones m
  JOIN new_users nu ON nu.id = m.user_id
  WHERE m.free_tier_wall_view_at IS NOT NULL
    AND m.user_id NOT IN (SELECT user_id FROM paid_users)
),
activity_after AS (
  SELECT
    c.user_id,
    GREATEST(
      coalesce(
        (SELECT max(ulp.updated_at)
         FROM public.user_lesson_progress ulp
         WHERE ulp.user_id = c.user_id AND ulp.updated_at > c.paywall_at),
        '-infinity'::timestamptz
      ),
      coalesce(
        (SELECT max(uas.first_started_at)
         FROM public.user_assignment_starts uas
         WHERE uas.user_id = c.user_id AND uas.first_started_at > c.paywall_at),
        '-infinity'::timestamptz
      ),
      coalesce(
        (SELECT max(fsc.cleared_at)
         FROM public.fantasy_stage_clears fsc
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
