-- Fix foreign key constraints to reference practice_diaries instead of diaries
-- Note: diary_comments and diary_likes tables don't exist in current schema
-- This migration is skipped as the tables are not needed

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
