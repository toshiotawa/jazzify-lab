-- Track signup client and auto-detected country at first profile creation
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_platform text;

DO $$ BEGIN
  ALTER TABLE public.profiles
    ADD CONSTRAINT profiles_signup_platform_chk
    CHECK (signup_platform IS NULL OR signup_platform IN ('web', 'ios'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMENT ON COLUMN public.profiles.signup_platform IS
  'Client at first profile creation: web | ios. Immutable after insert.';
COMMENT ON COLUMN public.profiles.country IS
  'ISO 3166-1 alpha-2 at signup (auto-detected). Used for billing/locale hints.';

CREATE OR REPLACE FUNCTION public.protect_profiles_signup_platform()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.signup_platform IS NOT NULL
     AND NEW.signup_platform IS DISTINCT FROM OLD.signup_platform THEN
    RAISE EXCEPTION 'signup_platform is immutable after insert';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_signup_platform_immutable ON public.profiles;
CREATE TRIGGER profiles_signup_platform_immutable
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profiles_signup_platform();
