-- songsテーブルのRLSポリシー
-- 全ユーザーが読み取り可能
create policy "songs_public_read" on public.songs
  for select using ( true );

-- 管理者のみ挿入可能
create policy "songs_admin_insert" on public.songs
  for insert 
  with check ( 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and is_admin = true
    )
  );

-- 管理者のみ更新可能
create policy "songs_admin_update" on public.songs
  for update 
  using ( 
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

-- 管理者のみ削除可能
create policy "songs_admin_delete" on public.songs
  for delete 
  using ( 
    exists (
      select 1 from public.profiles 
      where id = auth.uid() 
      and is_admin = true
    )
  );

-- インデックスを追加（パフォーマンス向上）
create index if not exists songs_created_at_idx on public.songs (created_at);
create index if not exists songs_min_rank_idx on public.songs (min_rank);
