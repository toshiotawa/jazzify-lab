-- Add guild_type to existing guilds table and update RPC to accept type

alter table if exists public.guilds
  add column if not exists guild_type text not null default 'casual' check (guild_type in ('casual','challenge'));

-- Replace rpc_guild_create to accept p_type
create or replace function public.rpc_guild_create(p_name text, p_type text)
returns uuid
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _gid uuid;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if public.is_current_user_free() then raise exception 'Free plan users cannot use guilds'; end if;
  if exists(select 1 from public.guild_members where user_id = _uid) then raise exception 'Already in a guild'; end if;
  if p_type is null or p_type not in ('casual','challenge') then raise exception 'Invalid guild type'; end if;
  insert into public.guilds(name, leader_id, guild_type) values(p_name, _uid, p_type) returning id into _gid;
  insert into public.guild_members(guild_id, user_id, role) values(_gid, _uid, 'leader');
  return _gid;
end;
$$;

grant execute on function public.rpc_guild_create(text, text) to anon, authenticated;

