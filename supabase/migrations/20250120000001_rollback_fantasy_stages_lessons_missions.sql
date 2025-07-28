-- Rollback: Remove fantasy stage support from lessons and missions

-- Drop policies first
DROP POLICY IF EXISTS "lesson_fantasy_clears_read_own" ON public.lesson_fantasy_clears;
DROP POLICY IF EXISTS "lesson_fantasy_clears_insert_own" ON public.lesson_fantasy_clears;
DROP POLICY IF EXISTS "mission_fantasy_clears_read_own" ON public.mission_fantasy_clears;
DROP POLICY IF EXISTS "mission_fantasy_clears_insert_own" ON public.mission_fantasy_clears;

-- Drop indexes
DROP INDEX IF EXISTS idx_lesson_fantasy_clears_user_id;
DROP INDEX IF EXISTS idx_lesson_fantasy_clears_lesson_song_id;
DROP INDEX IF EXISTS idx_lesson_fantasy_clears_fantasy_stage_id;
DROP INDEX IF EXISTS idx_lesson_fantasy_clears_cleared_at;

DROP INDEX IF EXISTS idx_mission_fantasy_clears_user_id;
DROP INDEX IF EXISTS idx_mission_fantasy_clears_challenge_id;
DROP INDEX IF EXISTS idx_mission_fantasy_clears_fantasy_stage_id;
DROP INDEX IF EXISTS idx_mission_fantasy_clears_cleared_at;

-- Drop tables
DROP TABLE IF EXISTS public.lesson_fantasy_clears;
DROP TABLE IF EXISTS public.mission_fantasy_clears;

-- Remove columns from lesson_songs
ALTER TABLE public.lesson_songs 
DROP COLUMN IF EXISTS fantasy_stage_id,
DROP COLUMN IF EXISTS clear_days;

-- Remove columns from challenge_tracks
ALTER TABLE public.challenge_tracks 
DROP COLUMN IF EXISTS fantasy_stage_id,
DROP COLUMN IF EXISTS clear_days;