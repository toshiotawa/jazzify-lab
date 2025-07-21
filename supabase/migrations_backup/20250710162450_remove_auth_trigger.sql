-- Remove the handle_new_user trigger from auth.users table
-- This prevents automatic profile creation when Magic Link is sent

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function if it exists (optional, but clean)
DROP FUNCTION IF EXISTS public.handle_new_user(); 