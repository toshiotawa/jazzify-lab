-- Add image_url column to practice_diaries table for premium diary image attachments
ALTER TABLE public.practice_diaries ADD COLUMN image_url TEXT;

-- Add comment to explain the column
COMMENT ON COLUMN public.practice_diaries.image_url IS 'URL of attached image for premium/platinum users (1280px max, 1MB max, WebP format)';

-- Create diary-images storage bucket if it doesn't exist
-- This should be done via Supabase dashboard or programmatically
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('diary-images', 'diary-images', true)
-- ON CONFLICT (id) DO NOTHING;