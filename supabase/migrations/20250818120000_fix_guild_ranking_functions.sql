-- Fix ambiguous column references in RPCs by qualifying output columns

-- rpc_get_guild_ranking
create or replace function public.rpc_get_guild_ranking(
  limit_count integer default 50,
  offset_count integer default 0,
  target_month date default date_trunc('month', now())::date
) returns table (
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
           (select count(*)::integer from public.guild_members gm where gm.guild_id = g.id) as members_count,
           coalesce(sum(c.gained_xp), 0) as monthly_xp
    from public.guilds g
    left join public.guild_xp_contributions c
      on c.guild_id = g.id and c.month = target_month
    group by g.id, g.name, g.level
  ), ranked as (
    select m.*, rank() over(order by m.monthly_xp desc)::integer as rank_no
    from monthly m
  )
  select ranked.guild_id as guild_id,
         ranked.name as name,
         ranked.members_count as members_count,
         ranked.level as level,
         ranked.monthly_xp as monthly_xp,
         ranked.rank_no as rank_no
  from ranked
  order by ranked.monthly_xp desc, ranked.name asc
  offset offset_count limit limit_count;
end;
$$;

grant execute on function public.rpc_get_guild_ranking(integer, integer, date) to anon, authenticated;

-- rpc_get_guild_monthly_ranks
create or replace function public.rpc_get_guild_monthly_ranks(
  p_guild_id uuid,
  months integer default 12
) returns table(month date, monthly_xp bigint, rank_no integer)
language plpgsql security definer as $$
begin
  return query
  with months as (
    select generate_series(
      date_trunc('month', now())::date - ((months - 1) || ' months')::interval,
      date_trunc('month', now())::date,
      interval '1 month'
    )::date as month
  ), monthly as (
    select m.month as month,
           g.id as guild_id,
           coalesce(sum(c.gained_xp), 0) as monthly_xp
    from months m
    cross join public.guilds g
    left join public.guild_xp_contributions c
      on c.guild_id = g.id and c.month = m.month
    group by m.month, g.id
  ), ranked as (
    select monthly.month as month,
           monthly.guild_id as guild_id,
           monthly.monthly_xp as monthly_xp,
           rank() over(partition by monthly.month order by monthly.monthly_xp desc)::integer as rank_no
    from monthly
  )
  select ranked.month as month,
         ranked.monthly_xp as monthly_xp,
         ranked.rank_no as rank_no
  from ranked
  where ranked.guild_id = p_guild_id
  order by ranked.month asc;
end;
$$;

grant execute on function public.rpc_get_guild_monthly_ranks(uuid, integer) to anon, authenticated;