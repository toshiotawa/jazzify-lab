-- Fix foreign key constraints to reference practice_diaries instead of diaries

-- Drop existing foreign key constraints
ALTER TABLE diary_comments DROP CONSTRAINT IF EXISTS diary_comments_diary_id_fkey;
ALTER TABLE diary_likes DROP CONSTRAINT IF EXISTS diary_likes_diary_id_fkey;

-- Add new foreign key constraints referencing practice_diaries
ALTER TABLE diary_comments 
  ADD CONSTRAINT diary_comments_diary_id_fkey 
  FOREIGN KEY (diary_id) REFERENCES practice_diaries(id) ON DELETE CASCADE;

ALTER TABLE diary_likes 
  ADD CONSTRAINT diary_likes_diary_id_fkey 
  FOREIGN KEY (diary_id) REFERENCES practice_diaries(id) ON DELETE CASCADE;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
