-- Fix subscriptions rows where Lemon profile status is cancelled but subscriptions still show active.
-- Caused by subscription_updated(cancelled) falling through to active before webhook mapping fix.

UPDATE public.subscriptions s
SET
  status = CASE
    WHEN s.current_period_ends_at IS NOT NULL AND s.current_period_ends_at > now() THEN 'canceled'
    ELSE 'expired'
  END,
  entitlement_state = CASE
    WHEN s.current_period_ends_at IS NOT NULL AND s.current_period_ends_at > now()
      THEN 'cancelled_but_active_until_end'
    ELSE 'expired'
  END,
  updated_at = now()
FROM public.profiles p
WHERE s.user_id = p.id
  AND s.provider = 'lemon'
  AND p.lemon_subscription_status = 'cancelled'
  AND s.status = 'active'
  AND s.entitlement_state = 'active';

UPDATE public.profiles p
SET
  rank = 'free',
  updated_at = now()
FROM public.subscriptions s
WHERE p.id = s.user_id
  AND s.provider = 'lemon'
  AND p.lemon_subscription_status = 'cancelled'
  AND s.entitlement_state = 'expired'
  AND p.rank <> 'free';
