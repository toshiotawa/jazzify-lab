-- Ensure enforcement writes to success log and increments stats only on first insert

drop function if exists public.rpc_guild_enforce_monthly_quest(timestamptz);

create or replace function public.rpc_guild_enforce_monthly_quest(
  p_hour timestamptz default date_trunc('hour', now())
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _target_hour timestamptz := coalesce(date_trunc('hour', p_hour), date_trunc('hour', now()));
  _prev_hour timestamptz := _target_hour - interval '1 hour';
  _gid uuid;
  _xp bigint;
  _rec record;
  _rowcount integer;
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
      -- Write success log once per hour per guild
      insert into public.guild_quest_success_log(guild_id, rollover_hour)
      values(_gid, _target_hour)
      on conflict do nothing;
      get diagnostics _rowcount = row_count;
      if _rowcount > 0 then
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

