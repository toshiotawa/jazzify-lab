-- profilesテーブルのRLSポリシー

-- 既存のポリシーを削除（存在する場合）
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;

-- 全ユーザーが全プロフィールを読み取り可能
create policy "profiles_select" on public.profiles
  for select using ( true );

-- ユーザーは自分のプロフィールのみ作成可能
create policy "profiles_insert" on public.profiles
  for insert with check ( auth.uid() = id );

-- ユーザーは自分のプロフィールのみ更新可能
create policy "profiles_update" on public.profiles
  for update using ( auth.uid() = id )
  with check ( auth.uid() = id );

-- 管理者は他のユーザーのプロフィールも更新可能
create policy "profiles_update_admin" on public.profiles
  for update using (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and is_admin = true
    )
  ); 