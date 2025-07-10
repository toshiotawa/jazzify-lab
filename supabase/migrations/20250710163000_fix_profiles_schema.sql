-- Fix profiles table schema to match schema.sql

-- 1. Create membership_rank ENUM type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_rank' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    CREATE TYPE public.membership_rank AS ENUM ('free', 'standard', 'premium', 'platinum');
  END IF;
END $$;

-- 2. Add rank column with proper ENUM type
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS rank public.membership_rank NOT NULL DEFAULT 'free';

-- 3. Add other missing columns from schema.sql
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS xp bigint NOT NULL DEFAULT 0;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS next_season_xp_multiplier numeric NOT NULL DEFAULT 1.0;

-- 4. Migrate data from member_rank to rank if needed
UPDATE public.profiles 
SET rank = LOWER(member_rank)::public.membership_rank
WHERE rank = 'free' AND member_rank IS NOT NULL;

-- 5. Fix level column type (should be integer, not text)
-- First add new column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS level_int integer NOT NULL DEFAULT 1;

-- Migrate data if possible
UPDATE public.profiles 
SET level_int = CASE 
  WHEN level ~ '^\d+$' THEN level::integer 
  ELSE 1 
END;

-- Drop old column and rename new one
ALTER TABLE public.profiles DROP COLUMN IF EXISTS level;
ALTER TABLE public.profiles RENAME COLUMN level_int TO level;

-- 6. Ensure all required columns exist
ALTER TABLE public.profiles 
ALTER COLUMN email SET NOT NULL,
ALTER COLUMN nickname SET NOT NULL;

-- 7. Add missing indexes if not exists
CREATE INDEX IF NOT EXISTS profiles_rank_idx ON public.profiles (rank);
CREATE INDEX IF NOT EXISTS profiles_level_idx ON public.profiles (level);
CREATE INDEX IF NOT EXISTS profiles_xp_idx ON public.profiles (xp); 