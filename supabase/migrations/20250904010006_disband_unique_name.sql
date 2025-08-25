-- Ensure disband rename does not violate unique constraint on guilds.name

create or replace function public.rpc_guild_disband_and_clear_members(p_guild_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
  _leader uuid;
  _mc integer;
  _is_member boolean;
  _new_name text;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select leader_id into _leader from public.guilds where id = p_guild_id;
  if _leader is null then raise exception 'Guild not found'; end if;
  select count(*) into _mc from public.guild_members where guild_id = p_guild_id;
  select exists(select 1 from public.guild_members where guild_id = p_guild_id and user_id = _uid) into _is_member;
  if current_user <> 'service_role' then
    if _leader <> _uid then
      -- permit if user is the only member
      if not (_is_member and _mc = 1) then
        raise exception 'Only leader can disband';
      end if;
    end if;
  end if;

  -- Use a guaranteed-unique name based on the guild UUID
  _new_name := '解散したギルド-' || p_guild_id::text;
  update public.guilds set disbanded = true, name = _new_name, updated_at = now() where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;
end;
$$;

grant execute on function public.rpc_guild_disband_and_clear_members(uuid) to anon, authenticated;