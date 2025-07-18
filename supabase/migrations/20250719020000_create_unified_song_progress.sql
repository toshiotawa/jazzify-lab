-- Create unified song play progress table
-- This table standardizes progress tracking across missions and lessons

CREATE TABLE public.user_song_play_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  context_type text NOT NULL, -- 'mission' | 'lesson' | 'general'
  context_id uuid, -- challenge_id or lesson_id (null for general)
  clear_count integer NOT NULL DEFAULT 0,
  best_rank text,
  best_score integer,
  last_cleared_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure context_type is valid
  CONSTRAINT check_context_type CHECK (context_type IN ('mission', 'lesson', 'general')),
  
  -- Ensure context_id is provided for mission/lesson contexts
  CONSTRAINT check_context_id CHECK (
    (context_type = 'general' AND context_id IS NULL) OR
    (context_type IN ('mission', 'lesson') AND context_id IS NOT NULL)
  ),
  
  -- Unique constraint for user + song + context combination
  UNIQUE (user_id, song_id, context_type, context_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_song_play_progress_user_id ON public.user_song_play_progress(user_id);
CREATE INDEX idx_user_song_play_progress_song_id ON public.user_song_play_progress(song_id);
CREATE INDEX idx_user_song_play_progress_context ON public.user_song_play_progress(context_type, context_id);
CREATE INDEX idx_user_song_play_progress_user_song ON public.user_song_play_progress(user_id, song_id);
CREATE INDEX idx_user_song_play_progress_user_context ON public.user_song_play_progress(user_id, context_type, context_id);

-- Enable RLS
ALTER TABLE public.user_song_play_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can read their own song play progress" ON public.user_song_play_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own song play progress" ON public.user_song_play_progress
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can read all song play progress" ON public.user_song_play_progress
  FOR SELECT USING ( (SELECT is_admin FROM public.profiles WHERE auth.uid() = id) = true );

-- Add comment for documentation
COMMENT ON TABLE public.user_song_play_progress IS 'Unified table for user song play progress across missions, lessons, and general play';
COMMENT ON COLUMN public.user_song_play_progress.context_type IS 'Type of context: mission, lesson, or general';
COMMENT ON COLUMN public.user_song_play_progress.context_id IS 'ID of the challenge or lesson (null for general context)';
COMMENT ON COLUMN public.user_song_play_progress.clear_count IS 'Number of times the song has been cleared in this context';
COMMENT ON COLUMN public.user_song_play_progress.best_rank IS 'Best rank achieved in this context (S, A, B, C, etc.)';
COMMENT ON COLUMN public.user_song_play_progress.best_score IS 'Best score achieved in this context';
COMMENT ON COLUMN public.user_song_play_progress.last_cleared_at IS 'Timestamp of the last clear in this context';