-- Fix challenge_type column issue
-- This migration addresses the "null value in column challenge_type" error

-- 1. Check if old challenge_type column exists and migrate data
DO $$
BEGIN
  -- Check if old challenge_type column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'challenge_type'
  ) THEN
    -- Migrate data from old challenge_type to new type column
    UPDATE challenges 
    SET type = LOWER(challenge_type)::public.challenge_type
    WHERE type IS NULL AND challenge_type IS NOT NULL 
      AND LOWER(challenge_type) IN ('weekly', 'monthly');
    
    -- Drop the old challenge_type column
    ALTER TABLE challenges DROP COLUMN IF EXISTS challenge_type;
  END IF;
END $$;

-- 2. Ensure type column is NOT NULL
ALTER TABLE challenges ALTER COLUMN type SET NOT NULL;

-- 3. Ensure category column exists and has default value
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS category public.challenge_category NOT NULL DEFAULT 'song_clear';

-- 4. Update any NULL category values
UPDATE challenges SET category = 'song_clear' WHERE category IS NULL;

-- 5. Add song_clear_count column if it doesn't exist
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS song_clear_count INTEGER;

-- 6. Add diary_count column if it doesn't exist  
ALTER TABLE challenges ADD COLUMN IF NOT EXISTS diary_count INTEGER; 