-- Add Stripe subscription fields to profiles table
-- Migration: Add subscription management fields for Stripe integration

-- Add Stripe customer ID and subscription status fields (only if they don't exist)
DO $$
BEGIN
  -- Add stripe_customer_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'stripe_customer_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN stripe_customer_id text;
  END IF;

  -- Add will_cancel column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'will_cancel'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN will_cancel boolean NOT NULL DEFAULT false;
  END IF;

  -- Add cancel_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'cancel_date'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN cancel_date timestamptz;
  END IF;

  -- Add downgrade_to column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'downgrade_to'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN downgrade_to public.membership_rank;
  END IF;

  -- Add downgrade_date column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'downgrade_date'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN downgrade_date timestamptz;
  END IF;
END $$;

-- Create unique index on stripe_customer_id (only if it doesn't exist)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe Customer ID for subscription management';
COMMENT ON COLUMN public.profiles.will_cancel IS 'Flag indicating subscription will be canceled at period end';
COMMENT ON COLUMN public.profiles.cancel_date IS 'Date when subscription will be canceled';
COMMENT ON COLUMN public.profiles.downgrade_to IS 'Target membership rank for downgrade at period end';
COMMENT ON COLUMN public.profiles.downgrade_date IS 'Date when subscription will be downgraded';