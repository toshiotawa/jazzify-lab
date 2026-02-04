-- サバイバルモードのポリシー修正
-- 既存のポリシーを削除してから再作成

-- survival_high_scores テーブルのポリシーを修正
DROP POLICY IF EXISTS "survival_high_scores_select" ON survival_high_scores;
DROP POLICY IF EXISTS "survival_high_scores_insert" ON survival_high_scores;
DROP POLICY IF EXISTS "survival_high_scores_update" ON survival_high_scores;

-- 誰でも閲覧可能
CREATE POLICY "survival_high_scores_select" ON survival_high_scores
    FOR SELECT
    USING (true);

-- 自分のスコアのみ更新/挿入可能
CREATE POLICY "survival_high_scores_insert" ON survival_high_scores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "survival_high_scores_update" ON survival_high_scores
    FOR UPDATE
    USING (auth.uid() = user_id);

-- survival_difficulty_settings テーブルのポリシーを修正
DROP POLICY IF EXISTS "survival_difficulty_settings_select" ON survival_difficulty_settings;
DROP POLICY IF EXISTS "survival_difficulty_settings_update" ON survival_difficulty_settings;

-- 誰でも閲覧可能
CREATE POLICY "survival_difficulty_settings_select" ON survival_difficulty_settings
    FOR SELECT
    USING (true);

-- 管理者のみ更新可能
CREATE POLICY "survival_difficulty_settings_update" ON survival_difficulty_settings
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
        )
    );

-- view_level_ranking を再作成（サバイバル情報を含む）
DROP VIEW IF EXISTS view_level_ranking CASCADE;

CREATE OR REPLACE VIEW view_level_ranking AS
SELECT 
    p.id,
    p.nickname,
    p.avatar_url,
    p.level,
    p.xp,
    p.rank,
    p.twitter_handle,
    p.selected_title,
    COALESCE(lc.lessons_cleared, 0) AS lessons_cleared,
    COALESCE(mc.missions_completed, 0) AS missions_completed,
    COALESCE(fc.fantasy_cleared_stages, 0) AS fantasy_cleared_stages,
    COALESCE(sc.best_survival_time, 0) AS best_survival_time,
    sc.best_difficulty AS survival_best_difficulty
FROM profiles p
LEFT JOIN (
    SELECT user_id, COUNT(*) AS lessons_cleared
    FROM user_lesson_progress
    WHERE completed = true
    GROUP BY user_id
) lc ON p.id = lc.user_id
LEFT JOIN (
    SELECT user_id, SUM(clear_count) AS missions_completed
    FROM user_challenge_progress
    WHERE completed = true
    GROUP BY user_id
) mc ON p.id = mc.user_id
LEFT JOIN (
    SELECT user_id, COUNT(DISTINCT stage_id) AS fantasy_cleared_stages
    FROM fantasy_stage_clears
    WHERE clear_type = 'clear'
    GROUP BY user_id
) fc ON p.id = fc.user_id
LEFT JOIN (
    SELECT 
        user_id,
        MAX(survival_time_seconds) AS best_survival_time,
        (
            SELECT difficulty 
            FROM survival_high_scores s2 
            WHERE s2.user_id = s1.user_id 
            ORDER BY survival_time_seconds DESC 
            LIMIT 1
        ) AS best_difficulty
    FROM survival_high_scores s1
    GROUP BY user_id
) sc ON p.id = sc.user_id
WHERE p.nickname IS NOT NULL
  AND p.nickname != '退会ユーザー'
  AND p.email NOT LIKE '%@deleted.local'
ORDER BY p.level DESC, p.xp DESC;

-- rpc_get_level_ranking を再作成
DROP FUNCTION IF EXISTS rpc_get_level_ranking(int, int);

CREATE OR REPLACE FUNCTION rpc_get_level_ranking(limit_count int DEFAULT 50, offset_count int DEFAULT 0)
RETURNS TABLE (
    id uuid,
    nickname text,
    avatar_url text,
    level int,
    xp bigint,
    rank text,
    twitter_handle text,
    selected_title text,
    lessons_cleared bigint,
    missions_completed bigint,
    fantasy_cleared_stages bigint,
    best_survival_time numeric,
    survival_best_difficulty text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        v.id,
        v.nickname,
        v.avatar_url,
        v.level,
        v.xp,
        v.rank,
        v.twitter_handle,
        v.selected_title,
        v.lessons_cleared,
        v.missions_completed,
        v.fantasy_cleared_stages,
        v.best_survival_time,
        v.survival_best_difficulty
    FROM view_level_ranking v
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql STABLE;

-- 権限付与
GRANT EXECUTE ON FUNCTION rpc_get_level_ranking(int, int) TO anon, authenticated;
