-- ランキング用ビューの SECURITY DEFINER 警告を解消しつつ挙動を維持する
-- 既存のRLSを尊重し、集計だけを SECURITY DEFINER 関数で提供する

CREATE OR REPLACE FUNCTION public.fn_view_level_ranking()
RETURNS TABLE (
    id uuid,
    nickname text,
    avatar_url text,
    level int,
    xp bigint,
    rank public.membership_rank,
    twitter_handle text,
    selected_title text,
    lessons_cleared bigint,
    missions_completed bigint,
    fantasy_cleared_stages bigint,
    best_survival_time numeric,
    survival_best_difficulty text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
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
    FROM public.profiles p
    LEFT JOIN (
        SELECT user_id, COUNT(*) AS lessons_cleared
        FROM public.user_lesson_progress
        WHERE completed = true
        GROUP BY user_id
    ) lc ON p.id = lc.user_id
    LEFT JOIN (
        SELECT user_id, SUM(clear_count) AS missions_completed
        FROM public.user_challenge_progress
        WHERE completed = true
        GROUP BY user_id
    ) mc ON p.id = mc.user_id
    LEFT JOIN (
        SELECT user_id, COUNT(DISTINCT stage_id) AS fantasy_cleared_stages
        FROM public.fantasy_stage_clears
        WHERE clear_type = 'clear'
        GROUP BY user_id
    ) fc ON p.id = fc.user_id
    LEFT JOIN (
        SELECT 
            user_id,
            MAX(survival_time_seconds) AS best_survival_time,
            (
                SELECT difficulty 
                FROM public.survival_high_scores s2 
                WHERE s2.user_id = s1.user_id 
                ORDER BY survival_time_seconds DESC 
                LIMIT 1
            ) AS best_difficulty
        FROM public.survival_high_scores s1
        GROUP BY user_id
    ) sc ON p.id = sc.user_id
    WHERE p.nickname IS NOT NULL
      AND p.nickname != '退会ユーザー'
      AND p.email NOT LIKE '%@deleted.local'
    ORDER BY p.level DESC, p.xp DESC;
$$;

GRANT EXECUTE ON FUNCTION public.fn_view_level_ranking() TO anon, authenticated;

CREATE OR REPLACE VIEW public.view_level_ranking AS
SELECT * FROM public.fn_view_level_ranking();

ALTER VIEW public.view_level_ranking SET (security_invoker = on);

DO $$ BEGIN
    IF EXISTS (
        SELECT 1
        FROM pg_views v
        WHERE v.schemaname = 'public'
          AND v.viewname = 'view_survival_ranking'
    ) THEN
        EXECUTE 'ALTER VIEW public.view_survival_ranking SET (security_invoker = on)';
    END IF;
END $$;
