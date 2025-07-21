-- Fix profiles table schema to match schema.sql

-- 1. Create membership_rank ENUM type if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_rank' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    CREATE TYPE public.membership_rank AS ENUM ('free', 'standard', 'premium', 'platinum');
  END IF;
END $$;

-- 2. Add columns to profiles table (with table existence check)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN
        -- Add rank column with proper ENUM type
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'rank'
        ) THEN
            ALTER TABLE public.profiles 
            ADD COLUMN rank public.membership_rank NOT NULL DEFAULT 'free';
            RAISE NOTICE 'rank column added to profiles table';
        ELSE
            RAISE NOTICE 'rank column already exists in profiles table';
        END IF;
        
        -- Add xp column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'xp'
        ) THEN
            ALTER TABLE public.profiles 
            ADD COLUMN xp bigint NOT NULL DEFAULT 0;
            RAISE NOTICE 'xp column added to profiles table';
        ELSE
            RAISE NOTICE 'xp column already exists in profiles table';
        END IF;
        
        -- Add next_season_xp_multiplier column
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'next_season_xp_multiplier'
        ) THEN
            ALTER TABLE public.profiles 
            ADD COLUMN next_season_xp_multiplier numeric NOT NULL DEFAULT 1.0;
            RAISE NOTICE 'next_season_xp_multiplier column added to profiles table';
        ELSE
            RAISE NOTICE 'next_season_xp_multiplier column already exists in profiles table';
        END IF;
    ELSE
        RAISE NOTICE 'profiles table does not exist, skipping column additions';
    END IF;
END $$;

-- 4. Migrate data from member_rank to rank if needed (with column existence check)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'member_rank'
    ) THEN
        UPDATE public.profiles 
        SET rank = LOWER(member_rank)::public.membership_rank
        WHERE rank = 'free' AND member_rank IS NOT NULL;
        
        RAISE NOTICE 'Data migrated from member_rank to rank';
    ELSE
        RAISE NOTICE 'member_rank column does not exist, skipping migration';
    END IF;
END $$;

-- 5. Fix level column type (should be integer, not text)
DO $$
BEGIN
    -- Check if profiles table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN
        -- Check if level column exists and is not integer type
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'level'
            AND data_type != 'integer'
        ) THEN
        -- Add new integer column
        ALTER TABLE public.profiles 
        ADD COLUMN IF NOT EXISTS level_int integer NOT NULL DEFAULT 1;
        
        -- Migrate data if possible (only for text/varchar types)
        UPDATE public.profiles 
        SET level_int = CASE 
          WHEN level::text ~ '^\d+$' THEN level::text::integer 
          ELSE 1 
        END;
        
        -- Drop old column and rename new one
        ALTER TABLE public.profiles DROP COLUMN level;
        ALTER TABLE public.profiles RENAME COLUMN level_int TO level;
        
            RAISE NOTICE 'level column type converted to integer';
        ELSE
            RAISE NOTICE 'level column already has correct type or does not exist';
        END IF;
    ELSE
        RAISE NOTICE 'profiles table does not exist, skipping level column fix';
    END IF;
END $$;

-- 6. Ensure all required columns exist (with table existence check)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN
        -- Set email as NOT NULL if column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'email'
        ) THEN
            ALTER TABLE public.profiles ALTER COLUMN email SET NOT NULL;
        END IF;
        
        -- Set nickname as NOT NULL if column exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'profiles' 
            AND column_name = 'nickname'
        ) THEN
            ALTER TABLE public.profiles ALTER COLUMN nickname SET NOT NULL;
        END IF;
        
        RAISE NOTICE 'Required column constraints applied to profiles table';
    ELSE
        RAISE NOTICE 'profiles table does not exist, skipping constraint updates';
    END IF;
END $$;

-- 7. Add missing indexes if not exists (with table existence check)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) THEN
        CREATE INDEX IF NOT EXISTS profiles_rank_idx ON public.profiles (rank);
        CREATE INDEX IF NOT EXISTS profiles_level_idx ON public.profiles (level);
        CREATE INDEX IF NOT EXISTS profiles_xp_idx ON public.profiles (xp);
        RAISE NOTICE 'Indexes created for profiles table';
    ELSE
        RAISE NOTICE 'profiles table does not exist, skipping index creation';
    END IF;
END $$; 