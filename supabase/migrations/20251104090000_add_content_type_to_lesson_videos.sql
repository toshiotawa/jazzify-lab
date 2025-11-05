-- Add content_type column to lesson_videos table
ALTER TABLE public.lesson_videos
  ADD COLUMN IF NOT EXISTS content_type text;

COMMENT ON COLUMN public.lesson_videos.content_type IS 'Content category such as song or fantasy';
