-- 修正: RLSとリクエストのキャンセルフロー、脱退RPC、満員時の自動取り下げ

-- disbanded フラグが参照されているため、念のためカラムを用意
alter table if exists public.guilds
  add column if not exists disbanded boolean not null default false;

-- 3) メンバー一覧RLS: 同一ギルド所属者は全メンバーを閲覧可能にする
drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_same_guild on public.guild_members
for select using (
  exists (
    select 1
    from public.guild_members gm2
    where gm2.guild_id = guild_members.guild_id
      and gm2.user_id = auth.uid()
  )
);

-- 6) リーダーによるleader_id変更を許可（with checkを緩める）
drop policy if exists guilds_update_leader on public.guilds;
create policy guilds_update_leader on public.guilds
for update
using (auth.uid() = leader_id)
with check (true);

-- 5) 脱退用RPC（メンバーはそのまま抜ける。リーダーは後任アサイン、いなければギルド削除）
create or replace function public.rpc_guild_leave()
returns void
language plpgsql
security definer
as $$
declare
  _uid uuid := auth.uid();
  _gid uuid;
  _role text;
  _new_leader uuid;
  _members_count integer;
begin
  if _uid is null then
    raise exception 'Auth required';
  end if;

  select gm.guild_id, gm.role
    into _gid, _role
  from public.guild_members gm
  where gm.user_id = _uid;

  if _gid is null then
    raise exception 'Not in a guild';
  end if;

  if _role <> 'leader' then
    delete from public.guild_members where guild_id = _gid and user_id = _uid;
    return;
  end if;

  select count(*) into _members_count
  from public.guild_members
  where guild_id = _gid;

  if _members_count <= 1 then
    -- リーダー1人だけ -> ギルド削除（メンバーはカスケードで消える）
    delete from public.guilds where id = _gid;
    return;
  end if;

  -- 後任リーダーを最古参メンバーから選出
  select user_id into _new_leader
  from public.guild_members
  where guild_id = _gid and user_id <> _uid
  order by joined_at asc
  limit 1;

  if _new_leader is null then
    delete from public.guilds where id = _gid;
    return;
  end if;

  update public.guilds
    set leader_id = _new_leader, updated_at = now()
  where id = _gid;

  update public.guild_members
    set role = 'leader'
  where guild_id = _gid and user_id = _new_leader;

  delete from public.guild_members where guild_id = _gid and user_id = _uid;
end;
$$;

grant execute on function public.rpc_guild_leave() to anon, authenticated;

-- 4) 自分の参加リクエストをキャンセルするRPC
create or replace function public.rpc_guild_cancel_request(p_guild_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  if auth.uid() is null then raise exception 'Auth required'; end if;

  update public.guild_join_requests
     set status = 'cancelled', updated_at = now()
   where guild_id = p_guild_id
     and requester_id = auth.uid()
     and status = 'pending';
end;
$$;

grant execute on function public.rpc_guild_cancel_request(uuid) to anon, authenticated;

-- 4,8) ギルドメンバーが追加されたとき:
--   - 当人の他ギルドへの未承認リクエストは全てキャンセル
--   - そのギルドが満員(>=5)になったら当該ギルド宛ての未承認リクエストと未処理の招待を全てキャンセル
create or replace function public.on_guild_member_insert_cleanup()
returns trigger
language plpgsql
security definer
as $$
declare
  _cnt integer;
begin
  update public.guild_join_requests
     set status = 'cancelled', updated_at = now()
   where requester_id = new.user_id and status = 'pending';

  select count(*) into _cnt from public.guild_members where guild_id = new.guild_id;

  if _cnt >= 5 then
    update public.guild_join_requests
       set status = 'cancelled', updated_at = now()
     where guild_id = new.guild_id and status = 'pending';

    update public.guild_invitations
       set status = 'cancelled', updated_at = now()
     where guild_id = new.guild_id and status = 'pending';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_guild_member_insert_cleanup on public.guild_members;
create trigger trg_guild_member_insert_cleanup
after insert on public.guild_members
for each row execute function public.on_guild_member_insert_cleanup();
