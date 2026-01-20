-- Exclude deleted users from ranking views and RPCs
-- 退会ユーザーをランキングから除外する

-- =====================================================
-- 1. Recreate view_level_ranking to exclude deleted users
-- =====================================================

DROP VIEW IF EXISTS public.view_level_ranking CASCADE;

CREATE VIEW public.view_level_ranking AS
SELECT
  p.id,
  p.nickname,
  p.level,
  p.xp,
  p.rank,
  p.avatar_url,
  p.twitter_handle,
  p.selected_title,
  f.current_stage_number AS fantasy_current_stage,
  COALESCE(l.lessons_cleared, 0) AS lessons_cleared,
  COALESCE(m.missions_completed, 0) AS missions_completed,
  COALESCE(fs.cleared_count, 0) AS fantasy_cleared_stages,
  ROW_NUMBER() OVER (ORDER BY p.level DESC, p.xp DESC, p.id ASC) AS global_rank
FROM public.profiles AS p
LEFT JOIN (
  SELECT ulp.user_id, COUNT(*) AS lessons_cleared
  FROM public.user_lesson_progress ulp
  WHERE ulp.completed = true
  GROUP BY ulp.user_id
) AS l ON l.user_id = p.id
LEFT JOIN (
  SELECT ucp.user_id, COALESCE(SUM(ucp.clear_count), 0) AS missions_completed
  FROM public.user_challenge_progress ucp
  WHERE ucp.completed = true
  GROUP BY ucp.user_id
) AS m ON m.user_id = p.id
LEFT JOIN (
  SELECT fup.user_id, fup.current_stage_number
  FROM public.fantasy_user_progress fup
) AS f ON f.user_id = p.id
LEFT JOIN (
  SELECT fsc.user_id, COUNT(*) AS cleared_count
  FROM public.fantasy_stage_clears fsc
  WHERE fsc.clear_type = 'clear'
  GROUP BY fsc.user_id
) AS fs ON fs.user_id = p.id
WHERE p.nickname IS NOT NULL
  AND p.nickname <> p.email
  AND p.nickname <> '退会ユーザー'  -- Exclude deleted users
  AND p.email NOT LIKE '%@deleted.local';  -- Exclude anonymized users

-- =====================================================
-- 2. Recreate RPC functions for level ranking
-- =====================================================

DROP FUNCTION IF EXISTS public.rpc_get_level_ranking(limit_count integer, offset_count integer);
DROP FUNCTION IF EXISTS public.rpc_get_user_global_rank(target_user_id uuid);

CREATE FUNCTION public.rpc_get_level_ranking(limit_count integer DEFAULT 50, offset_count integer DEFAULT 0)
RETURNS SETOF public.view_level_ranking
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.view_level_ranking
  ORDER BY global_rank
  OFFSET offset_count
  LIMIT limit_count;
$$;

CREATE FUNCTION public.rpc_get_user_global_rank(target_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  SELECT v.global_rank
  FROM public.view_level_ranking v
  WHERE v.id = target_user_id
  LIMIT 1;
$$;

-- =====================================================
-- 3. Recreate mission ranking RPCs to exclude deleted users
-- =====================================================

DROP FUNCTION IF EXISTS public.rpc_get_mission_ranking(mission_id uuid, limit_count integer, offset_count integer);
DROP FUNCTION IF EXISTS public.rpc_get_user_mission_rank(mission_id uuid, target_user_id uuid);

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
    p.rank
  FROM public.user_challenge_progress ucp
  JOIN public.profiles p ON p.id = ucp.user_id
  WHERE ucp.challenge_id = mission_id
    AND ucp.completed = true
    AND p.nickname <> '退会ユーザー'  -- Exclude deleted users
    AND p.email NOT LIKE '%@deleted.local'  -- Exclude anonymized users
  ORDER BY ucp.clear_count DESC, p.level DESC, p.xp DESC, ucp.user_id ASC
  OFFSET offset_count
  LIMIT limit_count;
$$;

CREATE FUNCTION public.rpc_get_user_mission_rank(
  mission_id uuid,
  target_user_id uuid
)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  WITH ranked AS (
    SELECT
      ucp.user_id,
      ROW_NUMBER() OVER (ORDER BY ucp.clear_count DESC, p.level DESC, p.xp DESC, ucp.user_id ASC) AS rn
    FROM public.user_challenge_progress ucp
    JOIN public.profiles p ON p.id = ucp.user_id
    WHERE ucp.challenge_id = mission_id
      AND ucp.completed = true
      AND p.nickname <> '退会ユーザー'  -- Exclude deleted users
      AND p.email NOT LIKE '%@deleted.local'  -- Exclude anonymized users
  )
  SELECT rn FROM ranked WHERE user_id = target_user_id LIMIT 1;
$$;

-- =====================================================
-- 4. Recreate lesson ranking RPCs to exclude deleted users
-- =====================================================

DROP FUNCTION IF EXISTS public.rpc_get_lesson_ranking(limit_count integer, offset_count integer);
DROP FUNCTION IF EXISTS public.rpc_get_user_lesson_rank(target_user_id uuid);

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
      p.rank,
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
      AND p.nickname <> '退会ユーザー'  -- Exclude deleted users
      AND p.email NOT LIKE '%@deleted.local'  -- Exclude anonymized users
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

CREATE FUNCTION public.rpc_get_user_lesson_rank(
  target_user_id uuid
)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  WITH l AS (
    SELECT ulp.user_id, COUNT(*) AS lessons_cleared
    FROM public.user_lesson_progress ulp
    WHERE ulp.completed = true
    GROUP BY ulp.user_id
  ),
  base AS (
    SELECT p.id, p.level, p.xp, COALESCE(l.lessons_cleared, 0) AS lessons_cleared
    FROM public.profiles p
    LEFT JOIN l ON l.user_id = p.id
    WHERE p.nickname IS NOT NULL
      AND p.nickname <> p.email
      AND p.nickname <> '退会ユーザー'  -- Exclude deleted users
      AND p.email NOT LIKE '%@deleted.local'  -- Exclude anonymized users
  ), ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY lessons_cleared DESC, level DESC, xp DESC, id ASC) AS rn
    FROM base
  )
  SELECT rn FROM ranked WHERE id = target_user_id LIMIT 1;
$$;

-- =====================================================
-- 5. Grant permissions
-- =====================================================

GRANT SELECT ON public.view_level_ranking TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_level_ranking(integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_user_global_rank(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_mission_ranking(uuid, integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_user_mission_rank(uuid, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_lesson_ranking(integer, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_user_lesson_rank(uuid) TO anon, authenticated;
