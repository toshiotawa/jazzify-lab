-- Add image_url column to practice_diaries table
ALTER TABLE public.practice_diaries 
ADD COLUMN image_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.practice_diaries.image_url IS 'URL of the uploaded image for the diary entry';