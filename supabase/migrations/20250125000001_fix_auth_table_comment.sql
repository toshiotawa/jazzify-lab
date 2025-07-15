-- Fix auth.users table comment permission issue
-- This migration removes any comment operations on auth.users table

-- We cannot modify auth.users table comments due to permission restrictions
-- The handle_new_user function and trigger have already been removed in previous migrations

-- ============================================
-- 1. Ensure handle_new_user function is completely removed (double-check)
-- ============================================
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- 2. Ensure no triggers exist on auth.users (double-check)
-- ============================================
-- Note: We cannot drop triggers on auth.users due to permissions, but this serves as documentation
-- The previous migrations should have already handled this

-- ============================================
-- 3. Verify that Magic Link authentication won't auto-create profiles
-- ============================================
-- The absence of handle_new_user function ensures no automatic profile creation
-- Users must manually complete registration through the ProfileWizard component 