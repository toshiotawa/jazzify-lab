-- 予約解約の状態機械カラム（プラン変更 pending と同型）
alter table public.subscriptions
  add column if not exists pending_cancel_effective_at timestamptz,
  add column if not exists pending_cancel_effective_at_snapshot timestamptz,
  add column if not exists pending_cancel_status text,
  add column if not exists pending_cancel_locked_at timestamptz,
  add column if not exists pending_cancel_failed_reason text,
  add column if not exists pending_cancel_attempts integer not null default 0,
  add column if not exists last_pending_cancel_applied_at timestamptz,
  add column if not exists last_pending_cancel_cleared_at timestamptz;

alter table public.subscriptions
  drop constraint if exists subscriptions_pending_cancel_status_check;

alter table public.subscriptions
  add constraint subscriptions_pending_cancel_status_check
  check (pending_cancel_status is null or pending_cancel_status in ('scheduled', 'applying', 'failed'));

comment on column public.subscriptions.pending_cancel_status is
  '自前予約解約の状態。null=予約なし / scheduled / applying / failed。applied・cleared は subscription_events に記録。';
