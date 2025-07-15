-- Clean up orphaned users who don't have profiles
-- This removes users who were created by Magic Link but never completed registration

-- Delete users from auth.users who don't have corresponding profiles
DELETE FROM auth.users 
WHERE id NOT IN (
  SELECT id FROM public.profiles
);

-- Add a comment explaining the cleanup
COMMENT ON TABLE auth.users IS 'Auth users table - cleaned up orphaned users without profiles'; 