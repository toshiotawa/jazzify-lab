-- Guild fixes: RLS for member visibility, join request cancel flows, leader leave RPC, member count RPC

-- 1) RLS: allow all members of the same guild to view the full membership list
do $$ begin
  if exists(select 1 from pg_policies where schemaname='public' and tablename='guild_members' and policyname='guild_members_select_visible') then
    drop policy guild_members_select_visible on public.guild_members;
  end if;
end $$;

create policy guild_members_select_same_guild on public.guild_members
  for select using (
    exists(
      select 1 from public.guild_members gm
      where gm.guild_id = guild_members.guild_id and gm.user_id = auth.uid()
    )
  );

-- 2) RPC: requester cancels own join request
create or replace function public.rpc_guild_cancel_my_request(p_request_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _row record;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select * into _row from public.guild_join_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request not found or not pending'; end if;
  if _row.requester_id <> _uid then raise exception 'Only requester can cancel'; end if;
  update public.guild_join_requests set status = 'cancelled', updated_at = now() where id = p_request_id;
end;
$$;

grant execute on function public.rpc_guild_cancel_my_request(uuid) to anon, authenticated;

-- 3) Trigger: when a user joins any guild, cancel all of their other pending requests
--    and when a guild reaches capacity (>=5), cancel all pending requests to that guild
create or replace function public.trg_cancel_requests_on_join()
returns trigger
language plpgsql security definer as $$
declare
  _member_count integer;
begin
  -- cancel all other pending requests by this user
  update public.guild_join_requests
    set status = 'cancelled', updated_at = now()
    where requester_id = new.user_id and status = 'pending';

  -- if the guild becomes full (>=5), cancel all pending requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = new.guild_id;
  if _member_count >= 5 then
    update public.guild_join_requests
      set status = 'cancelled', updated_at = now()
      where guild_id = new.guild_id and status = 'pending';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_cancel_requests_on_join on public.guild_members;
create trigger trg_cancel_requests_on_join
after insert on public.guild_members
for each row execute function public.trg_cancel_requests_on_join();

-- 4) RPC: leader leaves the guild (transfer leadership to earliest joined member, or disband if last member)
create or replace function public.rpc_guild_leader_leave(p_guild_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _leader uuid;
  _next_leader uuid;
  _member_count integer;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select leader_id into _leader from public.guilds where id = p_guild_id;
  if _leader is null then raise exception 'Guild not found'; end if;
  if _leader <> _uid then raise exception 'Only leader can leave via this RPC'; end if;

  select count(*) into _member_count from public.guild_members where guild_id = p_guild_id;
  if _member_count <= 1 then
    perform public.rpc_guild_disband_and_clear_members(p_guild_id);
    return;
  end if;

  -- choose earliest joined member (excluding current leader)
  select user_id into _next_leader
  from public.guild_members
  where guild_id = p_guild_id and user_id <> _uid
  order by joined_at asc
  limit 1;
  if _next_leader is null then raise exception 'No candidate for leadership'; end if;

  -- transfer leader and update roles
  update public.guilds set leader_id = _next_leader, updated_at = now() where id = p_guild_id;
  update public.guild_members set role = 'leader' where guild_id = p_guild_id and user_id = _next_leader;
  delete from public.guild_members where guild_id = p_guild_id and user_id = _uid;
end;
$$;

grant execute on function public.rpc_guild_leader_leave(uuid) to anon, authenticated;

-- 5) RPC: public member count for outsiders (security definer)
create or replace function public.rpc_get_guild_member_count(p_guild_id uuid)
returns integer
language plpgsql security definer as $$
declare
  _cnt integer;
begin
  select count(*) into _cnt from public.guild_members where guild_id = p_guild_id;
  return _cnt;
end;
$$;

grant execute on function public.rpc_get_guild_member_count(uuid) to anon, authenticated;

