-- 1) guild_join_requests: リーダーは自ギルド宛の申請を参照可能
drop policy if exists guild_join_requests_select_own on public.guild_join_requests;
create policy guild_join_requests_select_leader on public.guild_join_requests for select using (
  exists (
    select 1 from public.guilds g
    where g.id = public.guild_join_requests.guild_id
      and g.leader_id = auth.uid()
  )
  or requester_id = auth.uid()
);

-- 2) キックRPCの強化: 対象が存在しない場合はエラー、search_pathを固定
create or replace function public.rpc_guild_kick_member(p_member_user_id uuid)
returns void
language plpgsql
security definer
set search_path = publicQQ
declare
  _uid uuid := auth.uid();
  _gid uuid;
  _deleted integer := 0;
begin
  if _uid is null then raise exception 'Auth required'; end if;
  select id into _gid from public.guilds where leader_id = _uid;
  if _gid is null then raise exception 'Only leader can kick'; end if;
  if p_member_user_id = _uid then raise exception 'Leader cannot kick self via this RPC'; end if;
  delete from public.guild_members where guild_id = _gid and user_id = p_member_user_id;
  get diagnostics _deleted = row_count;
  if _deleted = 0 then
    raise exception 'Target user is not a member of your guild';
  end if;
end;
$$;
grant execute on function public.rpc_guild_kick_member(uuid) to anon, authenticated;

-- 3) リーダー移譲RPCの整合: 旧シグネチャを確実に除去し、search_path固定
drop function if exists public.rpc_guild_transfer_leader(uuid, uuid) cascade;
create or replace function public.rpc_guild_transfer_leader(
  p_old_leader_id uuid,
  p_guild_id uuid,
  p_new_leader_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid uuid := auth.uid();
begin
  if _uid is null then raise exception 'Auth required'; end if;
  if not exists(select 1 from public.guilds where id = p_guild_id and leader_id = _uid) then
    raise exception 'Only current leader can transfer leadership';
  end if;
  if not exists(select 1 from public.guild_members where guild_id = p_guild_id and user_id = p_new_leader_id) then
    raise exception 'New leader must be a member of the guild';
  end if;
  update public.guilds set leader_id = p_new_leader_id, updated_at = now() where id = p_guild_id;
  update public.guild_members set role = 'member' where guild_id = p_guild_id and user_id = p_old_leader_id;
  update public.guild_members set role = 'leader' where guild_id = p_guild_id and user_id = p_new_leader_id;
end;
$$;
grant execute on function public.rpc_guild_transfer_leader(uuid, uuid, uuid) to anon, authenticated;