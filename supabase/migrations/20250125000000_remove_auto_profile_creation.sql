-- Remove automatic profile creation completely
-- This migration ensures Magic Link authentication doesn't auto-create profiles

-- ============================================
-- 1. Drop the trigger if it exists (even if recreated by later migrations)
-- ============================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ============================================  
-- 2. Drop the handle_new_user function completely
-- ============================================
DROP FUNCTION IF EXISTS public.handle_new_user();

-- ============================================
-- 3. Clean up profiles that were auto-created with email as nickname
-- ============================================
-- Delete profiles where nickname equals email (these are auto-created profiles)
-- Only delete if they have default values (xp=0, level=1) indicating they were auto-created
DELETE FROM public.profiles 
WHERE nickname = email 
AND xp = 0 
AND level = 1 
AND is_admin = false
AND created_at > '2025-01-01'::timestamp; -- Only recent auto-created profiles

-- ============================================
-- 4. Ensure no future auto-creation can happen
-- ============================================
-- Note: This is extra safety - the function deletion above should be sufficient
DO $$
BEGIN
  -- Check if any triggers still exist and warn
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE event_object_table = 'users' 
    AND trigger_schema = 'auth'
    AND trigger_name LIKE '%user%'
  ) THEN
    RAISE WARNING 'Warning: There are still triggers on auth.users table that might auto-create profiles';
  END IF;
END $$; 