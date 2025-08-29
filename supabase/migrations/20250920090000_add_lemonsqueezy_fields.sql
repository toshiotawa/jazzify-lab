-- Lemon Squeezy 連携用の列を profiles に追加
-- 注意: 直接SQL編集禁止のため、このファイルはSupabase CLI経由で適用してください

alter table public.profiles
  add column if not exists lemon_customer_id text,
  add column if not exists lemon_subscription_id text,
  add column if not exists lemon_subscription_status text,
  add column if not exists lemon_trial_used boolean default false;

-- インデックス
create index if not exists idx_profiles_lemon_customer_id on public.profiles (lemon_customer_id);
create index if not exists idx_profiles_lemon_subscription_id on public.profiles (lemon_subscription_id);


