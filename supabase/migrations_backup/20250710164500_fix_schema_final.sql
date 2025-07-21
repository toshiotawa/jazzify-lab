-- Final schema fixes for production database

-- ============================================
-- 1. Create missing ENUM types
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_type' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    CREATE TYPE public.challenge_type AS ENUM ('weekly', 'monthly');
  END IF;
END $$;

-- ============================================
-- 2. Create critical missing tables
-- ============================================

-- Create xp_history table (critical for XP tracking)
CREATE TABLE IF NOT EXISTS public.xp_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id uuid REFERENCES public.songs(id),
  gained_xp integer NOT NULL,
  base_xp integer NOT NULL,
  speed_multiplier numeric NOT NULL,
  rank_multiplier numeric NOT NULL,
  transpose_multiplier numeric NOT NULL,
  membership_multiplier numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for xp_history
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for xp_history
DROP POLICY IF EXISTS "xp_owner_select" ON public.xp_history;
DROP POLICY IF EXISTS "xp_owner_insert" ON public.xp_history;

CREATE POLICY "xp_owner_select" ON public.xp_history 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "xp_owner_insert" ON public.xp_history 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create user_lesson_progress table (critical for lesson tracking)
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  completed boolean NOT NULL DEFAULT false,
  completion_date timestamptz,
  unlock_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);

-- Enable RLS for user_lesson_progress
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for user_lesson_progress
DROP POLICY IF EXISTS "lesson_progress_owner_select" ON public.user_lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_owner_modify" ON public.user_lesson_progress;

CREATE POLICY "lesson_progress_owner_select" ON public.user_lesson_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "lesson_progress_owner_modify" ON public.user_lesson_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for user_lesson_progress
CREATE INDEX IF NOT EXISTS lesson_progress_user_idx ON public.user_lesson_progress (user_id);
CREATE INDEX IF NOT EXISTS lesson_progress_course_idx ON public.user_lesson_progress (user_id, course_id);
CREATE INDEX IF NOT EXISTS lesson_progress_completion_idx ON public.user_lesson_progress (user_id, completed, completion_date);

-- Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  link_url text,
  link_text text,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 1,
  created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS for announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for announcements
DROP POLICY IF EXISTS "announcements_public_read" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_read" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_modify" ON public.announcements;

CREATE POLICY "announcements_public_read" ON public.announcements
  FOR SELECT USING (is_active = true);

CREATE POLICY "announcements_admin_read" ON public.announcements
  FOR SELECT USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

CREATE POLICY "announcements_admin_modify" ON public.announcements
  FOR ALL 
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()));

-- Create indexes for announcements
CREATE INDEX IF NOT EXISTS announcements_active_idx ON public.announcements (is_active, priority, created_at);
CREATE INDEX IF NOT EXISTS announcements_created_by_idx ON public.announcements (created_by);

-- Create lesson_videos table
CREATE TABLE IF NOT EXISTS public.lesson_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
  vimeo_url text NOT NULL,
  order_index integer NOT NULL DEFAULT 0
);

-- Create user_song_stats table
CREATE TABLE IF NOT EXISTS public.user_song_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id uuid REFERENCES public.songs(id) ON DELETE CASCADE,
  best_rank text,
  best_score integer,
  clear_count integer NOT NULL DEFAULT 0,
  last_played timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, song_id)
);

-- ============================================
-- 3. Add missing columns to existing tables
-- ============================================

-- Add missing columns to songs table
ALTER TABLE public.songs 
ADD COLUMN IF NOT EXISTS artist text,
ADD COLUMN IF NOT EXISTS data jsonb,
ADD COLUMN IF NOT EXISTS min_rank public.membership_rank NOT NULL DEFAULT 'free',
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add missing columns to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS min_rank public.membership_rank NOT NULL DEFAULT 'premium';

-- Add missing columns to challenges table
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS type public.challenge_type,
ADD COLUMN IF NOT EXISTS reward_multiplier numeric NOT NULL DEFAULT 1.3,
ADD COLUMN IF NOT EXISTS diary_count integer;

-- Note: challenge_type column doesn't exist, so we skip the update
-- The type column will be populated with default values as needed

-- ============================================
-- 4. Create missing function
-- ============================================
CREATE OR REPLACE FUNCTION public.increment_diary_progress(
  _user_id uuid,
  _mission_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_challenge_progress (user_id, challenge_id, clear_count)
  VALUES (_user_id, _mission_id, 1)
  ON CONFLICT (user_id, challenge_id)
  DO UPDATE SET clear_count = user_challenge_progress.clear_count + 1;
END;
$$;

-- ============================================
-- 5. Grant permissions
-- ============================================
GRANT ALL ON public.xp_history TO authenticated;
GRANT ALL ON public.user_lesson_progress TO authenticated;
GRANT SELECT ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
GRANT ALL ON public.lesson_videos TO authenticated;
GRANT ALL ON public.user_song_stats TO authenticated;

-- ============================================
-- 6. Add/Update triggers
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

-- Add update triggers for tables with updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_lesson_progress_updated_at') THEN
    CREATE TRIGGER update_user_lesson_progress_updated_at 
      BEFORE UPDATE ON public.user_lesson_progress 
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_announcements_updated_at') THEN
    CREATE TRIGGER update_announcements_updated_at 
      BEFORE UPDATE ON public.announcements 
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_user_song_stats_updated_at') THEN
    CREATE TRIGGER update_user_song_stats_updated_at 
      BEFORE UPDATE ON public.user_song_stats 
      FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
  END IF;
END $$; 