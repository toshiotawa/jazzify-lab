-- Fix RLS performance advisor warnings
-- 1) Wrap auth.* calls in RLS policies with (select auth.*()) to avoid per-row re-evaluation initplan
-- 2) Drop duplicate indexes safely

-- POLICIES: We re-create affected policies with SELECT-wrapped auth calls.
-- Note: Using IF EXISTS on drop to be idempotent.

-- profiles
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (
    (select auth.uid()) = id or (select auth.role()) = 'service_role'
  ) with check (
    (select auth.uid()) = id or (select auth.role()) = 'service_role'
  );

drop policy if exists profiles_owner_update on public.profiles;
create policy profiles_owner_update on public.profiles
  for update using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists profiles_update_admin on public.profiles;
create policy profiles_update_admin on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (
    (select auth.uid()) = id
  );

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check ((select auth.uid()) = id);

drop policy if exists profiles_public_read on public.profiles;
create policy profiles_public_read on public.profiles
  for select using (true);

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (
    id = (select auth.uid()) or true
  );

-- songs
drop policy if exists songs_public_read on public.songs;
create policy songs_public_read on public.songs for select using (true);

drop policy if exists songs_admin_insert on public.songs;
create policy songs_admin_insert on public.songs
  for insert with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  );

drop policy if exists songs_admin_update on public.songs;
create policy songs_admin_update on public.songs
  for update using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  );

drop policy if exists songs_admin_delete on public.songs;
create policy songs_admin_delete on public.songs
  for delete using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  );

-- lessons / courses / lesson_songs / lesson_tracks: make admin checks use SELECT wrapper
drop policy if exists "Allow admin full access on lessons" on public.lessons;
create policy "Allow admin full access on lessons" on public.lessons for all
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  );

drop policy if exists "Allow admin full access on courses" on public.courses;
create policy "Allow admin full access on courses" on public.courses for all
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  );

drop policy if exists "Allow admin full access on lesson_songs" on public.lesson_songs;
create policy "Allow admin full access on lesson_songs" on public.lesson_songs for all
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  );

drop policy if exists "Only admins can manage songs" on public.songs;
create policy "Only admins can manage songs" on public.songs for all
  using (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  ) with check (
    exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
  );

-- diaries and related
drop policy if exists practice_diaries_insert_own on public.practice_diaries;
create policy practice_diaries_insert_own on public.practice_diaries for insert with check ((select auth.uid()) = user_id);

drop policy if exists practice_diaries_update_own on public.practice_diaries;
create policy practice_diaries_update_own on public.practice_diaries for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

drop policy if exists practice_diaries_delete_own on public.practice_diaries;
create policy practice_diaries_delete_own on public.practice_diaries for delete using ((select auth.uid()) = user_id);

-- lesson_videos / lesson_attachments admin policies (guard if relation exists)
do $$ begin
  if to_regclass('public.lesson_videos') is not null then
    execute 'drop policy if exists lesson_videos_admin_all_policy on public.lesson_videos';
    execute 'create policy lesson_videos_admin_all_policy on public.lesson_videos
      for all using (
        (select auth.uid()) in (select id from public.profiles where is_admin = true)
      ) with check (
        (select auth.uid()) in (select id from public.profiles where is_admin = true)
      )';
  end if;
end $$;

do $$ begin
  if to_regclass('public.lesson_attachments') is not null then
    execute 'drop policy if exists lesson_attachments_admin_all_policy on public.lesson_attachments';
    execute 'create policy lesson_attachments_admin_all_policy on public.lesson_attachments
      for all using (
        (select auth.uid()) in (select id from public.profiles where is_admin = true)
      ) with check (
        (select auth.uid()) in (select id from public.profiles where is_admin = true)
      )';
  end if;
end $$;

-- notifications update policy
drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications for update using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- notifications select policy
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications for select using ((select auth.uid()) = user_id);

-- guild policies: wrap auth.uid()/role
drop policy if exists guilds_update_leader on public.guilds;
create policy guilds_update_leader on public.guilds for update using ((select auth.uid()) = leader_id) with check ((select auth.uid()) = leader_id);

drop policy if exists guilds_delete_leader on public.guilds;
create policy guilds_delete_leader on public.guilds for delete using ((select auth.uid()) = leader_id);

drop policy if exists guild_members_select_visible on public.guild_members;
create policy guild_members_select_visible on public.guild_members for select using (
  user_id = (select auth.uid()) or exists(select 1 from public.guilds g where g.id = guild_members.guild_id and g.leader_id = (select auth.uid()))
);

