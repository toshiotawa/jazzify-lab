-- Backfill Apple FREE_TRIAL subscriptions where trial_used was not recorded.
-- Caused by apple-webhook only setting trial_used on OFFER_REDEEMED, not INITIAL_BUY + FREE_TRIAL.

WITH trial_events AS (
  SELECT DISTINCT ON (se.user_id)
    se.user_id,
    se.created_at AS trial_started_at
  FROM public.subscription_events se
  WHERE se.provider = 'apple'
    AND se.user_id IS NOT NULL
    AND (
      se.payload->'transactionInfo'->>'offerDiscountType' = 'FREE_TRIAL'
      OR se.event_type = 'OFFER_REDEEMED'
    )
  ORDER BY se.user_id, se.created_at ASC
),
updated_subscriptions AS (
  UPDATE public.subscriptions s
  SET
    trial_used = true,
    trial_used_at = COALESCE(s.trial_used_at, te.trial_started_at),
    updated_at = now()
  FROM trial_events te
  WHERE s.user_id = te.user_id
    AND s.provider = 'apple'
    AND s.trial_used = false
  RETURNING s.user_id, s.trial_used_at AS trial_started_at
)
INSERT INTO public.user_milestones (user_id, trial_start_at)
SELECT us.user_id, us.trial_started_at
FROM updated_subscriptions us
ON CONFLICT (user_id) DO UPDATE
SET trial_start_at = COALESCE(public.user_milestones.trial_start_at, EXCLUDED.trial_start_at),
    updated_at = now();
