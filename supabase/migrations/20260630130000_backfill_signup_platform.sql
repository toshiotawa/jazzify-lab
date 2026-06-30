-- Best-effort backfill for existing profiles created before signup_platform tracking.
-- Conservative: only Apple billing subscribers are inferred as ios; others stay NULL.

UPDATE public.profiles p
SET signup_platform = 'ios'
WHERE p.signup_platform IS NULL
  AND EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p.id
      AND s.provider = 'apple'
  );

-- Normalize legacy non-ISO country values where unambiguous.
UPDATE public.profiles
SET country = 'JP'
WHERE country IS NOT NULL
  AND lower(trim(country)) = 'japan';

COMMENT ON COLUMN public.profiles.signup_platform IS
  'Client at first profile creation: web | ios. Immutable after insert. NULL = unknown (pre-tracking or no signal).';
