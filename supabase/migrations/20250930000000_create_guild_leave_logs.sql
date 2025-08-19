-- Guild leave logs
create table if not exists public.guild_leave_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  guild_name text not null,
  reason text not null check (reason in ('leave','kick','disband')),
  created_at timestamp with time zone default now()
);

alter table public.guild_leave_logs enable row level security;

create policy "guild_leave_select_own" on public.guild_leave_logs
  for select using (auth.uid() = user_id);

create policy "guild_leave_insert_any" on public.guild_leave_logs
  for insert with check (true);

grant all on table public.guild_leave_logs to anon, authenticated, service_role;
