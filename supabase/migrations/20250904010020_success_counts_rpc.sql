-- RPC to fetch success counts for a set of guilds from success log

create or replace function public.rpc_get_guild_success_counts(p_guild_ids uuid[])
returns table (
  guild_id uuid,
  success_count integer
)
language sql
security definer
as $$
  select l.guild_id, count(*)::integer as success_count
  from public.guild_quest_success_log l
  where l.guild_id = any(p_guild_ids)
  group by l.guild_id;
$$;

grant execute on function public.rpc_get_guild_success_counts(uuid[]) to anon, authenticated;

