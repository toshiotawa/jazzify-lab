-- Add user_song_progress table for mission system and B-rank+ clear count tracking
-- This migration addresses the discrepancy between schema and code expectations

-- Create user_song_progress table for individual song progress tracking
CREATE TABLE public.user_song_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  song_id uuid REFERENCES public.songs(id) ON DELETE CASCADE,
  clear_count integer NOT NULL DEFAULT 0,
  best_rank text,
  last_cleared_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, song_id)
);

-- Add b_rank_plus_count column to user_song_stats for B-rank+ clear count tracking
ALTER TABLE public.user_song_stats 
ADD COLUMN b_rank_plus_count integer NOT NULL DEFAULT 0;

-- Enable RLS for user_song_progress table
ALTER TABLE public.user_song_progress ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_song_progress - users can only access their own progress
CREATE POLICY "progress_owner_select" ON public.user_song_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "progress_owner_insert" ON public.user_song_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_owner_update" ON public.user_song_progress
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "progress_owner_delete" ON public.user_song_progress
  FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_song_progress_user_idx
  ON public.user_song_progress (user_id);

CREATE INDEX IF NOT EXISTS user_song_progress_song_idx
  ON public.user_song_progress (song_id);

CREATE INDEX IF NOT EXISTS user_song_progress_user_song_idx
  ON public.user_song_progress (user_id, song_id);

-- Add index on user_song_stats for b_rank_plus_count queries
CREATE INDEX IF NOT EXISTS user_song_stats_b_rank_plus_count_idx
  ON public.user_song_stats (user_id, b_rank_plus_count);

-- Add a function to update both tables when a song is cleared
CREATE OR REPLACE FUNCTION public.update_song_clear_progress(
  _user_id uuid,
  _song_id uuid,
  _rank text,
  _is_b_rank_plus boolean DEFAULT false
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _result json;
  _new_clear_count integer;
  _new_b_rank_plus_count integer;
BEGIN
  -- Update user_song_stats for general tracking
  INSERT INTO public.user_song_stats (user_id, song_id, clear_count, best_rank, last_played, b_rank_plus_count)
  VALUES (_user_id, _song_id, 1, _rank, now(), CASE WHEN _is_b_rank_plus THEN 1 ELSE 0 END)
  ON CONFLICT (user_id, song_id) 
  DO UPDATE SET 
    clear_count = user_song_stats.clear_count + 1,
    b_rank_plus_count = CASE 
      WHEN _is_b_rank_plus THEN user_song_stats.b_rank_plus_count + 1 
      ELSE user_song_stats.b_rank_plus_count 
    END,
    best_rank = CASE 
      WHEN _rank = 'S' THEN 'S'
      WHEN _rank = 'A' AND user_song_stats.best_rank != 'S' THEN 'A'
      WHEN _rank = 'B' AND user_song_stats.best_rank NOT IN ('S', 'A') THEN 'B'
      WHEN _rank = 'C' AND user_song_stats.best_rank NOT IN ('S', 'A', 'B') THEN 'C'
      ELSE user_song_stats.best_rank
    END,
    last_played = now(),
    updated_at = now()
  RETURNING clear_count, b_rank_plus_count INTO _new_clear_count, _new_b_rank_plus_count;

  -- Update user_song_progress for mission system (if needed)
  INSERT INTO public.user_song_progress (user_id, song_id, clear_count, best_rank, last_cleared_at)
  VALUES (_user_id, _song_id, 1, _rank, now())
  ON CONFLICT (user_id, song_id) 
  DO UPDATE SET 
    clear_count = user_song_progress.clear_count + 1,
    best_rank = CASE 
      WHEN _rank = 'S' THEN 'S'
      WHEN _rank = 'A' AND user_song_progress.best_rank != 'S' THEN 'A'
      WHEN _rank = 'B' AND user_song_progress.best_rank NOT IN ('S', 'A') THEN 'B'
      WHEN _rank = 'C' AND user_song_progress.best_rank NOT IN ('S', 'A', 'B') THEN 'C'
      ELSE user_song_progress.best_rank
    END,
    last_cleared_at = now(),
    updated_at = now();

  -- Return the updated counts
  SELECT json_build_object(
    'clear_count', _new_clear_count,
    'b_rank_plus_count', _new_b_rank_plus_count
  ) INTO _result;

  RETURN _result;
END;
$$;

-- Migrate existing data from user_song_stats to user_song_progress
-- This ensures existing progress is preserved in the new table
INSERT INTO public.user_song_progress (user_id, song_id, clear_count, best_rank, last_cleared_at, created_at, updated_at)
SELECT 
  user_id, 
  song_id, 
  clear_count, 
  best_rank, 
  last_played, 
  created_at, 
  updated_at
FROM public.user_song_stats
ON CONFLICT (user_id, song_id) DO NOTHING;

-- Comment for future reference
COMMENT ON TABLE public.user_song_progress IS 'Individual song progress tracking for mission system';
COMMENT ON COLUMN public.user_song_stats.b_rank_plus_count IS 'Count of clears with B-rank or higher (for normal songs)';
COMMENT ON FUNCTION public.update_song_clear_progress IS 'Updates both user_song_stats and user_song_progress when a song is cleared';