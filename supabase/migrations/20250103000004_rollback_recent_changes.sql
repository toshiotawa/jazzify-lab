-- 20250103000000_add_leader_leave_function.sql の取り消し
drop function if exists public.rpc_guild_leader_leave();

-- 20250103000001_add_disbanded_column.sql の取り消し
drop index if exists idx_guilds_disbanded;
alter table public.guilds drop column if exists disbanded;

-- 20250103000002_fix_guild_disband_unique_name.sql の取り消し
-- 元のrpc_guild_disband_and_clear_members関数を復元
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
  update public.guilds set disbanded = true, name = '解散したギルド', updated_at = now() where id = p_guild_id;
  delete from public.guild_members where guild_id = p_guild_id;
end;
$$;

-- 注意: disbanded カラムを削除した後、この関数も更新が必要な場合があります
-- もしdisbandedカラムが存在しない場合のバージョン
create or replace function public.rpc_guild_disband_and_clear_members_no_disbanded(p_guild_id uuid)
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
  -- disbandedカラムが存在しない場合は、ギルドを直接削除
  delete from public.guild_members where guild_id = p_guild_id;
  delete from public.guilds where id = p_guild_id;
end;
$$;

-- コメント: 
-- このロールバックスクリプトを実行後、アプリケーションコードも元に戻す必要があります。
-- 特に以下のファイルの変更を元に戻してください：
-- - src/platform/supabaseGuilds.ts (leaveMyGuild, disbandMyGuild関数)
-- - src/components/guild/GuildDashboard.tsx
-- - src/components/guild/GuildPage.tsx