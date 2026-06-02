ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_clear_required boolean DEFAULT true NOT NULL;

COMMENT ON COLUMN public.lesson_songs.is_clear_required IS
  'Display flag for whether this lesson task is marked as clear-required. Does not control quest completion button eligibility.';
