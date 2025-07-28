-- Add fantasy stage support to lesson_songs table

-- 1. First, make song_id nullable (it currently has NOT NULL constraint)
ALTER TABLE public.lesson_songs 
ALTER COLUMN song_id DROP NOT NULL;

-- 2. Add new columns to lesson_songs table
ALTER TABLE public.lesson_songs 
ADD COLUMN IF NOT EXISTS is_fantasy BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS fantasy_stage_id UUID REFERENCES public.fantasy_stages(id) ON DELETE RESTRICT;

-- 3. Add clear_conditions column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'lesson_songs' 
    AND column_name = 'clear_conditions'
  ) THEN
    ALTER TABLE public.lesson_songs ADD COLUMN clear_conditions JSONB;
  END IF;
END $$;

-- 4. Create index for fantasy_stage_id
CREATE INDEX IF NOT EXISTS idx_lesson_songs_fantasy_stage_id 
ON public.lesson_songs(fantasy_stage_id) 
WHERE fantasy_stage_id IS NOT NULL;

-- 5. Add constraint to ensure either song or fantasy stage is set
ALTER TABLE public.lesson_songs
ADD CONSTRAINT lesson_songs_check_fantasy_or_song CHECK (
  (is_fantasy = true AND fantasy_stage_id IS NOT NULL AND song_id IS NULL) 
  OR 
  (is_fantasy = false AND song_id IS NOT NULL AND fantasy_stage_id IS NULL)
);

-- 6. Create composite unique indexes to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_songs_unique_content 
ON public.lesson_songs(lesson_id, song_id) 
WHERE song_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_songs_unique_fantasy 
ON public.lesson_songs(lesson_id, fantasy_stage_id) 
WHERE fantasy_stage_id IS NOT NULL;

-- 7. Update RLS policies to include new columns
DROP POLICY IF EXISTS "Admin can manage lesson songs" ON public.lesson_songs;
CREATE POLICY "Admin can manage lesson songs"
ON public.lesson_songs
FOR ALL
USING ( 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
)
WITH CHECK ( 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- 8. Grant permissions
GRANT SELECT ON public.fantasy_stages TO authenticated;
GRANT SELECT ON public.lesson_songs TO authenticated;

-- 9. Add comment for documentation
COMMENT ON COLUMN public.lesson_songs.is_fantasy IS 'Indicates whether this lesson item is a fantasy stage (true) or a regular song (false)';
COMMENT ON COLUMN public.lesson_songs.fantasy_stage_id IS 'Reference to fantasy_stages table when is_fantasy is true';
COMMENT ON COLUMN public.lesson_songs.clear_conditions IS 'JSON object containing clear conditions like count, requires_days, daily_count';