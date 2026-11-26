-- Stripe / coaching billing foundations.

-- Core Premium stays in public.subscriptions. Coaching is a separate add-on

-- subscription so option events never overwrite profiles.rank.

alter table public.subscriptions

  drop constraint if exists subscriptions_provider_check;

alter table public.subscriptions

  add constraint subscriptions_provider_check

  check (provider in ('apple', 'lemon', 'stripe', 'gumroad', 'none'));

alter table public.subscriptions

  add column if not exists provider_product_id text,

  add column if not exists provider_price_id text,

  add column if not exists provider_price_lookup_key text,

  add column if not exists billing_currency text,

  add column if not exists billing_interval text,

  add column if not exists current_period_starts_at timestamptz,

  add column if not exists provider_status text;

alter table public.subscriptions

  drop constraint if exists subscriptions_billing_currency_check;

alter table public.subscriptions

  add constraint subscriptions_billing_currency_check

  check (billing_currency is null or billing_currency in ('JPY', 'USD'));

alter table public.subscriptions

  drop constraint if exists subscriptions_billing_interval_check;

alter table public.subscriptions

  add constraint subscriptions_billing_interval_check

  check (billing_interval is null or billing_interval in ('month', 'year'));

create index if not exists subscriptions_provider_price_lookup_idx

  on public.subscriptions (provider, provider_price_lookup_key);

alter table public.billing_customers

  drop constraint if exists billing_customers_provider_check;

alter table public.billing_customers

  add constraint billing_customers_provider_check

  check (provider in ('lemon', 'stripe', 'gumroad'));

alter table public.billing_subscriptions

  drop constraint if exists billing_subscriptions_provider_check;

alter table public.billing_subscriptions

  add constraint billing_subscriptions_provider_check

  check (provider in ('lemon', 'stripe', 'gumroad'));

alter table public.billing_invoices

  drop constraint if exists billing_invoices_provider_check;

alter table public.billing_invoices

  add constraint billing_invoices_provider_check

  check (provider in ('lemon', 'stripe', 'gumroad'));

alter table public.subscription_events

  add column if not exists livemode boolean,

  add column if not exists processing_status text not null default 'processed',

  add column if not exists processed_at timestamptz,

  add column if not exists processing_error text;

alter table public.subscription_events

  drop constraint if exists subscription_events_processing_status_check;

alter table public.subscription_events

  add constraint subscription_events_processing_status_check

  check (processing_status in ('received', 'processed', 'ignored', 'failed'));

create unique index if not exists subscription_events_stripe_event_unique

  on public.subscription_events (provider, provider_event_id)

  where provider = 'stripe' and provider_event_id is not null;

create table if not exists public.checkout_intents (

  id uuid primary key default gen_random_uuid(),

  user_id uuid not null references auth.users(id) on delete cascade,

  provider text not null check (provider in ('stripe', 'gumroad')),

  product_kind text not null check (product_kind in ('premium', 'coaching')),

  plan_code text not null,

  price_lookup_key text not null,

  provider_customer_id text,

  provider_checkout_session_id text,

  status text not null default 'created'

    check (status in ('created', 'checkout_created', 'completed', 'failed', 'expired')),

  livemode boolean not null default false,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  expires_at timestamptz not null default (now() + interval '30 minutes'),

  completed_at timestamptz,

  metadata jsonb not null default '{}'::jsonb

);

create unique index if not exists checkout_intents_provider_session_unique

  on public.checkout_intents (provider, provider_checkout_session_id)

  where provider_checkout_session_id is not null;

create index if not exists checkout_intents_user_created_idx

  on public.checkout_intents (user_id, created_at desc);

alter table public.checkout_intents enable row level security;

drop policy if exists "users_read_own_checkout_intents" on public.checkout_intents;

create policy "users_read_own_checkout_intents"

  on public.checkout_intents for select to authenticated

  using ((select auth.uid()) = user_id);

create table if not exists public.coaching_subscriptions (

  id bigint generated always as identity primary key,

  user_id uuid not null references auth.users(id) on delete cascade,

  provider text not null check (provider in ('stripe', 'gumroad')),

  provider_customer_id text,

  provider_subscription_id text not null,

  provider_product_id text,

  provider_price_id text,

  provider_price_lookup_key text,

  status text not null,

  entitlement_state text not null check (

    entitlement_state in (

      'active',

      'payment_issue_with_access',

      'payment_issue_no_access',

      'cancelled_but_active_until_end',

      'expired'

    )

  ),

  billing_currency text check (billing_currency is null or billing_currency in ('JPY', 'USD')),

  billing_interval text check (billing_interval is null or billing_interval in ('month', 'year')),

  current_period_starts_at timestamptz,

  current_period_ends_at timestamptz,

  pending_cancel_effective_at timestamptz,

  pending_cancel_status text check (

    pending_cancel_status is null or pending_cancel_status in ('scheduled', 'applying', 'failed')

  ),

  livemode boolean,

  last_verified_at timestamptz,

  provider_updated_at timestamptz,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique (provider, provider_subscription_id)

);

create unique index if not exists coaching_subscriptions_one_current_per_user

  on public.coaching_subscriptions (user_id)

  where entitlement_state in (

    'active',

    'payment_issue_with_access',

    'cancelled_but_active_until_end'

  );

create index if not exists coaching_subscriptions_user_created_idx

  on public.coaching_subscriptions (user_id, created_at desc);

alter table public.coaching_subscriptions enable row level security;

drop policy if exists "users_read_own_coaching_subscription" on public.coaching_subscriptions;

create policy "users_read_own_coaching_subscription"

  on public.coaching_subscriptions for select to authenticated

  using ((select auth.uid()) = user_id);

drop trigger if exists checkout_intents_updated_at on public.checkout_intents;

create trigger checkout_intents_updated_at

  before update on public.checkout_intents

  for each row execute function public.update_billing_tables_updated_at();

drop trigger if exists coaching_subscriptions_updated_at on public.coaching_subscriptions;

create trigger coaching_subscriptions_updated_at

  before update on public.coaching_subscriptions

  for each row execute function public.update_billing_tables_updated_at();
