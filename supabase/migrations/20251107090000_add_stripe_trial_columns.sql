-- Add Stripe trial period tracking columns to profiles table

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'stripe_trial_start'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN stripe_trial_start timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'stripe_trial_end'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN stripe_trial_end timestamptz;
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.stripe_trial_start IS 'Timestamp when the current Stripe trial period began';
COMMENT ON COLUMN public.profiles.stripe_trial_end IS 'Timestamp when the current Stripe trial period ends';
