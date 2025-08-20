-- Ensure all disband functions rename guilds uniquely to avoid unique(name) violation

-- Override: user-initiated disband
create or replace function public.rpc_guild_disband_and_clear_members(p_guild_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _leader uuid;
  _new_name text;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select leader_id into _leader from public.guilds where id = p_guild_id;
  if _leader is null then raise exception 'Guild not found'; end if;
  if current_user <> 'service_role' and _leader <> _uid then
    raise exception 'Only leader can disband';
  end if;
  _new_name := '解散したギルド-' || substr(replace(p_guild_id::text, '-', ''), 1, 8);
  update public.guilds set disbanded = true, name = _new_name, updated_at = now() where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;

  -- cancel pending invites/requests
  update public.guild_invitations set status = 'cancelled', updated_at = now()
    where guild_id = p_guild_id and status = 'pending';
  update public.guild_join_requests set status = 'cancelled', updated_at = now()
    where guild_id = p_guild_id and status = 'pending';
end;
$$;

grant execute on function public.rpc_guild_disband_and_clear_members(uuid) to anon, authenticated;

-- Keep signature consistent with existing (p_guild_id, p_member_user_id)
create or replace function public.rpc_guild_kick_member(p_guild_id uuid, p_member_user_id uuid)
returns void
language plpgsql security definer as $$
declare
  _uid uuid := auth.uid();
  _leader uuid;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select leader_id into _leader from public.guilds where id = p_guild_id;
  if _leader is null then raise exception 'Guild not found'; end if;
  if _leader <> _uid then raise exception 'Only leader can kick'; end if;
  delete from public.guild_members where guild_id = p_guild_id and user_id = p_member_user_id;
end;
$$;

