-- Guild quest enforcement and leave feedback logging

-- Leave feedback table
create table if not exists public.guild_leave_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  previous_guild_id uuid references public.guilds(id) on delete set null,
  previous_guild_name text not null,
  leave_type text not null check (leave_type in ('left','kicked','disband')),
  reason text not null,
  created_at timestamptz not null default now()
);

comment on table public.guild_leave_feedback is 'User-submitted reasons for leaving the last joined guild';

alter table public.guild_leave_feedback enable row level security;

drop policy if exists guild_leave_feedback_insert_self on public.guild_leave_feedback;
create policy guild_leave_feedback_insert_self on public.guild_leave_feedback
  for insert with check (auth.uid() = user_id);

-- RPC to submit feedback
create or replace function public.rpc_submit_guild_leave_feedback(
  p_prev_guild_id uuid,
  p_prev_guild_name text,
  p_leave_type text,
  p_reason text
)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if p_prev_guild_name is null or length(trim(p_prev_guild_name)) = 0 then raise exception 'previous guild name required'; end if;
  if p_leave_type is null or p_leave_type not in ('left','kicked','disband') then raise exception 'invalid leave_type'; end if;
  if p_reason is null or length(trim(p_reason)) = 0 then raise exception 'reason required'; end if;
  insert into public.guild_leave_feedback(user_id, previous_guild_id, previous_guild_name, leave_type, reason)
  values(_uid, p_prev_guild_id, p_prev_guild_name, p_leave_type, p_reason);
end;
$$;

grant execute on function public.rpc_submit_guild_leave_feedback(uuid, text, text, text) to anon, authenticated;

-- Disband a guild and clear members
create or replace function public.rpc_guild_disband_and_clear_members(p_guild_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _leader uuid;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select leader_id into _leader from public.guilds where id = p_guild_id;
  if _leader is null then raise exception 'Guild not found'; end if;
  if current_user <> 'service_role' and _leader <> _uid then
    raise exception 'Only leader can disband';
  end if;
  update public.guilds set disbanded = true, name = '解散したギルド', updated_at = now() where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;
end;
$$;

grant execute on function public.rpc_guild_disband_and_clear_members(uuid) to anon, authenticated;

-- Enforce monthly quest: if previous month XP < 1,000,000 for challenge guilds, disband
create or replace function public.rpc_guild_enforce_monthly_quest(p_month date default date_trunc('month', now())::date)
returns void
language plpgsql security definer as $$
declare
  _target_month date := date_trunc('month', p_month);
  _prev_month date := (date_trunc('month', p_month) - interval '1 day')::date;
  _prev_month_first date := date_trunc('month', _prev_month);
  _gid uuid;
  _xp bigint;
  _rec record;
begin
  for _rec in (
    select g.id as guild_id
    from public.guilds g
    where coalesce(g.guild_type, 'casual') = 'challenge'
  ) loop
    _gid := _rec.guild_id;
    select coalesce(sum(c.gained_xp), 0) into _xp
    from public.guild_xp_contributions c
    where c.guild_id = _gid and c.month = _prev_month_first;
    if _xp < 1000000 then
      perform public.rpc_guild_disband_and_clear_members(_gid);
    end if;
  end loop;
end;
$$;

grant execute on function public.rpc_guild_enforce_monthly_quest(date) to anon, authenticated;

