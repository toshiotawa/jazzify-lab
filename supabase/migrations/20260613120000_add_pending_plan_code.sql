ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS pending_plan_code text NULL,
  ADD COLUMN IF NOT EXISTS pending_plan_effective_at timestamptz NULL;

COMMENT ON COLUMN public.subscriptions.pending_plan_code IS
  'Plan code scheduled to take effect at pending_plan_effective_at (Lemon disable_prorations change).';
COMMENT ON COLUMN public.subscriptions.pending_plan_effective_at IS
  'When pending_plan_code becomes the active billing plan (typically current_period_ends_at).';
