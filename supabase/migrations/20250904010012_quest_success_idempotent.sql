-- Idempotent quest success increment per guild per rollover hour

-- 1) Success log table to prevent double counting
create table if not exists public.guild_quest_success_log (
  guild_id uuid not null references public.guilds(id) on delete cascade,
  rollover_hour timestamptz not null,
  counted_at timestamptz not null default now(),
  primary key (guild_id, rollover_hour)
);

alter table public.guild_quest_success_log enable row level security;
drop policy if exists gqsl_select_all on public.guild_quest_success_log;
create policy gqsl_select_all on public.guild_quest_success_log for select using (true);
grant select on table public.guild_quest_success_log to anon, authenticated;

-- 2) Update enforcement to be idempotent using the success log
create or replace function public.rpc_guild_enforce_monthly_quest(
  p_hour timestamptz default date_trunc('hour', now())
)
returns void
language plpgsql security definer as $$
declare
  _target_hour timestamptz := coalesce(date_trunc('hour', p_hour), date_trunc('hour', now()));
  _prev_hour timestamptz := _target_hour - interval '1 hour';
  _gid uuid;
  _xp bigint;
  _rec record;
begin
  for _rec in (
    select g.id as guild_id
    from public.guilds g
    where coalesce(g.guild_type, 'casual') = 'challenge'
      and coalesce(g.disbanded, false) = false
  ) loop
    _gid := _rec.guild_id;

    select coalesce(sum(c.gained_xp), 0) into _xp
    from public.guild_xp_contributions c
    where c.guild_id = _gid
      and c.hour_bucket >= _prev_hour
      and c.hour_bucket < _target_hour;

    if _xp >= 1000 then
      -- Insert success marker; only first insert per (guild, target_hour) will succeed
      insert into public.guild_quest_success_log(guild_id, rollover_hour)
        values(_gid, _target_hour)
        on conflict do nothing;
      if found then
        insert into public.guild_quest_stats(guild_id, success_count, updated_at)
        values(_gid, 1, now())
        on conflict (guild_id) do update set success_count = public.guild_quest_stats.success_count + 1,
                                              updated_at = excluded.updated_at;
      end if;
    else
      perform public.rpc_guild_disband_system(_gid);
    end if;
  end loop;
end;
$$;

grant execute on function public.rpc_guild_enforce_monthly_quest(timestamptz) to anon, authenticated;

