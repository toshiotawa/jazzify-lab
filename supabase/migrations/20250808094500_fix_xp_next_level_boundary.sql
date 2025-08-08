-- Fix XP next level boundary conditions to match app logic
-- 1-9: 2,000 XP per level
-- 10-49: 50,000 XP per level
-- 50+: 100,000 XP per level

CREATE OR REPLACE FUNCTION public.xp_to_next_level(current_level integer) RETURNS integer
    LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN current_level < 10 THEN 2000
    WHEN current_level < 50 THEN 50000
    ELSE 100000
  END;
$$;

COMMENT ON FUNCTION public.xp_to_next_level(current_level integer) IS 'Returns XP required for next level: 1-9=2000, 10-49=50000, 50+=100000.';