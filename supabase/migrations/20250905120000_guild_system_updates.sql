-- Guild system updates: visibility, cancellation, disbanded column, feedback optional

-- Add disbanded column if missing
alter table public.guilds
  add column if not exists disbanded boolean not null default false;

-- Allow all guild members to view other members
drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members
  for select using (
    exists(select 1 from public.guild_members gm where gm.guild_id = guild_members.guild_id and gm.user_id = auth.uid())
  );

-- Allow leader to transfer leadership
drop policy if exists guilds_update_leader on public.guilds;
create policy guilds_update_leader on public.guilds
  for update using (auth.uid() = leader_id)
  with check (true);

-- Make leave feedback reason optional
alter table public.guild_leave_feedback
  alter column reason drop not null;

drop function if exists public.rpc_submit_guild_leave_feedback(uuid, text, text, text);
create or replace function public.rpc_submit_guild_leave_feedback(
  p_prev_guild_id uuid,
  p_prev_guild_name text,
  p_leave_type text,
  p_reason text default null
)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if p_prev_guild_name is null or length(trim(p_prev_guild_name)) = 0 then raise exception 'previous guild name required'; end if;
  if p_leave_type is null or p_leave_type not in ('left','kicked','disband') then raise exception 'invalid leave_type'; end if;
  insert into public.guild_leave_feedback(user_id, previous_guild_id, previous_guild_name, leave_type, reason)
  values(_uid, p_prev_guild_id, p_prev_guild_name, p_leave_type, p_reason);
end;
$$;
grant execute on function public.rpc_submit_guild_leave_feedback(uuid, text, text, text) to anon, authenticated;

-- Cancel a specific join request by requester
create or replace function public.rpc_guild_cancel_request(p_request_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Auth required'; end if;
  update public.guild_join_requests
    set status = 'cancelled', updated_at = now()
    where id = p_request_id and requester_id = _uid and status = 'pending';
  if not found then raise exception 'Request not found or not pending'; end if;
end;
$$;
grant execute on function public.rpc_guild_cancel_request(uuid) to anon, authenticated;

-- Cancel all pending join requests of current user
create or replace function public.rpc_guild_cancel_my_requests()
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Auth required'; end if;
  update public.guild_join_requests
    set status = 'cancelled', updated_at = now()
    where requester_id = _uid and status = 'pending';
end;
$$;
grant execute on function public.rpc_guild_cancel_my_requests() to anon, authenticated;

-- Replace approve request RPC to cancel others and handle full guild
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
  -- cancel other requests by this user
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where requester_id = _row.requester_id and status = 'pending';
  -- cancel remaining requests if guild now full
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 5 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
      where guild_id = _row.guild_id and status = 'pending';
  end if;
end;
$$;
grant execute on function public.rpc_guild_approve_request(uuid) to anon, authenticated;
