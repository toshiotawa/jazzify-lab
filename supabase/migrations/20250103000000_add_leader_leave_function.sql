-- リーダーが脱退する際の処理を行うRPC関数
create or replace function public.rpc_guild_leader_leave()
returns void
language plpgsql
security definer
as $$
declare
  _uid uuid;
  _guild_id uuid;
  _next_leader_id uuid;
begin
  _uid := auth.uid();
  if _uid is null then
    raise exception 'Auth required';
  end if;

  -- 現在のギルドとリーダー確認
  select gm.guild_id into _guild_id
  from public.guild_members gm
  join public.guilds g on g.id = gm.guild_id
  where gm.user_id = _uid
    and g.leader_id = _uid;

  if _guild_id is null then
    raise exception 'You are not a guild leader';
  end if;

  -- 次のリーダー候補を取得（最も早く参加したメンバー）
  select user_id into _next_leader_id
  from public.guild_members
  where guild_id = _guild_id
    and user_id != _uid
  order by joined_at asc
  limit 1;

  if _next_leader_id is null then
    raise exception 'No other members to transfer leadership';
  end if;

  -- リーダー権限を移譲
  update public.guilds
  set leader_id = _next_leader_id
  where id = _guild_id;

  -- 新リーダーのroleを更新（roleカラムが存在する場合のみ）
  update public.guild_members
  set role = 'leader'
  where guild_id = _guild_id
    and user_id = _next_leader_id
    and exists (
      select 1 
      from information_schema.columns 
      where table_schema = 'public' 
        and table_name = 'guild_members' 
        and column_name = 'role'
    );

  -- 元リーダーをギルドから削除
  delete from public.guild_members
  where guild_id = _guild_id
    and user_id = _uid;
end;
$$;

-- 関数の権限設定
grant execute on function public.rpc_guild_leader_leave() to authenticated;