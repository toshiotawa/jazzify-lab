-- Rollback for 20250905090000_guild_fixes.sql
-- Reverts column additions, RLS policy changes, triggers, and RPC modifications

-- 1) Drop column added by the fixes (if present)
alter table if exists public.guilds
  drop column if exists disbanded;

-- 2) Restore RLS policy for guilds update (require leader both using and with check)
drop policy if exists guilds_update_leader on public.guilds;
create policy guilds_update_leader on public.guilds
  for update using (auth.uid() = leader_id) with check (auth.uid() = leader_id);

-- 3) Restore RLS policy for guild_members select (only self or leader of the guild)
drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members for select using (
  user_id = auth.uid() or exists(
    select 1 from public.guilds g
    where g.id = public.guild_members.guild_id and g.leader_id = auth.uid()
  )
);

-- 4) Remove trigger and helper function introduced by the fixes
drop trigger if exists trg_cancel_join_requests_if_full on public.guild_members;
drop function if exists public.fn_cancel_join_requests_if_full();

-- 5) Remove RPC for cancelling own join request
drop function if exists public.rpc_guild_cancel_my_join_request(uuid);

-- 6) Restore RPC: accept invitation (original behavior)
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
end;
$$;

-- 7) Restore RPC: approve join request (original behavior)
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
end;
$$;

-- 8) Restore RPC: disband and clear members (leader only; original behavior)
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

