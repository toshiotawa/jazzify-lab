-- Member cap temporary update: 2 members

-- Invite: enforce cap 2
create or replace function public.rpc_guild_invite(p_invitee_id uuid)
returns uuid
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _gid uuid;
  _inv_id uuid;
  _member_count integer;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if public.is_current_user_free() then raise exception 'Free plan users cannot use guilds'; end if;
  select guild_id into _gid from public.guild_members where user_id = _uid;
  if _gid is null then raise exception 'You must be in a guild to invite'; end if;
  if exists(select 1 from public.guild_members where user_id = p_invitee_id) then raise exception 'Target already in a guild'; end if;

  select count(*) into _member_count from public.guild_members where guild_id = _gid;
  if _member_count >= 2 then raise exception 'Guild is full'; end if;

  insert into public.guild_invitations(guild_id, inviter_id, invitee_id, status)
  values(_gid, _uid, p_invitee_id, 'pending')
  returning id into _inv_id;
  return _inv_id;
end;
$$;

-- Accept invitation: enforce cap 2 and cancel others when full
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
  if _member_count >= 2 then raise exception 'Guild is full'; end if;

  update public.guild_invitations set status = 'accepted', updated_at = now() where id = p_invitation_id;
  insert into public.guild_members(guild_id, user_id, role) values(_row.guild_id, _uid, 'member');

  -- cancel my other pending join requests across all guilds
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where requester_id = _uid and status = 'pending';

  -- if full now, cancel other pending join requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 2 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
      where guild_id = _row.guild_id and status = 'pending';
  end if;
end;
$$;

-- Request join: enforce cap 2
create or replace function public.rpc_guild_request_join(p_gid uuid)
returns uuid
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _req_id uuid;
  _member_count integer;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if public.is_current_user_free() then raise exception 'Free plan users cannot use guilds'; end if;
  if exists(select 1 from public.guild_members where user_id = _uid) then raise exception 'Already in a guild'; end if;
  select count(*) into _member_count from public.guild_members where guild_id = p_gid;
  if _member_count >= 2 then raise exception 'Guild is full'; end if;
  insert into public.guild_join_requests(guild_id, requester_id, status)
  values(p_gid, _uid, 'pending') returning id into _req_id;
  return _req_id;
end;
$$;

-- Approve request: enforce cap 2 and cancel others when full
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
  if _member_count >= 2 then raise exception 'Guild is full'; end if;
  update public.guild_join_requests set status = 'approved', updated_at = now() where id = p_request_id;
  insert into public.guild_members(guild_id, user_id, role) values(_row.guild_id, _row.requester_id, 'member');

  -- cancel requester's other pending join requests
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where requester_id = _row.requester_id and status = 'pending' and id <> p_request_id;

  -- if full now, cancel other pending join requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 2 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
      where guild_id = _row.guild_id and status = 'pending';
  end if;
end;
$$;

grant execute on function public.rpc_guild_invite(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_accept_invitation(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_request_join(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_approve_request(uuid) to anon, authenticated;

