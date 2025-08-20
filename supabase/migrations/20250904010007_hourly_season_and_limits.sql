-- Hourly season switch, quest threshold to 1000, and member cap 1 (temporary for verification)

-- 1) Add hourly bucket column for guild contributions
alter table if exists public.guild_xp_contributions
  add column if not exists hour_bucket timestamptz not null default date_trunc('hour', now());

create index if not exists guild_xp_contrib_guild_hour_idx on public.guild_xp_contributions(guild_id, hour_bucket);
create index if not exists guild_xp_contrib_hour_idx on public.guild_xp_contributions(hour_bucket);

-- 2) Update trigger function to also write hourly bucket
create or replace function public.on_xp_history_insert_guild_contribution()
returns trigger
language plpgsql security definer as $$
declare
  _guild_id uuid;
  _hour timestamptz := date_trunc('hour', now());
  _month date := date_trunc('month', now())::date;
begin
  -- Find current guild membership of the user
  select gm.guild_id into _guild_id
  from public.guild_members gm
  where gm.user_id = new.user_id;

  if _guild_id is not null then
    insert into public.guild_xp_contributions(guild_id, user_id, gained_xp, month, hour_bucket, created_at)
    values(_guild_id, new.user_id, new.gained_xp, _month, _hour, now());

    -- Update guild aggregate XP and level
    update public.guilds g
      set total_xp = g.total_xp + new.gained_xp,
          level = public.calculate_guild_level_from_xp(g.total_xp + new.gained_xp),
          updated_at = now()
    where g.id = _guild_id;
  end if;
  return new;
end;
$$;

-- 3) Hourly ranking RPCs (keep return shape for compatibility)
create or replace function public.rpc_get_guild_ranking(
  limit_count integer default 50,
  offset_count integer default 0,
  target_hour timestamptz default date_trunc('hour', now())
)
returns table (
  guild_id uuid,
  name text,
  members_count integer,
  level integer,
  monthly_xp bigint,
  rank_no integer
)
language plpgsql security definer as $$
begin
  return query
  with hourly as (
    select g.id as guild_id, g.name, g.level,
           (select count(*) from public.guild_members gm where gm.guild_id = g.id) as members_count,
           coalesce(sum(c.gained_xp), 0) as hourly_xp
    from public.guilds g
    left join public.guild_xp_contributions c
      on c.guild_id = g.id and c.hour_bucket = target_hour
    group by g.id, g.name, g.level
  ), ranked as (
    select h.*, rank() over(order by h.hourly_xp desc) as rank_no
    from hourly h
  )
  select guild_id, name, members_count, level, hourly_xp as monthly_xp, rank_no
  from ranked
  order by hourly_xp desc, name asc
  offset offset_count limit limit_count;
end;
$$;

create or replace function public.rpc_get_my_guild_rank(
  target_hour timestamptz default date_trunc('hour', now())
)
returns integer
language plpgsql security definer as $$
declare
  _gid uuid;
  _rank integer;
begin
  select gm.guild_id into _gid from public.guild_members gm where gm.user_id = auth.uid();
  if _gid is null then return null; end if;
  with hourly as (
    select g.id as guild_id,
           coalesce(sum(c.gained_xp), 0) as hourly_xp
    from public.guilds g
    left join public.guild_xp_contributions c
      on c.guild_id = g.id and c.hour_bucket = target_hour
    group by g.id
  ), ranked as (
    select guild_id, hourly_xp, rank() over(order by hourly_xp desc) as rnk
    from hourly
  )
  select rnk into _rank from ranked where guild_id = _gid;
  return _rank;
end;
$$;

grant execute on function public.rpc_get_guild_ranking(integer, integer, timestamptz) to anon, authenticated;
grant execute on function public.rpc_get_my_guild_rank(timestamptz) to anon, authenticated;

-- 4) Change quest enforcement to hourly and threshold 1000
create or replace function public.rpc_guild_enforce_monthly_quest(
  p_hour timestamptz default date_trunc('hour', now())
)
returns void
language plpgsql security definer as $$
declare
  _target_hour timestamptz := date_trunc('hour', p_hour);
  _prev_hour timestamptz := date_trunc('hour', p_hour) - interval '1 hour';
  _gid uuid;
  _xp bigint;
  _rec record;
begin
  for _rec in (
    select g.id as guild_id
    from public.guilds g
    where coalesce(g.guild_type, 'casual') = 'challenge'
  ) loop
    _gid := _rec.guild_id;
    select coalesce(sum(c.gained_xp), 0) into _xp
    from public.guild_xp_contributions c
    where c.guild_id = _gid and c.hour_bucket = _prev_hour;
    if _xp < 1000 then
      perform public.rpc_guild_disband_and_clear_members(_gid);
    end if;
  end loop;
end;
$$;

grant execute on function public.rpc_guild_enforce_monthly_quest(timestamptz) to anon, authenticated;

-- 5) Member cap: change checks from 5 to 1
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
  if _member_count >= 1 then raise exception 'Guild is full'; end if;

  insert into public.guild_invitations(guild_id, inviter_id, invitee_id, status)
  values(_gid, _uid, p_invitee_id, 'pending')
  returning id into _inv_id;
  return _inv_id;
end;
$$;

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
  if _member_count >= 1 then raise exception 'Guild is full'; end if;

  update public.guild_invitations set status = 'accepted', updated_at = now() where id = p_invitation_id;
  insert into public.guild_members(guild_id, user_id, role) values(_row.guild_id, _uid, 'member');

  -- cancel my other pending join requests across all guilds
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where requester_id = _uid and status = 'pending';

  -- if full now, cancel other pending join requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 1 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
      where guild_id = _row.guild_id and status = 'pending';
  end if;
end;
$$;

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
  if _member_count >= 1 then raise exception 'Guild is full'; end if;
  insert into public.guild_join_requests(guild_id, requester_id, status)
  values(p_gid, _uid, 'pending') returning id into _req_id;
  return _req_id;
end;
$$;

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
  if _member_count >= 1 then raise exception 'Guild is full'; end if;
  update public.guild_join_requests set status = 'approved', updated_at = now() where id = p_request_id;
  insert into public.guild_members(guild_id, user_id, role) values(_row.guild_id, _row.requester_id, 'member');

  -- cancel requester's other pending join requests
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where requester_id = _row.requester_id and status = 'pending' and id <> p_request_id;

  -- if full now, cancel other pending join requests to this guild
  select count(*) into _member_count from public.guild_members where guild_id = _row.guild_id;
  if _member_count >= 1 then
    update public.guild_join_requests set status = 'cancelled', updated_at = now()
      where guild_id = _row.guild_id and status = 'pending';
  end if;
end;
$$;

grant execute on function public.rpc_guild_invite(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_accept_invitation(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_request_join(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_approve_request(uuid) to anon, authenticated;