drop policy if exists guild_invite_select on public.guild_invitations;
create policy guild_invite_select on public.guild_invitations for select using (
  inviter_id = (select auth.uid()) or invitee_id = (select auth.uid()) or exists(select 1 from public.guilds g where g.id = public.guild_invitations.guild_id and g.leader_id = (select auth.uid()))
);

drop policy if exists guild_join_req_select on public.guild_join_requests;
create policy guild_join_req_select on public.guild_join_requests for select using (
  requester_id = (select auth.uid()) or exists(select 1 from public.guilds g where g.id = public.guild_join_requests.guild_id and g.leader_id = (select auth.uid()))
);

drop policy if exists guild_members_delete_self on public.guild_members;
create policy guild_members_delete_self on public.guild_members for delete using (user_id = (select auth.uid()));

-- guild board policies
drop policy if exists guild_posts_rw on public.guild_posts;
create policy guild_posts_rw on public.guild_posts for all using (
  exists(select 1 from public.guild_members gm where gm.guild_id = public.guild_posts.guild_id and gm.user_id = (select auth.uid()))
) with check (
  exists(select 1 from public.guild_members gm where gm.guild_id = public.guild_posts.guild_id and gm.user_id = (select auth.uid()))
);

drop policy if exists guild_post_comments_rw on public.guild_post_comments;
create policy guild_post_comments_rw on public.guild_post_comments for all using (
  exists(select 1 from public.guild_posts p join public.guild_members gm on gm.guild_id = p.guild_id where p.id = public.guild_post_comments.post_id and gm.user_id = (select auth.uid()))
) with check (
  exists(select 1 from public.guild_posts p join public.guild_members gm on gm.guild_id = p.guild_id where p.id = public.guild_post_comments.post_id and gm.user_id = (select auth.uid()))
);

drop policy if exists guild_post_likes_rw on public.guild_post_likes;
create policy guild_post_likes_rw on public.guild_post_likes for all using (
  exists(select 1 from public.guild_posts p join public.guild_members gm on gm.guild_id = p.guild_id where p.id = public.guild_post_likes.post_id and gm.user_id = (select auth.uid()))
) with check (
  exists(select 1 from public.guild_posts p join public.guild_members gm on gm.guild_id = p.guild_id where p.id = public.guild_post_likes.post_id and gm.user_id = (select auth.uid()))
);

-- fantasy_* policies (read/write)
drop policy if exists fantasy_bgm_assets_write_policy on public.fantasy_bgm_assets;
create policy fantasy_bgm_assets_write_policy on public.fantasy_bgm_assets for all using (
  (select auth.role()) = 'service_role' or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
) with check (
  (select auth.role()) = 'service_role' or exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.is_admin = true)
);

-- guild_member_streaks policies
drop policy if exists "Users can read their own streak data" on public.guild_member_streaks;
create policy "Users can read their own streak data" on public.guild_member_streaks for select using ((select auth.uid()) = user_id);

drop policy if exists "Guild members can read guild streak data" on public.guild_member_streaks;
create policy "Guild members can read guild streak data" on public.guild_member_streaks for select using (
  exists (
    select 1
    from public.guild_members gm1
    join public.guild_members gm2 on gm1.guild_id = gm2.guild_id
    where gm1.user_id = (select auth.uid()) and gm2.user_id = public.guild_member_streaks.user_id
  )
);

drop policy if exists "System can manage streak data" on public.guild_member_streaks;
create policy "System can manage streak data" on public.guild_member_streaks for all using ((select auth.role()) = 'service_role');

-- comment_likes policies
drop policy if exists comment_likes_insert_own on public.comment_likes;
create policy comment_likes_insert_own on public.comment_likes for insert with check ((select auth.uid()) = user_id);

drop policy if exists comment_likes_delete_own on public.comment_likes;
create policy comment_likes_delete_own on public.comment_likes for delete using ((select auth.uid()) = user_id);

-- Multiple permissive policies: we do not change policy counts here to avoid behavior changes.
-- Consider consolidating read policies in a later migration if needed for performance.

-- ============
-- DUP INDEXES
-- ============

-- songs: keep songs_min_rank_idx, drop legacy idx_songs_min_rank if exists
do $$ begin
  if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname='public' and c.relname='idx_songs_min_rank') then
    execute 'drop index if exists public.idx_songs_min_rank';
  end if;
end $$;

-- user_lesson_requirements_progress: drop one of identical partial indexes (keep ..._lesson_song)
do $$ begin
  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname='public' and c.relname='idx_user_lesson_requirements_progress_unique'
  ) then
    execute 'drop index if exists public.idx_user_lesson_requirements_progress_unique';
  end if;
end $$;


