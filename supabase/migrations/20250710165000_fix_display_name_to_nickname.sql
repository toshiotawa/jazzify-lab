-- Fix display_name to nickname migration
-- This migration handles the transition from display_name to nickname column

-- ============================================
-- 1. First, check if display_name exists and nickname doesn't
-- ============================================
DO $$
BEGIN
  -- If display_name exists but nickname doesn't, rename it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'display_name'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'nickname'
  ) THEN
    -- Rename display_name to nickname
    ALTER TABLE public.profiles RENAME COLUMN display_name TO nickname;
  END IF;

  -- If both exist (shouldn't happen, but just in case)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'display_name'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'nickname'
  ) THEN
    -- Copy data from display_name to nickname if nickname is null
    UPDATE public.profiles 
    SET nickname = display_name 
    WHERE nickname IS NULL AND display_name IS NOT NULL;
    
    -- Drop display_name column
    ALTER TABLE public.profiles DROP COLUMN IF EXISTS display_name;
  END IF;

  -- If nickname doesn't exist at all, create it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'nickname'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN nickname text;
    
    -- Set default values for existing rows
    UPDATE public.profiles 
    SET nickname = COALESCE(email, 'user_' || id::text) 
    WHERE nickname IS NULL;
    
    -- Now add NOT NULL constraint
    ALTER TABLE public.profiles ALTER COLUMN nickname SET NOT NULL;
  END IF;
END $$;

-- ============================================
-- 2. Add missing columns according to new schema
-- ============================================

-- Add rank column if it doesn't exist (rename member_rank to rank)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'member_rank'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'rank'
  ) THEN
    -- First create the membership_rank type if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_rank' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
      CREATE TYPE public.membership_rank AS ENUM ('free', 'standard', 'premium', 'platinum');
    END IF;
    
    -- Add new rank column
    ALTER TABLE public.profiles ADD COLUMN rank public.membership_rank NOT NULL DEFAULT 'free';
    
    -- Copy data from member_rank to rank
    UPDATE public.profiles 
    SET rank = LOWER(member_rank)::public.membership_rank
    WHERE member_rank IN ('FREE', 'STANDARD', 'PREMIUM', 'PLATINUM');
    
    -- Drop old member_rank column
    ALTER TABLE public.profiles DROP COLUMN member_rank;
  END IF;
END $$;

-- Add xp column if it doesn't exist (rename total_exp to xp)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'total_exp'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'xp'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN total_exp TO xp;
    ALTER TABLE public.profiles ALTER COLUMN xp TYPE bigint;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'xp'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN xp bigint NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Fix level column type (should be integer, not text)
DO $$
BEGIN
  -- Check if level column exists and is text type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'level'
    AND data_type = 'text'
  ) THEN
    -- First drop the unique constraint if it exists
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_level_key;
    
    -- Create a temporary column
    ALTER TABLE public.profiles ADD COLUMN level_temp integer;
    
    -- Try to convert text to integer, default to 1 if conversion fails
    UPDATE public.profiles 
    SET level_temp = CASE 
      WHEN level ~ '^\d+$' THEN level::integer 
      ELSE 1 
    END;
    
    -- Drop old column and rename new one
    ALTER TABLE public.profiles DROP COLUMN level;
    ALTER TABLE public.profiles RENAME COLUMN level_temp TO level;
    
    -- Add NOT NULL constraint with default
    ALTER TABLE public.profiles ALTER COLUMN level SET NOT NULL;
    ALTER TABLE public.profiles ALTER COLUMN level SET DEFAULT 1;
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'level'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN level integer NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Add next_season_xp_multiplier if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS next_season_xp_multiplier numeric NOT NULL DEFAULT 1.0;

-- ============================================
-- 3. Update handle_new_user function to use nickname
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname, rank, xp, level)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'nickname', new.raw_user_meta_data->>'display_name', new.email),
    'free',
    0,
    1
  );
  RETURN new;
END;
$$;

-- ============================================
-- 4. Drop constraints that no longer apply
-- ============================================
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS display_name_unique;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_nickname_key;

-- ============================================
-- 5. Ensure all required columns have proper constraints
-- ============================================
ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN nickname SET NOT NULL;

-- ============================================
-- 6. Create/Update RLS policies to match new schema
-- ============================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Create new policies matching the schema.sql
CREATE POLICY "profiles_public_read" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_owner_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id); 