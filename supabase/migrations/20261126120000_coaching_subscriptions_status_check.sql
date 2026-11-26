alter table public.coaching_subscriptions
  drop constraint if exists coaching_subscriptions_status_check;

alter table public.coaching_subscriptions
  add constraint coaching_subscriptions_status_check check (
    status in ('trial', 'active', 'grace', 'billing_retry', 'past_due', 'expired', 'canceled')
  );