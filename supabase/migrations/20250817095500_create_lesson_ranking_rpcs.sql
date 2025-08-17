-- Lesson ranking RPCs: paginated fetch and user rank by lessons cleared

-- Idempotent drops for re-apply
DROP FUNCTION IF EXISTS public.rpc_get_lesson_ranking(limit_count integer, offset_count integer);
DROP FUNCTION IF EXISTS public.rpc_get_user_lesson_rank(target_user_id uuid);

-- Paginated lesson ranking (by lessons_cleared DESC, then level DESC, xp DESC, id ASC)
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
  missions_completed integer
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
      COALESCE(m.missions_completed, 0) AS missions_completed
    FROM public.profiles p
    LEFT JOIN l ON l.user_id = p.id
    LEFT JOIN m ON m.user_id = p.id
    LEFT JOIN f ON f.user_id = p.id
    WHERE p.nickname IS NOT NULL
      AND p.nickname <> p.email
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
    missions_completed
  FROM ranked
  ORDER BY rn
  OFFSET offset_count
  LIMIT limit_count;
$$;

-- Get user's lesson rank
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
  ), ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY lessons_cleared DESC, level DESC, xp DESC, id ASC) AS rn
    FROM base
  )
  SELECT rn FROM ranked WHERE id = target_user_id LIMIT 1;
$$;

-- Optional grants
-- GRANT EXECUTE ON FUNCTION public.rpc_get_lesson_ranking(integer, integer) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.rpc_get_user_lesson_rank(uuid) TO anon, authenticated;