-- サバイバルモード関連テーブルの作成
-- ハイスコア保存と難易度別コード設定

-- サバイバルハイスコアテーブル
CREATE TABLE IF NOT EXISTS survival_high_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    difficulty text NOT NULL CHECK (difficulty IN ('easy', 'normal', 'hard', 'extreme')),
    survival_time_seconds numeric NOT NULL DEFAULT 0,
    final_level integer NOT NULL DEFAULT 1,
    enemies_defeated integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, difficulty)
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_survival_high_scores_user_id ON survival_high_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_survival_high_scores_difficulty ON survival_high_scores(difficulty);
CREATE INDEX IF NOT EXISTS idx_survival_high_scores_time ON survival_high_scores(survival_time_seconds DESC);

-- RLSポリシー
ALTER TABLE survival_high_scores ENABLE ROW LEVEL SECURITY;

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

-- サバイバルモード難易度別設定テーブル（管理者用）
CREATE TABLE IF NOT EXISTS survival_difficulty_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    difficulty text NOT NULL UNIQUE CHECK (difficulty IN ('easy', 'normal', 'hard', 'extreme')),
    display_name text NOT NULL,
    description text,
    allowed_chords jsonb NOT NULL DEFAULT '[]'::jsonb,
    enemy_spawn_rate numeric NOT NULL DEFAULT 3,
    enemy_spawn_count integer NOT NULL DEFAULT 2,
    enemy_stat_multiplier numeric NOT NULL DEFAULT 1.0,
    exp_multiplier numeric NOT NULL DEFAULT 1.0,
    item_drop_rate numeric NOT NULL DEFAULT 0.1,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- デフォルトの難易度設定を挿入
INSERT INTO survival_difficulty_settings (difficulty, display_name, description, allowed_chords, enemy_spawn_rate, enemy_spawn_count, enemy_stat_multiplier, exp_multiplier, item_drop_rate)
VALUES 
    ('easy', 'Easy', '初心者向け。基本的なメジャー・マイナーコードのみ。', '["C", "G", "Am", "F", "Dm", "Em"]'::jsonb, 3, 2, 0.7, 1.0, 0.15),
    ('normal', 'Normal', '標準的な難易度。セブンスコードが追加。', '["C", "G", "Am", "F", "Dm", "Em", "G7", "C7", "Am7", "Dm7"]'::jsonb, 2.5, 3, 1.0, 1.5, 0.12),
    ('hard', 'Hard', '上級者向け。複雑なコードと高速な敵。', '["CM7", "G7", "Am7", "Dm7", "Em7", "FM7", "Bm7b5", "E7", "A7", "D7"]'::jsonb, 2, 4, 1.3, 2.0, 0.10),
    ('extreme', 'Extreme', 'エキスパート向け。全コードタイプ、超高速。', '["CM7", "Dm7", "Em7", "FM7", "G7", "Am7", "Bm7b5", "Cmaj9", "Dm9", "G13"]'::jsonb, 1.5, 5, 1.6, 3.0, 0.08)
ON CONFLICT (difficulty) DO NOTHING;

-- RLSポリシー（難易度設定）
ALTER TABLE survival_difficulty_settings ENABLE ROW LEVEL SECURITY;

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

-- ランキング用のビューを作成（最高生存時間）
CREATE OR REPLACE VIEW view_survival_ranking AS
SELECT 
    p.id,
    p.nickname,
    p.avatar_url,
    p.level,
    p.xp,
    p.rank,
    p.twitter_handle,
    p.selected_title,
    COALESCE(s.best_survival_time, 0) as best_survival_time,
    s.best_difficulty
FROM profiles p
LEFT JOIN (
    SELECT 
        user_id,
        MAX(survival_time_seconds) as best_survival_time,
        (
            SELECT difficulty 
            FROM survival_high_scores s2 
            WHERE s2.user_id = s1.user_id 
            ORDER BY survival_time_seconds DESC 
            LIMIT 1
        ) as best_difficulty
    FROM survival_high_scores s1
    GROUP BY user_id
) s ON p.id = s.user_id
WHERE p.nickname IS NOT NULL
  AND p.nickname != '退会ユーザー'
  AND p.email NOT LIKE '%@deleted.local'
ORDER BY best_survival_time DESC NULLS LAST;

-- ユーザーの最高生存時間を取得するRPC
CREATE OR REPLACE FUNCTION rpc_get_user_best_survival_time(target_user_id uuid)
RETURNS TABLE (
    best_survival_time numeric,
    best_difficulty text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        survival_time_seconds as best_survival_time,
        difficulty as best_difficulty
    FROM survival_high_scores
    WHERE user_id = target_user_id
    ORDER BY survival_time_seconds DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql STABLE;

-- view_level_ranking を更新してサバイバル情報を追加
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

-- rpc_get_level_ranking を更新
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
