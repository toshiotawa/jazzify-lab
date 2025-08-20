-- Cancel invites on join, cancel invites/requests on disband, and block disbanded guild joins

-- 1) Invite: block inviting from disbanded guild
create or replace function public.rpc_guild_invite(p_invitee_id uuid)
returns uuid
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _gid uuid;
  _inv_id uuid;
  _member_count integer;
  _disbanded boolean;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if public.is_current_user_free() then raise exception 'Free plan users cannot use guilds'; end if;
  select guild_id into _gid from public.guild_members where user_id = _uid;
  if _gid is null then raise exception 'You must be in a guild to invite'; end if;
  if exists(select 1 from public.guild_members where user_id = p_invitee_id) then raise exception 'Target already in a guild'; end if;

  select coalesce(disbanded, false) into _disbanded from public.guilds where id = _gid;
  if _disbanded then raise exception 'Guild is disbanded'; end if;

  select count(*) into _member_count from public.guild_members where guild_id = _gid;
  if _member_count >= 5 then raise exception 'Guild is full'; end if;

  insert into public.guild_invitations(guild_id, inviter_id, invitee_id, status)
  values(_gid, _uid, p_invitee_id, 'pending')
  returning id into _inv_id;
  return _inv_id;
end;
$$;

-- 2) Accept invitation: cancel other invites for the user; block disbanded guild
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
  if exists(select 1 from public.guilds where id = _row.guild_id and coalesce(disbanded, false)) then
    raise exception 'Guild is disbanded';
  end if;

  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 5 then raise exception 'Guild is full'; end if;

  update public.guild_invitations set status = 'accepted', updated_at = now() where id = p_invitation_id;
  insert into public.guild_members(guild_id, user_id, role) values(_row.guild_id, _uid, 'member');

  -- cancel my other pending join requests across all guilds
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where requester_id = _uid and status = 'pending';

  -- cancel my other pending invitations
  update public.guild_invitations set status = 'cancelled', updated_at = now()
    where invitee_id = _uid and status = 'pending' and id <> p_invitation_id;

  -- if full now, cancel other pending join requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 5 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
      where guild_id = _row.guild_id and status = 'pending';
  end if;
end;
$$;

-- 3) Request join: block disbanded guild
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
  if exists(select 1 from public.guilds where id = p_gid and coalesce(disbanded, false)) then
    raise exception 'Guild is disbanded';
  end if;
  select count(*) into _member_count from public.guild_members where guild_id = p_gid;
  if _member_count >= 5 then raise exception 'Guild is full'; end if;
  insert into public.guild_join_requests(guild_id, requester_id, status)
  values(p_gid, _uid, 'pending') returning id into _req_id;
  return _req_id;
end;
$$;

-- 4) Approve request: cancel invitee's other invites; block disbanded guild
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
  if exists(select 1 from public.guilds where id = _row.guild_id and coalesce(disbanded, false)) then
    raise exception 'Guild is disbanded';
  end if;
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 5 then raise exception 'Guild is full'; end if;
  update public.guild_join_requests set status = 'approved', updated_at = now() where id = p_request_id;
  insert into public.guild_members(guild_id, user_id, role) values(_row.guild_id, _row.requester_id, 'member');

  -- cancel requester's other pending join requests
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where requester_id = _row.requester_id and status = 'pending' and id <> p_request_id;

  -- cancel requester's other pending invitations
  update public.guild_invitations set status = 'cancelled', updated_at = now()
    where invitee_id = _row.requester_id and status = 'pending';

  -- if full now, cancel other pending join requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 5 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
      where guild_id = _row.guild_id and status = 'pending';
  end if;
end;
$$;

-- 5) Disband functions: cancel pending invites and join requests
create or replace function public.rpc_guild_disband_system(p_guild_id uuid)
returns void
language plpgsql security definer as $$
declare
  _new_name text;
begin
  _new_name := '解散したギルド(Quest Failed)-' || substr(replace(p_guild_id::text, '-', ''), 1, 8);
  update public.guilds set disbanded = true, name = _new_name, updated_at = now() where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;

  update public.guild_invitations set status = 'cancelled', updated_at = now()
    where guild_id = p_guild_id and status = 'pending';
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where guild_id = p_guild_id and status = 'pending';
end;
$$;

grant execute on function public.rpc_guild_disband_system(uuid) to anon, authenticated, service_role;

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

  update public.guilds set disbanded = true, name = '解散したギルド-Manual-' || substr(replace(p_guild_id::text, '-', ''), 1, 8), updated_at = now() where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;

  update public.guild_invitations set status = 'cancelled', updated_at = now()
    where guild_id = p_guild_id and status = 'pending';
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where guild_id = p_guild_id and status = 'pending';
end;
$$;

grant execute on function public.rpc_guild_disband_and_clear_members(uuid) to anon, authenticated;

