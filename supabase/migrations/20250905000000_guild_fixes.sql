-- Guild fixes: disbanded column, RLS updates, lightweight RPCs, and request cleanup triggers

-- 1) Add missing disbanded column
alter table if exists public.guilds
  add column if not exists disbanded boolean not null default false;

-- 2) Relax guilds update policy to allow leader to transfer leadership without violating WITH CHECK
drop policy if exists guilds_update_leader on public.guilds;
create policy guilds_update_leader on public.guilds
  for update
  using (auth.uid() = leader_id)
  with check (true);

-- 3) Allow any member of a guild to read all members of that guild (for member list visibility)
drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members
  for select
  using (
    exists(
      select 1 from public.guild_members gm
      where gm.guild_id = public.guild_members.guild_id
        and gm.user_id = auth.uid()
    )
  );

-- 4) Lightweight RPC: Get member count for a guild (outsiders can read count only)
create or replace function public.rpc_get_guild_member_count(p_guild_id uuid)
returns integer
language sql security definer stable as $$
  select count(*)::int from public.guild_members where guild_id = p_guild_id;
$$;

grant execute on function public.rpc_get_guild_member_count(uuid) to anon, authenticated;

-- 5) RPC: Cancel a join request by requester or by the guild leader
create or replace function public.rpc_guild_cancel_request(p_request_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _row record;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select * into _row from public.guild_join_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request not found or not pending'; end if;
  if _row.requester_id <> _uid and not exists(select 1 from public.guilds g where g.id = _row.guild_id and g.leader_id = _uid) then
    raise exception 'Not permitted';
  end if;
  update public.guild_join_requests set status = 'cancelled', updated_at = now() where id = p_request_id;
end;
$$;

grant execute on function public.rpc_guild_cancel_request(uuid) to anon, authenticated;

-- 6) Trigger: When a user joins any guild, cancel all of their pending join requests elsewhere
create or replace function public.on_guild_member_insert_cleanup_requests()
returns trigger
language plpgsql security definer as $$
declare
  _member_count integer;
begin
  -- Cancel all pending join requests by this user (they joined a guild now)
  update public.guild_join_requests
    set status = 'cancelled', updated_at = now()
  where requester_id = new.user_id and status = 'pending';

  -- If this guild became full (>=5), cancel all pending requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = new.guild_id;
  if _member_count >= 5 then
    update public.guild_join_requests
      set status = 'cancelled', updated_at = now()
    where guild_id = new.guild_id and status = 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guild_member_insert_cleanup on public.guild_members;
create trigger trg_guild_member_insert_cleanup
after insert on public.guild_members
for each row execute function public.on_guild_member_insert_cleanup_requests();

