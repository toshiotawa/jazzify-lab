-- Guild leave logs and helper RPCs for leave/disband; also extend kick RPC to log

create table if not exists public.guild_leave_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  guild_id uuid not null references public.guilds(id) on delete cascade,
  reason text not null check (reason in ('left','kicked','disbanded')),
  guild_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists guild_leave_logs_user_created_idx on public.guild_leave_logs(user_id, created_at desc);

alter table public.guild_leave_logs enable row level security;

drop policy if exists guild_leave_logs_select_own on public.guild_leave_logs;
create policy guild_leave_logs_select_own on public.guild_leave_logs for select using (user_id = auth.uid());

-- Users can insert their own leave log when leaving via client (fallback). Generally logs are written via RPCs below.
drop policy if exists guild_leave_logs_insert_self on public.guild_leave_logs;
create policy guild_leave_logs_insert_self on public.guild_leave_logs for insert with check (user_id = auth.uid());

-- RPC: Leave my guild with leader handover and logging
create or replace function public.rpc_guild_leave()
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _guild_id uuid;
  _role text;
  _next_leader uuid;
  _gname text;
  _members_count integer;
begin
  if _uid is null then raise exception 'Auth required'; end if;

  select gm.guild_id, gm.role, g.name into _guild_id, _role, _gname
  from public.guild_members gm
  join public.guilds g on g.id = gm.guild_id
  where gm.user_id = _uid
  limit 1;

  if _guild_id is null then raise exception 'Not in a guild'; end if;

  select count(*) into _members_count from public.guild_members where guild_id = _guild_id;

  if _members_count <= 1 then
    update public.guilds set disbanded = true, name = '解散したギルド', updated_at = now() where id = _guild_id;
    delete from public.guild_members where guild_id = _guild_id and user_id = _uid;
    insert into public.guild_leave_logs(user_id, guild_id, reason, guild_name)
    values(_uid, _guild_id, 'disbanded', coalesce(_gname, ''));
    return;
  end if;

  if _role = 'leader' then
    select user_id into _next_leader
    from public.guild_members
    where guild_id = _guild_id and user_id <> _uid
    order by joined_at asc
    limit 1;
    if _next_leader is null then
      raise exception 'No candidate for next leader';
    end if;
    update public.guilds set leader_id = _next_leader, updated_at = now() where id = _guild_id;
    update public.guild_members set role = 'leader' where guild_id = _guild_id and user_id = _next_leader;
  end if;

  delete from public.guild_members where guild_id = _guild_id and user_id = _uid;
  insert into public.guild_leave_logs(user_id, guild_id, reason, guild_name)
  values(_uid, _guild_id, 'left', coalesce(_gname, ''));
end;
$$;

grant execute on function public.rpc_guild_leave() to anon, authenticated;

-- RPC: Disband my guild (leader only), remove all members, and log for each
create or replace function public.rpc_guild_disband()
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _gid uuid;
  _gname text;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select id, name into _gid, _gname from public.guilds where leader_id = _uid;
  if _gid is null then raise exception 'Only leader can disband'; end if;

  update public.guilds set disbanded = true, name = '解散したギルド', updated_at = now() where id = _gid;

  -- Log for all current members
  insert into public.guild_leave_logs(user_id, guild_id, reason, guild_name)
  select gm.user_id, gm.guild_id, 'disbanded', coalesce(_gname, '') from public.guild_members gm where gm.guild_id = _gid;

  -- Remove all members
  delete from public.guild_members where guild_id = _gid;
end;
$$;

grant execute on function public.rpc_guild_disband() to anon, authenticated;

-- Extend kick RPC to log kicked user
create or replace function public.rpc_guild_kick_member(p_member_user_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _gid uuid;
  _gname text;
begin
  select id, name into _gid, _gname from public.guilds where leader_id = _uid;
  if _gid is null then raise exception 'Only leader can kick'; end if;
  if p_member_user_id = _uid then raise exception 'Leader cannot kick self via this RPC'; end if;

  delete from public.guild_members where guild_id = _gid and user_id = p_member_user_id;
  insert into public.guild_leave_logs(user_id, guild_id, reason, guild_name)
  values(p_member_user_id, _gid, 'kicked', coalesce(_gname, ''));
end;
$$;

grant execute on function public.rpc_guild_kick_member(uuid) to anon, authenticated;

