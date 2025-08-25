-- Friendly error message for duplicate guild name on creation

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

  begin
    insert into public.guilds(name, leader_id, guild_type)
    values(p_name, _uid, p_type)
    returning id into _gid;
  exception when unique_violation then
    -- Map unique constraint to user-friendly message
    raise exception 'そのギルド名は既に使用されています。別の名前をご入力ください。';
  end;

  insert into public.guild_members(guild_id, user_id, role) values(_gid, _uid, 'leader');
  return _gid;
end;
$$;

grant execute on function public.rpc_guild_create(text, text) to anon, authenticated;

