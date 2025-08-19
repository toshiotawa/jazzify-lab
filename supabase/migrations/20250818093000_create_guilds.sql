-- Guild system schema, triggers, and RPCs
-- Requirements covered:
-- 1) Guilds up to 5 members; 2) Free plan cannot use guild features;
-- 4) Invitations and join requests; 6) Guild level with 3x XP table;
-- 7) Placeholder titles handled on frontend; 8) Leader-only kick;
-- 9) Auto-remove on free rank and auto leader reassignment;
-- 10) Monthly guild ranking by XP; 12) Contributions persist for month;
-- 13) Guild board tables (posts/comments/likes) without images.

-- Enable required extensions (if not already)
create extension if not exists pgcrypto;

-- =========================
-- Core tables
-- =========================

create table if not exists public.guilds (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  leader_id uuid not null references public.profiles(id) on delete set null,
  total_xp bigint not null default 0,
  level integer not null default 1,
  guild_type text not null default 'casual' check (guild_type in ('casual','challenge')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.guilds is 'Guild master table';

create table if not exists public.guild_members (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member', -- 'leader' or 'member'
  joined_at timestamptz not null default now(),
  primary key (guild_id, user_id)
);

create unique index if not exists guild_members_unique_user on public.guild_members(user_id);

comment on table public.guild_members is 'Memberships: each user belongs to at most one guild';

create table if not exists public.guild_invitations (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'accepted' | 'rejected' | 'cancelled'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists guild_invitation_unique_pending on public.guild_invitations(guild_id, invitee_id) where status = 'pending';

create table if not exists public.guild_join_requests (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending', -- 'pending' | 'approved' | 'rejected' | 'cancelled'
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists guild_join_request_unique_pending on public.guild_join_requests(guild_id, requester_id) where status = 'pending';

-- Record per-XP contribution snapshots to avoid retroactive removal on leave
create table if not exists public.guild_xp_contributions (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  gained_xp integer not null,
  month date not null default date_trunc('month', now())::date,
  created_at timestamptz not null default now()
);

create index if not exists guild_xp_contrib_guild_month_idx on public.guild_xp_contributions(guild_id, month);
create index if not exists guild_xp_contrib_month_idx on public.guild_xp_contributions(month);

-- =========================
-- Guild board (no images)
-- =========================

create table if not exists public.guild_posts (
  id uuid primary key default gen_random_uuid(),
  guild_id uuid not null references public.guilds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.guild_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.guild_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.guild_post_likes (
  post_id uuid not null references public.guild_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- =========================
-- Level calculation for guild (3x XP thresholds)
-- =========================

create or replace function public.calculate_guild_level_from_xp(total_xp bigint)
returns integer
language plpgsql immutable
as $$
declare
  level integer := 1;
  remaining bigint := total_xp;
begin
  -- Lv1-10: 2000*3 = 6000 per level gap (9 gaps)
  for i in 1..9 loop
    if remaining >= 6000 then
      remaining := remaining - 6000;
      level := level + 1;
    else
      return level;
    end if;
  end loop;

  -- Lv11-50: 50000*3 = 150000 per level gap (40 gaps)
  for i in 1..40 loop
    if remaining >= 150000 then
      remaining := remaining - 150000;
      level := level + 1;
    else
      return level;
    end if;
  end loop;

  -- Lv51+: 100000*3 = 300000 per level gap
  while remaining >= 300000 loop
    remaining := remaining - 300000;
    level := level + 1;
  end loop;

  return level;
end;
$$;

-- =========================
-- Triggers
-- =========================

-- Update guild.updated_at automatically
create or replace function public.set_updated_at()
returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_guilds_set_updated_at on public.guilds;
create trigger trg_guilds_set_updated_at before update on public.guilds
for each row execute function public.set_updated_at();

-- On xp_history insert, snapshot contribution to guild and update guild total_xp/level
create or replace function public.on_xp_history_insert_guild_contribution()
returns trigger
language plpgsql security definer as $$
declare
  _guild_id uuid;
begin
  -- Find current guild membership of the user
  select gm.guild_id into _guild_id
  from public.guild_members gm
  where gm.user_id = new.user_id;

  if _guild_id is not null then
    insert into public.guild_xp_contributions(guild_id, user_id, gained_xp, month, created_at)
    values(_guild_id, new.user_id, new.gained_xp, date_trunc('month', now())::date, now());

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

drop trigger if exists trg_xp_history_guild_contribution on public.xp_history;
create trigger trg_xp_history_guild_contribution
after insert on public.xp_history
for each row execute function public.on_xp_history_insert_guild_contribution();

-- On profiles rank update: if becomes 'free', auto-remove from guild. If leader, reassign leader. If no members left, delete guild.
create or replace function public.on_profile_rank_update_cleanup()
returns trigger
language plpgsql security definer as $$
declare
  _old_guild_id uuid;
  _is_leader boolean;
  _new_leader uuid;
begin
  if new.rank = 'free' and old.rank <> 'free' then
    select gm.guild_id, (g.leader_id = new.id) into _old_guild_id, _is_leader
    from public.guild_members gm
    join public.guilds g on g.id = gm.guild_id
    where gm.user_id = new.id
    limit 1;

    if _old_guild_id is not null then
      -- Remove the member
      delete from public.guild_members where guild_id = _old_guild_id and user_id = new.id;

      if _is_leader then
        -- Find the next leader by earliest joined_at
        select user_id into _new_leader
        from public.guild_members
        where guild_id = _old_guild_id
        order by joined_at asc
        limit 1;

        if _new_leader is not null then
          update public.guilds set leader_id = _new_leader, updated_at = now() where id = _old_guild_id;
          update public.guild_members set role = 'leader' where guild_id = _old_guild_id and user_id = _new_leader;
        else
          -- No members left; delete guild
          delete from public.guilds where id = _old_guild_id;
        end if;
      end if;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_profiles_rank_cleanup on public.profiles;
create trigger trg_profiles_rank_cleanup
after update of rank on public.profiles
for each row execute function public.on_profile_rank_update_cleanup();

-- =========================
-- RPC helpers (security definer)
-- =========================

-- Check if current user is free plan
create or replace function public.is_current_user_free()
returns boolean
language sql stable as $$
  select exists(select 1 from public.profiles p where p.id = auth.uid() and p.rank = 'free');
$$;

-- Create a guild with current user as leader
create or replace function public.rpc_guild_create(p_name text, p_type text)
returns uuid
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _gid uuid;
begin
  if _uid is null then
    raise exception 'Auth required';
  end if;
  if public.is_current_user_free() then
    raise exception 'Free plan users cannot use guilds';
  end if;
  if exists(select 1 from public.guild_members where user_id = _uid) then
    raise exception 'Already in a guild';
  end if;
  if p_type is null or p_type not in ('casual','challenge') then
    raise exception 'Invalid guild type';
  end if;
  insert into public.guilds(name, leader_id, guild_type) values(p_name, _uid, p_type) returning id into _gid;
  insert into public.guild_members(guild_id, user_id, role) values(_gid, _uid, 'leader');
  return _gid;
end;
$$;

-- Invite a user to my guild (members can invite; target must not belong to a guild)
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

  -- member limit check
  select count(*) into _member_count from public.guild_members where guild_id = _gid;
  if _member_count >= 5 then raise exception 'Guild is full'; end if;

  insert into public.guild_invitations(guild_id, inviter_id, invitee_id, status)
  values(_gid, _uid, p_invitee_id, 'pending')
  returning id into _inv_id;
  return _inv_id;
end;
$$;

-- Cancel my invitation
create or replace function public.rpc_guild_cancel_invitation(p_invitation_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _row record;
begin
  select * into _row from public.guild_invitations where id = p_invitation_id;
  if not found then raise exception 'Invitation not found'; end if;
  if _row.inviter_id <> _uid and _row.invitee_id <> _uid then raise exception 'Not permitted'; end if;
  update public.guild_invitations set status = 'cancelled', updated_at = now() where id = p_invitation_id;
end;
$$;

-- Accept invitation (by invitee)
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

-- Reject invitation (by invitee)
create or replace function public.rpc_guild_reject_invitation(p_invitation_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _row record;
begin
  select * into _row from public.guild_invitations where id = p_invitation_id and status = 'pending';
  if not found then raise exception 'Invitation not found or not pending'; end if;
  if _row.invitee_id <> _uid then raise exception 'Only invitee can reject'; end if;
  update public.guild_invitations set status = 'rejected', updated_at = now() where id = p_invitation_id;
end;
$$;

-- Request to join a guild (by user not in any guild)
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
  if _member_count >= 5 then raise exception 'Guild is full'; end if;
  -- 既存の保留中リクエストがあればそのIDを返す（重複挿入を防止）
  select id into _req_id from public.guild_join_requests
  where guild_id = p_gid and requester_id = _uid and status = 'pending';
  if found then
    return _req_id;
  end if;
  insert into public.guild_join_requests(guild_id, requester_id, status)
  values(p_gid, _uid, 'pending') returning id into _req_id;
  return _req_id;
end;
$$;

-- Approve a join request (leader only)
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

-- Reject a join request (leader only)
create or replace function public.rpc_guild_reject_request(p_request_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _row record;
begin
  select * into _row from public.guild_join_requests where id = p_request_id and status = 'pending';
  if not found then raise exception 'Request not found or not pending'; end if;
  if not exists(select 1 from public.guilds g where g.id = _row.guild_id and g.leader_id = _uid) then
    raise exception 'Only leader can reject';
  end if;
  update public.guild_join_requests set status = 'rejected', updated_at = now() where id = p_request_id;
end;
$$;

-- Kick a member (leader only)
create or replace function public.rpc_guild_kick_member(p_member_user_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _gid uuid;
begin
  select id into _gid from public.guilds where leader_id = _uid;
  if _gid is null then raise exception 'Only leader can kick'; end if;
  if p_member_user_id = _uid then raise exception 'Leader cannot kick self via this RPC'; end if;
  delete from public.guild_members where guild_id = _gid and user_id = p_member_user_id;
end;
$$;

-- Fetch guild ranking for a month
create or replace function public.rpc_get_guild_ranking(limit_count integer default 50, offset_count integer default 0, target_month date default date_trunc('month', now())::date)
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
  with monthly as (
    select g.id as guild_id, g.name, g.level,
           (select count(*) from public.guild_members gm where gm.guild_id = g.id) as members_count,
           coalesce(sum(c.gained_xp), 0) as monthly_xp
    from public.guilds g
    left join public.guild_xp_contributions c
      on c.guild_id = g.id and c.month = target_month
    group by g.id, g.name, g.level
  ), ranked as (
    select m.*, rank() over(order by m.monthly_xp desc) as rank_no
    from monthly m
  )
  select guild_id, name, members_count, level, monthly_xp, rank_no
  from ranked
  order by monthly_xp desc, name asc
  offset offset_count limit limit_count;
end;
$$;

-- Get my guild current month rank
create or replace function public.rpc_get_my_guild_rank(target_month date default date_trunc('month', now())::date)
returns integer
language plpgsql security definer as $$
declare
  _gid uuid;
  _rank integer;
begin
  select gm.guild_id into _gid from public.guild_members gm where gm.user_id = auth.uid();
  if _gid is null then return null; end if;
  with monthly as (
    select g.id as guild_id,
           coalesce(sum(c.gained_xp), 0) as monthly_xp
    from public.guilds g
    left join public.guild_xp_contributions c
      on c.guild_id = g.id and c.month = target_month
    group by g.id
  ), ranked as (
    select guild_id, monthly_xp, rank() over(order by monthly_xp desc) as rnk
    from monthly
  )
  select rnk into _rank from ranked where guild_id = _gid;
  return _rank;
end;
$$;

-- Get a guild's last N months ranks
create or replace function public.rpc_get_guild_monthly_ranks(p_guild_id uuid, months integer default 12)
returns table(month date, monthly_xp bigint, rank_no integer)
language plpgsql security definer as $$
begin
  return query
  with months as (
    select generate_series(
      date_trunc('month', now())::date - ((months - 1) || ' months')::interval,
      date_trunc('month', now())::date,
      interval '1 month'
    )::date as month
  ),
  monthly as (
    select m.month,
           g.id as guild_id,
           coalesce(sum(c.gained_xp), 0) as monthly_xp
    from months m
    cross join public.guilds g
    left join public.guild_xp_contributions c
      on c.guild_id = g.id and c.month = m.month
    group by m.month, g.id
  ), ranked as (
    select month, guild_id, monthly_xp, rank() over(partition by month order by monthly_xp desc) as rank_no
    from monthly
  )
  select month, monthly_xp, rank_no
  from ranked
  where guild_id = p_guild_id
  order by month asc;
end;
$$;

-- =========================
-- RLS policies
-- =========================

alter table public.guilds enable row level security;
alter table public.guild_members enable row level security;
alter table public.guild_invitations enable row level security;
alter table public.guild_join_requests enable row level security;
alter table public.guild_posts enable row level security;
alter table public.guild_post_comments enable row level security;
alter table public.guild_post_likes enable row level security;
alter table public.guild_xp_contributions enable row level security;

-- Guilds: anyone can select, leader can update/delete
drop policy if exists guilds_select_all on public.guilds;
create policy guilds_select_all on public.guilds for select using (true);

drop policy if exists guilds_update_leader on public.guilds;
create policy guilds_update_leader on public.guilds for update using (auth.uid() = leader_id) with check (auth.uid() = leader_id);

drop policy if exists guilds_delete_leader on public.guilds;
create policy guilds_delete_leader on public.guilds for delete using (auth.uid() = leader_id);

-- Members: members and leaders can see rows of their guild; users can see their own membership
drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members for select using (
  user_id = auth.uid() or exists(select 1 from public.guilds g where g.id = guild_members.guild_id and g.leader_id = auth.uid())
);

-- Invitations: inviter/invitee and guild leader can select; inserts via RPC only
drop policy if exists guild_invite_select on public.guild_invitations;
create policy guild_invite_select on public.guild_invitations for select using (
  inviter_id = auth.uid() or invitee_id = auth.uid() or exists(select 1 from public.guilds g where g.id = public.guild_invitations.guild_id and g.leader_id = auth.uid())
);

-- Join requests: requester and guild leader can select; inserts via RPC only
drop policy if exists guild_join_req_select on public.guild_join_requests;
create policy guild_join_req_select on public.guild_join_requests for select using (
  requester_id = auth.uid() or exists(select 1 from public.guilds g where g.id = public.guild_join_requests.guild_id and g.leader_id = auth.uid())
);

-- Guild posts/comments/likes: only members of the guild can read/write
drop policy if exists guild_posts_rw on public.guild_posts;
create policy guild_posts_rw on public.guild_posts for all using (
  exists(select 1 from public.guild_members gm where gm.guild_id = guild_posts.guild_id and gm.user_id = auth.uid())
) with check (
  exists(select 1 from public.guild_members gm where gm.guild_id = guild_posts.guild_id and gm.user_id = auth.uid())
);

drop policy if exists guild_post_comments_rw on public.guild_post_comments;
create policy guild_post_comments_rw on public.guild_post_comments for all using (
  exists(select 1 from public.guild_posts p join public.guild_members gm on gm.guild_id = p.guild_id where p.id = public.guild_post_comments.post_id and gm.user_id = auth.uid())
) with check (
  exists(select 1 from public.guild_posts p join public.guild_members gm on gm.guild_id = p.guild_id where p.id = public.guild_post_comments.post_id and gm.user_id = auth.uid())
);

drop policy if exists guild_post_likes_rw on public.guild_post_likes;
create policy guild_post_likes_rw on public.guild_post_likes for all using (
  exists(select 1 from public.guild_posts p join public.guild_members gm on gm.guild_id = p.guild_id where p.id = public.guild_post_likes.post_id and gm.user_id = auth.uid())
) with check (
  exists(select 1 from public.guild_posts p join public.guild_members gm on gm.guild_id = p.guild_id where p.id = public.guild_post_likes.post_id and gm.user_id = auth.uid())
);

-- Contributions: read-only to everyone for ranking; writes via trigger only
drop policy if exists guild_xp_contrib_select_all on public.guild_xp_contributions;
create policy guild_xp_contrib_select_all on public.guild_xp_contributions for select using (true);

-- Grants
grant all on table public.guilds to anon, authenticated, service_role;
grant all on table public.guild_members to anon, authenticated, service_role;
grant all on table public.guild_invitations to anon, authenticated, service_role;
grant all on table public.guild_join_requests to anon, authenticated, service_role;
grant all on table public.guild_posts to anon, authenticated, service_role;
grant all on table public.guild_post_comments to anon, authenticated, service_role;
grant all on table public.guild_post_likes to anon, authenticated, service_role;
grant select on table public.guild_xp_contributions to anon, authenticated;
grant all on table public.guild_xp_contributions to service_role;

-- Function execution grants
grant execute on function public.rpc_guild_create(text, text) to anon, authenticated;
grant execute on function public.rpc_guild_invite(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_cancel_invitation(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_accept_invitation(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_reject_invitation(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_request_join(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_approve_request(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_reject_request(uuid) to anon, authenticated;
grant execute on function public.rpc_guild_kick_member(uuid) to anon, authenticated;
grant execute on function public.rpc_get_guild_ranking(integer, integer, date) to anon, authenticated;
grant execute on function public.rpc_get_my_guild_rank(date) to anon, authenticated;
grant execute on function public.rpc_get_guild_monthly_ranks(uuid, integer) to anon, authenticated;
grant execute on function public.is_current_user_free() to anon, authenticated;

