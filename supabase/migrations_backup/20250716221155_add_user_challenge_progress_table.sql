-- Add user_challenge_progress table for mission progress tracking
-- This table tracks user progress for challenges/missions

-- Create user_challenge_progress table
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE,
  clear_count integer NOT NULL DEFAULT 0,
  completed boolean NOT NULL DEFAULT false,
  UNIQUE (user_id, challenge_id)
);

-- Enable RLS
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "progress_owner_select" ON public.user_challenge_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "progress_owner_modify" ON public.user_challenge_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS progress_user_idx ON public.user_challenge_progress (user_id);

-- Add comment
COMMENT ON TABLE public.user_challenge_progress IS 'User progress tracking for challenges/missions';
