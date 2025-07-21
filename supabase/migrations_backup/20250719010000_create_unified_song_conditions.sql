-- Create unified song play conditions table
-- This table standardizes song conditions across missions and lessons

CREATE TABLE public.song_play_conditions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  context_type text NOT NULL, -- 'mission' | 'lesson' | 'general'
  context_id uuid, -- challenge_id or lesson_id (null for general)
  key_offset integer NOT NULL DEFAULT 0,
  min_speed numeric NOT NULL DEFAULT 1.0,
  min_rank text NOT NULL DEFAULT 'B',
  clears_required integer NOT NULL DEFAULT 1,
  notation_setting text NOT NULL DEFAULT 'both',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure context_type is valid
  CONSTRAINT check_context_type CHECK (context_type IN ('mission', 'lesson', 'general')),
  
  -- Ensure context_id is provided for mission/lesson contexts
  CONSTRAINT check_context_id CHECK (
    (context_type = 'general' AND context_id IS NULL) OR
    (context_type IN ('mission', 'lesson') AND context_id IS NOT NULL)
  ),
  
  -- Unique constraint for song + context combination
  UNIQUE (song_id, context_type, context_id)
);

-- Create indexes for performance
CREATE INDEX idx_song_play_conditions_song_id ON public.song_play_conditions(song_id);
CREATE INDEX idx_song_play_conditions_context ON public.song_play_conditions(context_type, context_id);
CREATE INDEX idx_song_play_conditions_song_context ON public.song_play_conditions(song_id, context_type);

-- Enable RLS
ALTER TABLE public.song_play_conditions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read song play conditions" ON public.song_play_conditions
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage song play conditions" ON public.song_play_conditions
  FOR ALL USING ( (SELECT is_admin FROM public.profiles WHERE auth.uid() = id) = true )
  WITH CHECK ( (SELECT is_admin FROM public.profiles WHERE auth.uid() = id) = true );

-- Add comment for documentation
COMMENT ON TABLE public.song_play_conditions IS 'Unified table for song play conditions across missions, lessons, and general play';
COMMENT ON COLUMN public.song_play_conditions.context_type IS 'Type of context: mission, lesson, or general';
COMMENT ON COLUMN public.song_play_conditions.context_id IS 'ID of the challenge or lesson (null for general context)';
COMMENT ON COLUMN public.song_play_conditions.key_offset IS 'Transposition setting (-12 to +12)';
COMMENT ON COLUMN public.song_play_conditions.min_speed IS 'Minimum playback speed multiplier';
COMMENT ON COLUMN public.song_play_conditions.min_rank IS 'Minimum rank required (S, A, B, C, etc.)';
COMMENT ON COLUMN public.song_play_conditions.clears_required IS 'Number of clears required to complete';
COMMENT ON COLUMN public.song_play_conditions.notation_setting IS 'Notation display setting (both, chord, melody, etc.)';