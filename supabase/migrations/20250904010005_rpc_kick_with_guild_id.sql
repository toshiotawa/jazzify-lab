-- Replace kick RPC to take explicit guild id

drop function if exists public.rpc_guild_kick_member(uuid) cascade;

create or replace function public.rpc_guild_kick_member(
  p_guild_id uuid,
  p_member_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _is_leader boolean;
  _deleted integer := 0;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select exists(select 1 from public.guilds where id = p_guild_id and leader_id = _uid) into _is_leader;
  if not _is_leader then raise exception 'Only leader can kick'; end if;
  if p_member_user_id = _uid then raise exception 'Leader cannot kick self via this RPC'; end if;
  delete from public.guild_members where guild_id = p_guild_id and user_id = p_member_user_id;
  get diagnostics _deleted = row_count;
  if _deleted = 0 then
    raise exception 'Target user is not a member of your guild';
  end if;
end;
$$;

grant execute on function public.rpc_guild_kick_member(uuid, uuid) to anon, authenticated;