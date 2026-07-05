-- Remaining pre-tracking profiles have country (geo backfill) but NULL signup_platform.
UPDATE public.profiles p
SET signup_platform = 'web'
WHERE p.signup_platform IS NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.subscriptions s
    WHERE s.user_id = p.id
      AND s.provider = 'apple'
  );
