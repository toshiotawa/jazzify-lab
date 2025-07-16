-- Clean up orphaned profiles that were auto-created
-- This removes profiles that were created automatically with email as nickname

-- Delete auto-created profiles where nickname equals email
-- Only delete if they have default values indicating they were auto-created
DELETE FROM public.profiles 
WHERE nickname = email 
AND xp = 0 
AND level = 1 
AND is_admin = false; 