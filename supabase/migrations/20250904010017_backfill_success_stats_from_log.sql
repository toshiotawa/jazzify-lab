-- Backfill guild_quest_stats from guild_quest_success_log for consistency

insert into public.guild_quest_stats (guild_id, success_count, updated_at)
select l.guild_id, count(*)::integer, now()
from public.guild_quest_success_log l
group by l.guild_id
on conflict (guild_id) do update set success_count = excluded.success_count, updated_at = excluded.updated_at;

