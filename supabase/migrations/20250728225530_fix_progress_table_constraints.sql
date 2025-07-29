-- Fix user_lesson_requirements_progress table constraints for fantasy stages

-- 1. First, make song_id nullable
ALTER TABLE public.user_lesson_requirements_progress 
ALTER COLUMN song_id DROP NOT NULL;

-- 2. Add lesson_song_id column if not exists
ALTER TABLE public.user_lesson_requirements_progress 
ADD COLUMN IF NOT EXISTS lesson_song_id UUID REFERENCES public.lesson_songs(id) ON DELETE CASCADE;

-- 3. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_lesson_requirements_progress_lesson_song_id 
ON public.user_lesson_requirements_progress(lesson_song_id);

-- 4. Drop old unique constraint if exists
ALTER TABLE public.user_lesson_requirements_progress
DROP CONSTRAINT IF EXISTS user_lesson_requirements_progress_user_id_lesson_id_song_id_key;

-- 5. Create new unique constraints
-- For regular songs (backward compatibility)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lesson_requirements_progress_unique_song 
ON public.user_lesson_requirements_progress(user_id, lesson_id, song_id) 
WHERE song_id IS NOT NULL;

-- For lesson_songs (including fantasy stages)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lesson_requirements_progress_unique_lesson_song 
ON public.user_lesson_requirements_progress(user_id, lesson_id, lesson_song_id) 
WHERE lesson_song_id IS NOT NULL;