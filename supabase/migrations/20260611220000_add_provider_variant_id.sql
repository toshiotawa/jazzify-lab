ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS provider_variant_id text;
