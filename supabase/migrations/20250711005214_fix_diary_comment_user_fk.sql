-- Fix diary_comments.user_id foreign key to reference profiles table

-- Drop existing foreign key constraint if it points elsewhere
ALTER TABLE diary_comments DROP CONSTRAINT IF EXISTS diary_comments_user_id_fkey;

-- Add new foreign key constraint referencing profiles
ALTER TABLE diary_comments
  ADD CONSTRAINT diary_comments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
