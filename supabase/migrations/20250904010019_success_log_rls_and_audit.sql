-- Harden RLS and add audit/fix RPCs for quest success log

-- 1) RLS: only service_role can insert/update/delete success log; everyone can select
alter table if exists public.guild_quest_success_log enable row level security;

drop policy if exists gqsl_select_all on public.guild_quest_success_log;
create policy gqsl_select_all on public.guild_quest_success_log for select using (true);

drop policy if exists gqsl_ins on public.guild_quest_success_log;
drop policy if exists gqsl_upd on public.guild_quest_success_log;
drop policy if exists gqsl_del on public.guild_quest_success_log;
create policy gqsl_ins on public.guild_quest_success_log for insert to service_role with check (true);
create policy gqsl_upd on public.guild_quest_success_log for update to service_role using (true) with check (true);
create policy gqsl_del on public.guild_quest_success_log for delete to service_role using (true);

grant select on table public.guild_quest_success_log to anon, authenticated;
revoke insert, update, delete on table public.guild_quest_success_log from anon, authenticated;
grant insert, update, delete on table public.guild_quest_success_log to service_role;

-- 2) View: suspicious successes (XP < 1000 in the hour)
create or replace view public.v_suspicious_guild_success as
select l.guild_id, l.rollover_hour,
       coalesce(sum(c.gained_xp), 0) as xp_in_prev_hour
from public.guild_quest_success_log l
left join public.guild_xp_contributions c
  on c.guild_id = l.guild_id
 and c.hour_bucket >= (l.rollover_hour - interval '1 hour')
 and c.hour_bucket < l.rollover_hour
group by l.guild_id, l.rollover_hour
having coalesce(sum(c.gained_xp), 0) < 1000;

grant select on public.v_suspicious_guild_success to anon, authenticated;

-- 3) RPC: delete a specific suspicious success (service_role only)
create or replace function public.rpc_delete_guild_success_log(p_guild_id uuid, p_rollover_hour timestamptz)
returns void
language plpgsql security definer as $$
begin
  delete from public.guild_quest_success_log where guild_id = p_guild_id and rollover_hour = p_rollover_hour;
end;
$$;

revoke execute on function public.rpc_delete_guild_success_log(uuid, timestamptz) from anon, authenticated;
grant execute on function public.rpc_delete_guild_success_log(uuid, timestamptz) to service_role;

