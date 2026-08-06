-- Web billing currency (JPY store vs USD store). Locked once Lemon billing history exists.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS billing_currency text;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_billing_currency_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_billing_currency_check
CHECK (billing_currency IS NULL OR billing_currency IN ('JPY', 'USD'));

COMMENT ON COLUMN public.profiles.billing_currency IS
  'Lemon Squeezy checkout currency. JPY for Japanese store, USD for English/global store. Locked after Lemon billing history.';

-- Backfill: existing Lemon subscribers stay on JPY; new EN users get USD.
UPDATE public.profiles p
SET billing_currency = CASE
  WHEN EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p.id
      AND s.provider = 'lemon'
  )
  OR (p.lemon_customer_id IS NOT NULL AND p.lemon_customer_id <> '')
  OR (p.lemon_subscription_id IS NOT NULL AND p.lemon_subscription_id <> '')
  THEN 'JPY'
  WHEN p.preferred_locale = 'en' THEN 'USD'
  ELSE 'JPY'
END
WHERE p.billing_currency IS NULL;

CREATE OR REPLACE FUNCTION public.derive_billing_currency_from_locale(locale text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN locale = 'en' THEN 'USD' ELSE 'JPY' END;
$$;

CREATE OR REPLACE FUNCTION public.profile_has_lemon_billing_history(p public.profiles)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p.id
      AND s.provider = 'lemon'
  )
  OR (p.lemon_customer_id IS NOT NULL AND p.lemon_customer_id <> '')
  OR (p.lemon_subscription_id IS NOT NULL AND p.lemon_subscription_id <> '');
$$;

CREATE OR REPLACE FUNCTION public.sync_profile_billing_currency()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF public.profile_has_lemon_billing_history(NEW) THEN
    IF TG_OP = 'UPDATE' AND OLD.billing_currency IS NOT NULL THEN
      NEW.billing_currency := OLD.billing_currency;
    ELSIF NEW.billing_currency IS NULL THEN
      NEW.billing_currency := 'JPY';
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT'
    OR (TG_OP = 'UPDATE' AND NEW.preferred_locale IS DISTINCT FROM OLD.preferred_locale)
  THEN
    NEW.billing_currency := public.derive_billing_currency_from_locale(NEW.preferred_locale);
  ELSIF NEW.billing_currency IS NULL THEN
    NEW.billing_currency := public.derive_billing_currency_from_locale(NEW.preferred_locale);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_profile_billing_currency_trigger ON public.profiles;

CREATE TRIGGER sync_profile_billing_currency_trigger
BEFORE INSERT OR UPDATE OF preferred_locale ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.sync_profile_billing_currency();
