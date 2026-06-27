-- Fix RLS initplan by wrapping auth.*() calls with SELECT, and drop duplicate indexes
-- Reference: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

BEGIN;

-- 1) RLS: replace direct auth.uid() usage with (SELECT auth.uid())

-- Admin policies
ALTER POLICY "Admin can manage lesson songs" ON public.lesson_songs
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Admin can manage song play conditions" ON public.song_play_conditions
  USING (((SELECT profiles.is_admin FROM public.profiles WHERE (SELECT auth.uid()) = profiles.id) = true))
  WITH CHECK (((SELECT profiles.is_admin FROM public.profiles WHERE (SELECT auth.uid()) = profiles.id) = true));

ALTER POLICY "Admin can read all song play progress" ON public.user_song_play_progress
  FOR SELECT USING (((SELECT profiles.is_admin FROM public.profiles WHERE (SELECT auth.uid()) = profiles.id) = true));

ALTER POLICY "Allow admin full access on course_prerequisites" ON public.course_prerequisites
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Allow admin full access on courses" ON public.courses
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Allow admin full access on lesson_songs" ON public.lesson_songs
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Allow admin full access on lessons" ON public.lessons
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Only admins can manage challenge tracks" ON public.challenge_tracks
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Only admins can manage challenges" ON public.challenges
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Only admins can manage courses" ON public.courses
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Only admins can manage lesson tracks" ON public.lesson_tracks
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Only admins can manage lessons" ON public.lessons
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

ALTER POLICY "Only admins can manage songs" ON public.songs
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
    )
  );

-- Owner/self policies
ALTER POLICY "Owner can update own profile" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

ALTER POLICY "Profiles are viewable by owner" ON public.profiles
  FOR SELECT USING ((SELECT auth.uid()) = id);

ALTER POLICY "Users can delete their own song stats" ON public.user_song_stats
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert own requirements progress" ON public.user_lesson_requirements_progress
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own challenge progress" ON public.challenge_progress
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

ALTER POLICY "Users can insert their own song stats" ON public.user_song_stats
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can insert their own track clears" ON public.track_clears
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own diaries" ON public.diaries
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own diary comments" ON public.diary_comments
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own diary likes" ON public.diary_likes
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can manage their own song play progress" ON public.user_song_play_progress
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can read their own song play progress" ON public.user_song_play_progress
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update own requirements progress" ON public.user_lesson_requirements_progress
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own challenge progress" ON public.challenge_progress
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can update their own song stats" ON public.user_song_stats
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view own requirements progress" ON public.user_lesson_requirements_progress
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view their own challenge progress" ON public.challenge_progress
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view their own song stats" ON public.user_song_stats
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "Users can view their own track clears" ON public.track_clears
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- Announcements admin policies
ALTER POLICY "announcements_admin_modify" ON public.announcements
  USING ((SELECT profiles.is_admin FROM public.profiles WHERE profiles.id = (SELECT auth.uid())))
  WITH CHECK ((SELECT profiles.is_admin FROM public.profiles WHERE profiles.id = (SELECT auth.uid())));

ALTER POLICY "announcements_admin_read" ON public.announcements
  FOR SELECT USING ((SELECT profiles.is_admin FROM public.profiles WHERE profiles.id = (SELECT auth.uid())));

-- Course/Lesson progress (user or admin)
ALTER POLICY "course_progress_user_or_admin_modify" ON public.user_course_progress
  USING (((SELECT auth.uid()) = user_id) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ))
  WITH CHECK (((SELECT auth.uid()) = user_id) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

ALTER POLICY "course_progress_user_or_admin_select" ON public.user_course_progress
  FOR SELECT USING (((SELECT auth.uid()) = user_id) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

ALTER POLICY "lesson_progress_user_or_admin_modify" ON public.user_lesson_progress
  USING (((SELECT auth.uid()) = user_id) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ))
  WITH CHECK (((SELECT auth.uid()) = user_id) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

ALTER POLICY "lesson_progress_user_or_admin_select" ON public.user_lesson_progress
  FOR SELECT USING (((SELECT auth.uid()) = user_id) OR EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

-- Fantasy mode policies
ALTER POLICY "fantasy_stage_clears_policy" ON public.fantasy_stage_clears
  USING (((SELECT auth.uid()) = user_id) OR ((SELECT auth.uid()) IN (
    SELECT profiles.id FROM public.profiles WHERE profiles.is_admin = true
  )));

ALTER POLICY "fantasy_stages_write_policy" ON public.fantasy_stages
  USING ((SELECT auth.uid()) IN (
    SELECT profiles.id FROM public.profiles WHERE profiles.is_admin = true
  ));

ALTER POLICY "fantasy_user_progress_policy" ON public.fantasy_user_progress
  USING (((SELECT auth.uid()) = user_id) OR ((SELECT auth.uid()) IN (
    SELECT profiles.id FROM public.profiles WHERE profiles.is_admin = true
  )));

-- Diary likes convenience
ALTER POLICY "likes_delete" ON public.diary_likes
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "likes_insert" ON public.diary_likes
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

-- Profiles convenience
ALTER POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

ALTER POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

ALTER POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

ALTER POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id)
  WITH CHECK ((SELECT auth.uid()) = id);

ALTER POLICY "profiles_update_admin" ON public.profiles
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

-- Song progress owner policies
ALTER POLICY "progress_owner_delete" ON public.user_song_progress
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "progress_owner_insert" ON public.user_song_progress
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "progress_owner_modify" ON public.user_challenge_progress
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "progress_owner_select" ON public.user_challenge_progress
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "progress_owner_select" ON public.user_song_progress
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

ALTER POLICY "progress_owner_update" ON public.user_song_progress
  FOR UPDATE USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- Songs admin policies
ALTER POLICY "songs_admin_delete" ON public.songs
  FOR DELETE USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

ALTER POLICY "songs_admin_insert" ON public.songs
  FOR INSERT WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

ALTER POLICY "songs_admin_update" ON public.songs
  FOR UPDATE USING (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
  ));

-- XP owner
ALTER POLICY "xp_owner_insert" ON public.xp_history
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

ALTER POLICY "xp_owner_select" ON public.xp_history
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- 2) Drop duplicate indexes (keep one copy)
-- songs: drop one of duplicated indexes on (min_rank)
DROP INDEX IF EXISTS public.songs_min_rank_idx;

-- user_lesson_requirements_progress: identical partial unique indexes on (user_id, lesson_id, lesson_song_id)
DROP INDEX IF EXISTS public.idx_user_lesson_requirements_progress_unique;

COMMIT;

