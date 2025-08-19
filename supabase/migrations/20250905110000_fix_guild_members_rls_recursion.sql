-- 修正: guild_members RLSポリシーの無限再帰を解消し、500エラーを防止

-- メンバー判定用の関数（RLSを回避）
create or replace function public.is_member_of_guild(p_guild_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists(
    select 1 from public.guild_members
    where guild_id = p_guild_id
      and user_id = auth.uid()
  );
$$;

grant execute on function public.is_member_of_guild(uuid) to anon, authenticated;

-- 既存ポリシーを置き換え
 drop policy if exists guild_members_select_same_guild on public.guild_members;
create policy guild_members_select_same_guild on public.guild_members
for select using (public.is_member_of_guild(guild_id));
