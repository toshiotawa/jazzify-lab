-- Fix existing lesson_songs records and recreate constraint

-- 1. First drop the existing constraint if it exists
ALTER TABLE public.lesson_songs 
DROP CONSTRAINT IF EXISTS lesson_songs_check_fantasy_or_song;

-- 2. Ensure song_id is nullable
ALTER TABLE public.lesson_songs 
ALTER COLUMN song_id DROP NOT NULL;

-- 3. Add new columns if they don't exist
ALTER TABLE public.lesson_songs 
ADD COLUMN IF NOT EXISTS is_fantasy BOOLEAN DEFAULT false;

ALTER TABLE public.lesson_songs 
ADD COLUMN IF NOT EXISTS fantasy_stage_id UUID REFERENCES public.fantasy_stages(id) ON DELETE RESTRICT;

-- 4. Update all existing records to have is_fantasy = false
UPDATE public.lesson_songs 
SET is_fantasy = false 
WHERE is_fantasy IS NULL;

-- 5. Add the constraint back
ALTER TABLE public.lesson_songs
ADD CONSTRAINT lesson_songs_check_fantasy_or_song CHECK (
  (is_fantasy = true AND fantasy_stage_id IS NOT NULL AND song_id IS NULL) 
  OR 
  (is_fantasy = false AND song_id IS NOT NULL AND fantasy_stage_id IS NULL)
);