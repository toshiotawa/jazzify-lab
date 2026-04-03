-- 課金プロバイダの raw status と利用可否を分離する
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS entitlement_state text NOT NULL DEFAULT 'active';

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_status_check CHECK (
  status IN (
    'trial',
    'active',
    'grace',
    'billing_retry',
    'past_due',
    'expired',
    'canceled'
  )
);

ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_entitlement_state_check CHECK (
  entitlement_state IN (
    'active',
    'payment_issue_with_access',
    'payment_issue_no_access',
    'cancelled_but_active_until_end',
    'expired'
  )
);

-- 既存データのバックフィル
UPDATE public.subscriptions
SET
  status = CASE
    WHEN provider = 'lemon' AND status = 'billing_retry' THEN 'past_due'
    ELSE status
  END,
  entitlement_state = CASE
    WHEN status IN ('trial', 'active', 'grace') THEN 'active'
    WHEN status = 'billing_retry' AND provider = 'apple' THEN 'payment_issue_no_access'
    WHEN provider = 'lemon' AND status = 'billing_retry' THEN 'payment_issue_with_access'
    WHEN status = 'canceled' AND current_period_ends_at IS NOT NULL AND current_period_ends_at > now()
      THEN 'cancelled_but_active_until_end'
    WHEN status = 'canceled' THEN 'expired'
    WHEN status = 'expired' THEN 'expired'
    ELSE 'active'
  END
WHERE true;

-- past_due 行の entitlement（上の UPDATE で billing_retry が past_due に変わった行は別 UPDATE が必要なため再実行）
UPDATE public.subscriptions
SET entitlement_state = CASE
  WHEN status IN ('trial', 'active', 'grace') THEN 'active'
  WHEN status = 'billing_retry' AND provider = 'apple' THEN 'payment_issue_no_access'
  WHEN status = 'past_due' AND provider = 'lemon' THEN 'payment_issue_with_access'
  WHEN status = 'canceled' AND current_period_ends_at IS NOT NULL AND current_period_ends_at > now()
    THEN 'cancelled_but_active_until_end'
  WHEN status = 'canceled' THEN 'expired'
  WHEN status = 'expired' THEN 'expired'
  ELSE entitlement_state
END;

-- profiles.rank を購読の利用権に同期（rank は membership_rank enum）
UPDATE public.profiles p
SET rank = CASE
  WHEN s.entitlement_state IN (
    'active',
    'payment_issue_with_access',
    'cancelled_but_active_until_end'
  ) AND s.provider = 'apple' THEN 'standard'::public.membership_rank
  WHEN s.entitlement_state IN (
    'active',
    'payment_issue_with_access',
    'cancelled_but_active_until_end'
  ) AND s.provider = 'lemon' THEN 'standard_global'::public.membership_rank
  ELSE 'free'::public.membership_rank
END
FROM public.subscriptions s
WHERE p.id = s.user_id;
