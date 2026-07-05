-- signup_platform: default to web on insert (client omission / stale JS bundle insurance)
-- and backfill legacy web profiles that omitted signup_platform + country.

ALTER TABLE public.profiles
  ALTER COLUMN signup_platform SET DEFAULT 'web';

CREATE OR REPLACE FUNCTION public.default_profiles_signup_platform()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.signup_platform IS NULL THEN
    NEW.signup_platform := 'web';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_signup_platform_default ON public.profiles;
CREATE TRIGGER profiles_signup_platform_default
  BEFORE INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.default_profiles_signup_platform();

-- Backfill web signups that omitted signup_platform (pre-tracking or cached old bundle).
-- Heuristic: NULL platform + NULL country; Apple-billed users were already set to ios.
UPDATE public.profiles p
SET signup_platform = 'web'
WHERE p.signup_platform IS NULL
  AND p.country IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p.id
      AND s.provider = 'apple'
  );

COMMENT ON COLUMN public.profiles.signup_platform IS
  'Client at first profile creation: web | ios. Defaults to web on insert. Immutable after insert.';
