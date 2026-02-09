-- Fix: membership_rank 型と text 型の不一致を修正
-- profiles.rank カラムは membership_rank enum 型だが、
-- RPC関数の RETURNS TABLE 定義では text 型として宣言されている。
-- PostgreSQL はenum型からtext型への暗黙キャストを行わないため、
-- 明示的に ::text キャストを追加する。
--
-- エラー: "Returned type membership_rank does not match expected type text in column 6."

-- =====================================================
-- 1. rpc_get_level_ranking を修正（rank を ::text キャスト）
-- =====================================================

DROP FUNCTION IF EXISTS public.rpc_get_level_ranking(int, int);

CREATE OR REPLACE FUNCTION public.rpc_get_level_ranking(limit_count int DEFAULT 50, offset_count int DEFAULT 0)
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
        v.rank::text,
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

-- =====================================================
-- 2. rpc_get_mission_ranking を修正（rank を ::text キャスト）
-- =====================================================

DROP FUNCTION IF EXISTS public.rpc_get_mission_ranking(uuid, integer, integer);

CREATE FUNCTION public.rpc_get_mission_ranking(
  mission_id uuid,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  user_id uuid,
  clear_count integer,
  nickname text,
  avatar_url text,
  level integer,
  rank text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    ucp.user_id,
    ucp.clear_count,
    p.nickname,
    p.avatar_url,
    p.level,
    p.rank::text
  FROM public.user_challenge_progress ucp
  JOIN public.profiles p ON p.id = ucp.user_id
  WHERE ucp.challenge_id = mission_id
    AND ucp.completed = true
    AND p.nickname <> '退会ユーザー'
    AND p.email NOT LIKE '%@deleted.local'
  ORDER BY ucp.clear_count DESC, p.level DESC, p.xp DESC, ucp.user_id ASC
  OFFSET offset_count
  LIMIT limit_count;
$$;

-- =====================================================
-- 3. rpc_get_lesson_ranking を修正（rank を ::text キャスト）
-- =====================================================

DROP FUNCTION IF EXISTS public.rpc_get_lesson_ranking(integer, integer);

CREATE FUNCTION public.rpc_get_lesson_ranking(
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  nickname text,
  level integer,
  xp bigint,
  rank text,
  avatar_url text,
  twitter_handle text,
  selected_title text,
  fantasy_current_stage text,
  lessons_cleared integer,
  missions_completed integer,
  fantasy_cleared_stages integer
)
LANGUAGE sql
STABLE
AS $$
  WITH l AS (
    SELECT ulp.user_id, COUNT(*) AS lessons_cleared
    FROM public.user_lesson_progress ulp
    WHERE ulp.completed = true
    GROUP BY ulp.user_id
  ),
  m AS (
    SELECT ucp.user_id, COALESCE(SUM(ucp.clear_count), 0) AS missions_completed
    FROM public.user_challenge_progress ucp
    WHERE ucp.completed = true
    GROUP BY ucp.user_id
  ),
  f AS (
    SELECT fup.user_id, fup.current_stage_number
    FROM public.fantasy_user_progress fup
  ),
  fs AS (
    SELECT fsc.user_id, COUNT(*) AS cleared_count
    FROM public.fantasy_stage_clears fsc
    WHERE fsc.clear_type = 'clear'
    GROUP BY fsc.user_id
  ),
  base AS (
    SELECT
      p.id,
      p.nickname,
      p.level,
      p.xp,
      p.rank::text AS rank,
      p.avatar_url,
      p.twitter_handle,
      p.selected_title,
      f.current_stage_number AS fantasy_current_stage,
      COALESCE(l.lessons_cleared, 0) AS lessons_cleared,
      COALESCE(m.missions_completed, 0) AS missions_completed,
      COALESCE(fs.cleared_count, 0) AS fantasy_cleared_stages
    FROM public.profiles p
    LEFT JOIN l ON l.user_id = p.id
    LEFT JOIN m ON m.user_id = p.id
    LEFT JOIN f ON f.user_id = p.id
    LEFT JOIN fs ON fs.user_id = p.id
    WHERE p.nickname IS NOT NULL
      AND p.nickname <> p.email
      AND p.nickname <> '退会ユーザー'
      AND p.email NOT LIKE '%@deleted.local'
  ), ranked AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY lessons_cleared DESC, level DESC, xp DESC, id ASC) AS rn
    FROM base
  )
  SELECT
    id,
    nickname,
    level,
    xp,
    rank,
    avatar_url,
    twitter_handle,
    selected_title,
    fantasy_current_stage,
    lessons_cleared,
    missions_completed,
    fantasy_cleared_stages
  FROM ranked
  ORDER BY rn
  OFFSET offset_count
  LIMIT limit_count;
$$;

-- =====================================================
-- 4. 権限付与
-- =====================================================

GRANT EXECUTE ON FUNCTION public.rpc_get_level_ranking(int, int) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_mission_ranking(uuid, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_lesson_ranking(integer, integer) TO anon, authenticated;
