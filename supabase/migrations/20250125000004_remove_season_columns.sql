-- Remove season_year and season_number columns from challenges table
-- These columns are not part of the current schema and cause NOT NULL constraint violations

-- 1. Check if season_year column exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'season_year'
  ) THEN
    ALTER TABLE challenges DROP COLUMN season_year;
  END IF;
END $$;

-- 2. Check if season_number column exists and drop it
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'challenges' AND column_name = 'season_number'
  ) THEN
    ALTER TABLE challenges DROP COLUMN season_number;
  END IF;
END $$;

-- 3. Ensure all required columns exist with correct constraints
ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS type public.challenge_type NOT NULL DEFAULT 'weekly';

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS category public.challenge_category NOT NULL DEFAULT 'song_clear';

ALTER TABLE challenges 
ADD COLUMN IF NOT EXISTS reward_multiplier numeric NOT NULL DEFAULT 1.3;

-- 4. Update any NULL values to defaults
UPDATE challenges SET type = 'weekly' WHERE type IS NULL;
UPDATE challenges SET category = 'song_clear' WHERE category IS NULL;
UPDATE challenges SET reward_multiplier = 1.3 WHERE reward_multiplier IS NULL; 