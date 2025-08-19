-- Fixes: disbanded col, RLS for member visibility, join request cancellations, leader transfer, counts

-- 1) Add disbanded column if missing
alter table if exists public.guilds
  add column if not exists disbanded boolean not null default false;

-- 2) RLS: members can see all members of their own guild
drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members for select using (
  user_id = auth.uid() or
  exists(
    select 1 from public.guild_members gm2
    where gm2.guild_id = public.guild_members.guild_id
      and gm2.user_id = auth.uid()
  )
);

-- Allow members to delete their own membership (leave)
drop policy if exists guild_members_delete_self on public.guild_members;
create policy guild_members_delete_self on public.guild_members for delete using (
  user_id = auth.uid()
);

-- 3) RPC: member count for outsiders
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

-- 4) RPC: cancel my join request
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

-- 5) RPC: transfer leadership (definer to bypass with check) - FIXED ARGUMENTS
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

-- 6) Allow last non-leader to disband via existing RPC
create or replace function public.rpc_guild_disband_and_clear_members(p_guild_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _leader uuid;
  _mc integer;
  _is_member boolean;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select leader_id into _leader from public.guilds where id = p_guild_id;
  if _leader is null then raise exception 'Guild not found'; end if;
  select count(*) into _mc from public.guild_members where guild_id = p_guild_id;
  select exists(select 1 from public.guild_members where guild_id = p_guild_id and user_id = _uid) into _is_member;
  if current_user <> 'service_role' then
    if _leader <> _uid then
      -- permit if user is the only member
      if not (_is_member and _mc = 1) then
        raise exception 'Only leader can disband';
      end if;
    end if;
  end if;
  update public.guilds set disbanded = true, name = '解散したギルド', updated_at = now() where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;
end;
$$;
grant execute on function public.rpc_guild_disband_and_clear_members(uuid) to anon, authenticated;

-- 7) When adding members via RPCs, cancel others
create or replace function public.rpc_guild_accept_invitation(p_invitation_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _row record;
  _member_count integer;
begin
  select * into _row from public.guild_invitations where id = p_invitation_id and status = 'pending';
  if not found then raise exception 'Invitation not found or not pending'; end if;
  if _row.invitee_id <> _uid then raise exception 'Only invitee can accept'; end if;
  if exists(select 1 from public.guild_members where user_id = _uid) then raise exception 'Already in a guild'; end if;
  if public.is_current_user_free() then raise exception 'Free plan users cannot use guilds'; end if;
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 5 then raise exception 'Guild is full'; end if;

  update public.guild_invitations set status = 'accepted', updated_at = now() where id = p_invitation_id;
  insert into public.guild_members(guild_id, user_id, role) values(_row.guild_id, _uid, 'member');

  -- cancel my other pending join requests across all guilds
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where requester_id = _uid and status = 'pending';

  -- if full now, cancel other pending join requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 5 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
      where guild_id = _row.guild_id and status = 'pending';
  end if;
end;
$$;
grant execute on function public.rpc_guild_accept_invitation(uuid) to anon, authenticated;

create or replace function public.rpc_guild_approve_request(p_request_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _row record;
  _member_count integer;
begin
  select * into _row from public.guild_join_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request not found or not pending'; end if;
  if not exists(select 1 from public.guilds g where g.id = _row.guild_id and g.leader_id = _uid) then
    raise exception 'Only leader can approve';
  end if;
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 5 then raise exception 'Guild is full'; end if;
  update public.guild_join_requests set status = 'approved', updated_at = now() where id = p_request_id;
  insert into public.guild_members(guild_id, user_id, role) values(_row.guild_id, _row.requester_id, 'member');

  -- cancel requester's other pending join requests
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where requester_id = _row.requester_id and status = 'pending' and id <> p_request_id;

  -- if full now, cancel other pending join requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 5 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
      where guild_id = _row.guild_id and status = 'pending';
  end if;
end;
$$;
grant execute on function public.rpc_guild_approve_request(uuid) to anon, authenticated;

-- Also cancel any of creator's pending join requests upon creating a guild
create or replace function public.rpc_guild_create(p_name text, p_type text)
returns uuid
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _gid uuid;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if public.is_current_user_free() then raise exception 'Free plan users cannot use guilds'; end if;
  if exists(select 1 from public.guild_members where user_id = _uid) then raise exception 'Already in a guild'; end if;
  if p_type is null or p_type not in ('casual','challenge') then raise exception 'Invalid guild type'; end if;
  insert into public.guilds(name, leader_id, guild_type) values(p_name, _uid, p_type) returning id into _gid;
  insert into public.guild_members(guild_id, user_id, role) values(_gid, _uid, 'leader');
  update public.guild_join_requests set status = 'cancelled', updated_at = now() where requester_id = _uid and status = 'pending';
  return _gid;
end;
$$;
grant execute on function public.rpc_guild_create(text, text) to anon, authenticated;

