-- 管理者が他のユーザーのプロフィールを更新できるようにするRLSポリシー修正

-- 既存の管理者更新ポリシーを削除（存在する場合）
drop policy if exists "profiles_update_admin" on public.profiles;

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