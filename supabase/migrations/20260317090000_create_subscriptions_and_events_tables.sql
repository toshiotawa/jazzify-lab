-- Subscriptions table: single source of truth for billing state
CREATE TABLE public.subscriptions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL CHECK (provider IN ('apple', 'lemon', 'none')),
  provider_customer_id text,
  provider_subscription_id text,
  plan_code text NOT NULL,
  status text NOT NULL CHECK (
    status IN ('trial', 'active', 'grace', 'billing_retry', 'expired', 'canceled')
  ),
  trial_used boolean NOT NULL DEFAULT false,
  current_period_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX subscriptions_user_id_key ON public.subscriptions (user_id);
CREATE INDEX subscriptions_provider_sub_idx ON public.subscriptions (provider, provider_subscription_id);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Subscription events table: audit log for webhook events
CREATE TABLE public.subscription_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL,
  event_type text NOT NULL,
  provider_event_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX subscription_events_user_id_idx ON public.subscription_events (user_id);
CREATE INDEX subscription_events_provider_idx ON public.subscription_events (provider, event_type);

ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on subscriptions
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_subscriptions_updated_at();
