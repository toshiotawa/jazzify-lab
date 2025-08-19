-- rpc_guild_disband_and_clear_members関数を修正
-- ギルド名をユニークにするため、タイムスタンプを追加
create or replace function public.rpc_guild_disband_and_clear_members(p_guild_id uuid)
returns void language plpgsql security definer as $$
declare
  _uid uuid;
  _leader uuid;
begin
  _uid := auth.uid();
  if _uid is null then raise exception 'Auth required'; end if;
  select leader_id into _leader from public.guilds where id = p_guild_id;
  if _leader is null then raise exception 'Guild not found'; end if;
  if current_user <> 'service_role' and _leader <> _uid then
    raise exception 'Only leader can disband';
  end if;
  -- ギルド名にタイムスタンプを追加してユニークにする
  update public.guilds 
  set disbanded = true, 
      name = '解散したギルド_' || to_char(now(), 'YYYYMMDDHH24MISS') || '_' || substring(p_guild_id::text, 1, 8),
      updated_at = now() 
  where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;
end;
$$;