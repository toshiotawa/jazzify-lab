-- Guild fixes: add disbanded column, relax RLS for leader transfer, widen member visibility, join-request utilities

-- 1) Add disbanded column if missing
alter table if exists public.guilds
  add column if not exists disbanded boolean not null default false;

-- 2) RLS: allow leader to update row even when transferring leadership (WITH CHECK TRUE)
drop policy if exists guilds_update_leader on public.guilds;
create policy guilds_update_leader on public.guilds
  for update using (auth.uid() = leader_id) with check (true);

-- 3) RLS: allow any member of a guild to see all rows of their guild_members
drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members for select using (
  exists(
    select 1 from public.guild_members gm2
    where gm2.guild_id = public.guild_members.guild_id and gm2.user_id = auth.uid()
  )
);

-- 4) RPC: allow sole remaining non-leader member to disband
create or replace function public.rpc_guild_disband_and_clear_members(p_guild_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _leader uuid;
  _member_count integer;
  _only_member uuid;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select leader_id into _leader from public.guilds where id = p_guild_id;
  if _leader is null then raise exception 'Guild not found'; end if;

  select count(*), (select user_id from public.guild_members where guild_id = p_guild_id limit 1)
    into _member_count, _only_member from public.guild_members where guild_id = p_guild_id;

  if current_user <> 'service_role' and _leader <> _uid then
    -- Permit disband when caller is the sole remaining member
    if _member_count = 1 and _only_member = _uid then
      -- ok
    else
      raise exception 'Only leader can disband';
    end if;
  end if;

  update public.guilds set disbanded = true, name = '解散したギルド', updated_at = now() where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;
end;
$$;

grant execute on function public.rpc_guild_disband_and_clear_members(uuid) to anon, authenticated;

-- 5) Cancel pending join-requests automatically when guild becomes full (>=5)
create or replace function public.fn_cancel_join_requests_if_full()
returns trigger
language plpgsql security definer as $$
declare
  _count integer;
begin
  select count(*) into _count from public.guild_members where guild_id = new.guild_id;
  if _count >= 5 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where guild_id = new.guild_id and status = 'pending';
  end if;
  -- Also cancel all other pending requests by the user who just joined any guild
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
  where requester_id = new.user_id and status = 'pending';
  return null;
end;
$$;

drop trigger if exists trg_cancel_join_requests_if_full on public.guild_members;
create trigger trg_cancel_join_requests_if_full
after insert on public.guild_members
for each row execute function public.fn_cancel_join_requests_if_full();

-- 6) RPC: user can cancel own pending join request for a guild
create or replace function public.rpc_guild_cancel_my_join_request(p_gid uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Auth required'; end if;
  update public.guild_join_requests
    set status = 'cancelled', updated_at = now()
    where guild_id = p_gid and requester_id = _uid and status = 'pending';
end;
$$;

grant execute on function public.rpc_guild_cancel_my_join_request(uuid) to anon, authenticated;

-- 7) Update invitation and approve-request RPCs to auto-cancel other pending join-requests
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

  -- cancel all other pending join requests by this user
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
  where requester_id = _uid and status = 'pending';
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

  -- cancel other pending join requests by this user to different guilds
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
  where requester_id = _row.requester_id and status = 'pending' and guild_id <> _row.guild_id;
end;
$$;

grant execute on function public.rpc_guild_approve_request(uuid) to anon, authenticated;

