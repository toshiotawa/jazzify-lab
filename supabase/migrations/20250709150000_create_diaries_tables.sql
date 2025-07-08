-- Create diaries table
CREATE TABLE IF NOT EXISTS public.diaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.diaries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public diaries are viewable" ON public.diaries
  FOR SELECT USING (true);
CREATE POLICY "Users can insert their own diary" ON public.diaries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own diary" ON public.diaries
  FOR DELETE USING (auth.uid() = user_id);

-- Likes table
CREATE TABLE IF NOT EXISTS public.diary_likes (
  diary_id UUID REFERENCES public.diaries(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (diary_id, user_id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()) NOT NULL
);

ALTER TABLE public.diary_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can like diaries" ON public.diary_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their like" ON public.diary_likes
  FOR DELETE USING (auth.uid() = user_id);
