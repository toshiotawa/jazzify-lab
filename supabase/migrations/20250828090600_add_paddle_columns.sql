-- Add Paddle columns to profiles for Billing integration
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paddle_customer_id text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS paddle_subscription_id text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

COMMENT ON COLUMN public.profiles.paddle_customer_id IS 'Paddle Billing customer ID';
COMMENT ON COLUMN public.profiles.paddle_subscription_id IS 'Paddle Billing subscription ID (Standard_Global)';

