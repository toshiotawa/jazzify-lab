-- Recreate level ranking view to include fantasy_cleared_stages
-- Created at: 2025-08-17

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
  AND p.nickname <> p.email;