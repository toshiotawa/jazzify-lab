-- Disallow likes on deleted diaries/comments via RLS check-policies

-- For diary_likes: only allow insert if target diary exists and is not deleted
drop policy if exists likes_insert_not_deleted on public.diary_likes;
create policy likes_insert_not_deleted on public.diary_likes
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.practice_diaries d
      where d.id = diary_id and coalesce(d.is_deleted,false) = false
    )
  );

-- For comment_likes: only allow insert if target comment exists and is not deleted
drop policy if exists comment_likes_insert_not_deleted on public.comment_likes;
create policy comment_likes_insert_not_deleted on public.comment_likes
  for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.diary_comments c
      where c.id = comment_id and coalesce(c.is_deleted,false) = false
    )
  );

