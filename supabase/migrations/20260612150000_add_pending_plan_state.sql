-- 予約プラン変更の状態機械カラムと webhook 巻き戻り防御カラムを追加
alter table public.subscriptions
  add column if not exists pending_provider_variant_id text,
  add column if not exists pending_from_provider_variant_id text,
  add column if not exists pending_effective_at_snapshot timestamptz,
  add column if not exists pending_status text,
  add column if not exists pending_locked_at timestamptz,
  add column if not exists pending_failed_reason text,
  add column if not exists pending_attempts integer not null default 0,
  add column if not exists last_pending_plan_applied_at timestamptz,
  add column if not exists last_pending_plan_cancelled_at timestamptz,
  add column if not exists provider_updated_at timestamptz;

alter table public.subscriptions
  drop constraint if exists subscriptions_pending_status_check;

alter table public.subscriptions
  add constraint subscriptions_pending_status_check
  check (pending_status is null or pending_status in ('scheduled', 'applying', 'failed'));

comment on column public.subscriptions.pending_status is '自前予約プラン変更の状態。null=予約なし / scheduled / applying / failed。applied・cancelled は subscription_events に監査ログとして記録し、本テーブルには残さない。';
comment on column public.subscriptions.provider_updated_at is 'Lemon Subscription object の attributes.updated_at のミラー。古い webhook による巻き戻り防御に使用。';
