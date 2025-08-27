-- Fix: remove recursive RLS policy on profiles causing infinite recursion
-- Error observed: "infinite recursion detected in policy for relation 'profiles'"
-- Root cause: The policy "profiles_update_admin" references the same table (profiles)
-- inside its USING/WITH CHECK, which leads to recursive evaluation.

begin;

-- Drop the problematic admin update policy if it exists
drop policy if exists "profiles_update_admin" on public.profiles;

-- Note:
-- We intentionally do not recreate an admin update policy here to avoid
-- self-referential checks. Existing owner-update policies remain:
--   - profiles_owner_update / profiles_update (auth.uid() = id)
-- These are sufficient for user self-updates (e.g., XP increments).
-- If admin write access is required in the future, prefer a non-recursive
-- predicate (e.g., using a separate admins table or JWT claim) rather than
-- selecting from public.profiles within the profiles policy itself.

commit;

