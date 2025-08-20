-- Quest success counter and system-level disband; hourly enforcement updates

-- 1) Success counter table (publicly readable)
create table if not exists public.guild_quest_stats (
  guild_id uuid primary key references public.guilds(id) on delete cascade,
  success_count integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.guild_quest_stats enable row level security;

drop policy if exists guild_quest_stats_select_all on public.guild_quest_stats;
create policy guild_quest_stats_select_all on public.guild_quest_stats for select using (true);

grant select on table public.guild_quest_stats to anon, authenticated;
grant insert, update, delete on table public.guild_quest_stats to service_role;

-- 2) System disband function (no auth required)
create or replace function public.rpc_guild_disband_system(p_guild_id uuid)
returns void
language plpgsql security definer as $$
declare
  _new_name text;
begin
  -- ensure deterministic unique rename to avoid violating unique(name)
  _new_name := '解散したギルド-' || substr(replace(p_guild_id::text, '-', ''), 1, 8);
  update public.guilds set disbanded = true, name = _new_name, updated_at = now() where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;
end;
$$;

grant execute on function public.rpc_guild_disband_system(uuid) to anon, authenticated, service_role;

-- 3) Hourly quest enforcement: increment success on pass; disband on fail
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

    if _xp >= 1000 then
      insert into public.guild_quest_stats(guild_id, success_count, updated_at)
      values(_gid, 1, now())
      on conflict (guild_id) do update set success_count = public.guild_quest_stats.success_count + 1,
                                            updated_at = excluded.updated_at;
    else
      perform public.rpc_guild_disband_system(_gid);
    end if;
  end loop;
end;
$$;

grant execute on function public.rpc_guild_enforce_monthly_quest(timestamptz) to anon, authenticated;

-- 4) Membership history table and triggers
create table if not exists public.guild_membership_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  guild_id uuid not null references public.guilds(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz
);

alter table public.guild_membership_history enable row level security;

drop policy if exists gm_hist_select_self on public.guild_membership_history;
create policy gm_hist_select_self on public.guild_membership_history for select using (auth.uid() = user_id);

-- Insert history on join
create or replace function public.on_guild_member_insert_history()
returns trigger
language plpgsql security definer as $$
begin
  insert into public.guild_membership_history(user_id, guild_id, joined_at)
  values(new.user_id, new.guild_id, now());
  return new;
end;
$$;

drop trigger if exists trg_gm_insert_history on public.guild_members;
create trigger trg_gm_insert_history after insert on public.guild_members
for each row execute function public.on_guild_member_insert_history();

-- Update history on leave
create or replace function public.on_guild_member_delete_history()
returns trigger
language plpgsql security definer as $$
begin
  update public.guild_membership_history h
    set left_at = now()
  where h.id = (
    select id from public.guild_membership_history
    where user_id = old.user_id and guild_id = old.guild_id and left_at is null
    order by joined_at desc
    limit 1
  );
  return old;
end;
$$;

drop trigger if exists trg_gm_delete_history on public.guild_members;
create trigger trg_gm_delete_history after delete on public.guild_members
for each row execute function public.on_guild_member_delete_history();

-- RPC to fetch my membership history with guild names
create or replace function public.rpc_get_my_guild_membership_history()
returns table(guild_id uuid, guild_name text, joined_at timestamptz, left_at timestamptz)
language plpgsql security definer as $$
begin
  return query
  select h.guild_id, g.name as guild_name, h.joined_at, h.left_at
  from public.guild_membership_history h
  join public.guilds g on g.id = h.guild_id
  where h.user_id = auth.uid()
  order by h.joined_at desc;
end;
$$;

grant execute on function public.rpc_get_my_guild_membership_history() to anon, authenticated;

