-- Create RPCs for fantasy cleared stages ranking (optional, for future use)
-- Created at: 2025-08-17

DROP FUNCTION IF EXISTS public.rpc_get_fantasy_clears_ranking(limit_count integer, offset_count integer);
DROP FUNCTION IF EXISTS public.rpc_get_user_fantasy_clears_rank(target_user_id uuid);

CREATE FUNCTION public.rpc_get_fantasy_clears_ranking(
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
  fantasy_cleared_stages integer
)
LANGUAGE sql
STABLE
AS $$
  WITH fs AS (
    SELECT fsc.user_id, COUNT(*) AS cleared_count
    FROM public.fantasy_stage_clears fsc
    WHERE fsc.clear_type = 'clear'
    GROUP BY fsc.user_id
  ), base AS (
    SELECT p.id, p.nickname, p.level, p.xp, p.rank, p.avatar_url, p.twitter_handle, p.selected_title,
           COALESCE(fs.cleared_count, 0) AS fantasy_cleared_stages
    FROM public.profiles p
    LEFT JOIN fs ON fs.user_id = p.id
    WHERE p.nickname IS NOT NULL
      AND p.nickname <> p.email
  ), ranked AS (
    SELECT *, ROW_NUMBER() OVER (ORDER BY fantasy_cleared_stages DESC, level DESC, xp DESC, id ASC) AS rn
    FROM base
  )
  SELECT id, nickname, level, xp, rank, avatar_url, twitter_handle, selected_title, fantasy_cleared_stages
  FROM ranked
  ORDER BY rn
  OFFSET offset_count
  LIMIT limit_count;
$$;

CREATE FUNCTION public.rpc_get_user_fantasy_clears_rank(target_user_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
AS $$
  WITH fs AS (
    SELECT fsc.user_id, COUNT(*) AS cleared_count
    FROM public.fantasy_stage_clears fsc
    WHERE fsc.clear_type = 'clear'
    GROUP BY fsc.user_id
  ), base AS (
    SELECT p.id, COALESCE(fs.cleared_count, 0) AS fantasy_cleared_stages, p.level, p.xp
    FROM public.profiles p
    LEFT JOIN fs ON fs.user_id = p.id
    WHERE p.nickname IS NOT NULL
      AND p.nickname <> p.email
  ), ranked AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY fantasy_cleared_stages DESC, level DESC, xp DESC, id ASC) AS rn
    FROM base
  )
  SELECT rn FROM ranked WHERE id = target_user_id LIMIT 1;
$$;