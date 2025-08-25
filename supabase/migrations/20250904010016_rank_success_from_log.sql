-- Use success log to compute quest_success_count in ranking

create or replace function public.rpc_get_guild_ranking(
  limit_count integer default 50,
  offset_count integer default 0,
  target_hour timestamptz default date_trunc('hour', now())
)
returns table (
  guild_id uuid,
  name text,
  guild_type text,
  members_count integer,
  level integer,
  monthly_xp bigint,
  quest_success_count integer,
  rank_no integer
)
language plpgsql security definer as $$
begin
  return query
  with hourly as (
    select g.id as guild_id,
           g.name,
           g.guild_type,
           g.level,
           (select count(*) from public.guild_members gm where gm.guild_id = g.id) as members_count,
           coalesce(sum(c.gained_xp), 0) as hourly_xp
    from public.guilds g
    left join public.guild_xp_contributions c
      on c.guild_id = g.id and c.hour_bucket = target_hour
    group by g.id, g.name, g.guild_type, g.level
  ), ranked as (
    select h.*, rank() over(order by h.hourly_xp desc) as rank_no
    from hourly h
  ), success as (
    select l.guild_id, count(*)::integer as success_count
    from public.guild_quest_success_log l
    group by l.guild_id
  )
  select r.guild_id,
         r.name,
         r.guild_type,
         r.members_count,
         r.level,
         r.hourly_xp as monthly_xp,
         coalesce(s.success_count, 0) as quest_success_count,
         r.rank_no
  from ranked r
  left join success s on s.guild_id = r.guild_id
  order by r.hourly_xp desc, r.name asc
  offset offset_count limit limit_count;
end;
$$;

grant execute on function public.rpc_get_guild_ranking(integer, integer, timestamptz) to anon, authenticated;

