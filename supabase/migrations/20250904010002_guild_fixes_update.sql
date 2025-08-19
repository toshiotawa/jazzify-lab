-- Fix for guild system issues after initial migration

-- 1) Fix RLS policy for guild_members to allow proper visibility
drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members for select using (
  user_id = auth.uid() or
  exists(
    select 1 from public.guild_members gm2
    where gm2.guild_id = public.guild_members.guild_id
      and gm2.user_id = auth.uid()
  )
);

-- 2) Fix RPC function name and parameters
drop function if exists public.rpc_guild_transfer_leader(uuid, uuid);
create or replace function public.rpc_guild_transfer_leader(p_old_leader_id uuid, p_guild_id uuid, p_new_leader_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if not exists(select 1 from public.guilds where id = p_guild_id and leader_id = _uid) then
    raise exception 'Only current leader can transfer leadership';
  end if;
  if not exists(select 1 from public.guild_members where guild_id = p_guild_id and user_id = p_new_leader_id) then
    raise exception 'New leader must be a member of the guild';
  end if;

  update public.guilds set leader_id = p_new_leader_id, updated_at = now() where id = p_guild_id;
  update public.guild_members set role = 'member' where guild_id = p_guild_id and user_id = p_old_leader_id;
  update public.guild_members set role = 'leader' where guild_id = p_guild_id and user_id = p_new_leader_id;
end;
$$;
grant execute on function public.rpc_guild_transfer_leader(uuid, uuid, uuid) to anon, authenticated;

-- 3) Fix RPC function name for canceling join requests
drop function if exists public.rpc_guild_cancel_my_join_request(uuid);
create or replace function public.rpc_guild_cancel_join_request(p_request_id uuid)
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
grant execute on function public.rpc_guild_cancel_join_request(uuid) to anon, authenticated;

-- 4) Ensure proper RLS for guild_join_requests
drop policy if exists guild_join_requests_select_own on public.guild_join_requests;
create policy guild_join_requests_select_own on public.guild_join_requests for select using (
  requester_id = auth.uid() or
  exists(
    select 1 from public.guilds g
    join public.guild_members gm on g.id = gm.guild_id
    where g.id = public.guild_join_requests.guild_id
      and gm.user_id = auth.uid()
      and g.leader_id = auth.uid()
  )
);

-- 5) Ensure proper RLS for guilds
drop policy if exists guilds_select_all on public.guilds;
create policy guilds_select_all on public.guilds for select using (true);

-- 6) Ensure proper RLS for guild_members insert/update
drop policy if exists guild_members_insert_leader on public.guild_members;
create policy guild_members_insert_leader on public.guild_members for insert with check (
  exists(
    select 1 from public.guilds g
    where g.id = guild_id
      and g.leader_id = auth.uid()
  )
);

drop policy if exists guild_members_update_leader on public.guild_members;
create policy guild_members_update_leader on public.guild_members for update using (
  exists(
    select 1 from public.guilds g
    where g.id = guild_id
      and g.leader_id = auth.uid()
  )
); 