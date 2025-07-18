-- Create diary-images storage bucket for premium diary image attachments
-- This bucket will store user-uploaded diary images

-- Create the storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'diary-images',
  'diary-images',
  true,
  1048576,  -- 1MB limit
  '{"image/jpeg", "image/png", "image/webp", "image/gif"}'
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create RLS policies for diary-images bucket
-- Policy 1: Users can view all images (since bucket is public)
CREATE POLICY "diary_images_view_all" ON storage.objects
FOR SELECT USING (bucket_id = 'diary-images');

-- Policy 2: Users can upload images to their own folder
CREATE POLICY "diary_images_upload_own" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'diary-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 3: Users can update their own images
CREATE POLICY "diary_images_update_own" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'diary-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy 4: Users can delete their own images
CREATE POLICY "diary_images_delete_own" ON storage.objects
FOR DELETE USING (
  bucket_id = 'diary-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Comment removed due to permission issues in local development