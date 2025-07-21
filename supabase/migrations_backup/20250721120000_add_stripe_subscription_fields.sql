-- Add Stripe subscription fields to profiles table
-- Migration: Add subscription management fields for Stripe integration

-- Add Stripe customer ID and subscription status fields
ALTER TABLE public.profiles 
ADD COLUMN stripe_customer_id text,
ADD COLUMN will_cancel boolean NOT NULL DEFAULT false,
ADD COLUMN cancel_date timestamptz,
ADD COLUMN downgrade_to public.membership_rank,
ADD COLUMN downgrade_date timestamptz;

-- Create unique index on stripe_customer_id
CREATE UNIQUE INDEX idx_profiles_stripe_customer_id 
ON public.profiles(stripe_customer_id) 
WHERE stripe_customer_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.stripe_customer_id IS 'Stripe Customer ID for subscription management';
COMMENT ON COLUMN public.profiles.will_cancel IS 'Flag indicating subscription will be canceled at period end';
COMMENT ON COLUMN public.profiles.cancel_date IS 'Date when subscription will be canceled';
COMMENT ON COLUMN public.profiles.downgrade_to IS 'Target membership rank for downgrade at period end';
COMMENT ON COLUMN public.profiles.downgrade_date IS 'Date when subscription will be downgraded';