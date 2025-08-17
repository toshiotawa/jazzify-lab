-- Mission ranking RPCs: paginated fetch and user rank by mission

-- Drop if exist to allow idempotent re-apply in staging
DROP FUNCTION IF EXISTS public.rpc_get_mission_ranking(mission_id uuid, limit_count integer, offset_count integer);
DROP FUNCTION IF EXISTS public.rpc_get_user_mission_rank(mission_id uuid, target_user_id uuid);

-- Paginated mission ranking for a given mission_id
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
  ORDER BY ucp.clear_count DESC, p.level DESC, p.xp DESC, ucp.user_id ASC
  OFFSET offset_count
  LIMIT limit_count;
$$;

-- Get a user's rank for a given mission
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
  )
  SELECT rn FROM ranked WHERE user_id = target_user_id LIMIT 1;
$$;

-- Optional grants
-- GRANT EXECUTE ON FUNCTION public.rpc_get_mission_ranking(uuid, integer, integer) TO anon, authenticated;
-- GRANT EXECUTE ON FUNCTION public.rpc_get_user_mission_rank(uuid, uuid) TO anon, authenticated;