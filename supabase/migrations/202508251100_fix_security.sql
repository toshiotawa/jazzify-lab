-- Security hardening: fix view security and enable RLS on public tables

-- 1) Views: run with invoker's rights so RLS applies
do $$ begin
  -- Postgres 15+ supports security_invoker on views
  if exists (
    select 1 from pg_views v where v.schemaname = 'public' and v.viewname = 'view_level_ranking'
  ) then
    execute 'alter view public.view_level_ranking set (security_invoker = on)';
  end if;

  if exists (
    select 1 from pg_views v where v.schemaname = 'public' and v.viewname = 'v_suspicious_guild_success'
  ) then
    execute 'alter view public.v_suspicious_guild_success set (security_invoker = on)';
  end if;
end $$;

-- 2) practice_diaries: enable RLS and add policies
alter table if exists public.practice_diaries enable row level security;

-- Allow read for all (anon/auth). Adjust later if stricter access is needed.
drop policy if exists "practice_diaries_select_public" on public.practice_diaries;
create policy "practice_diaries_select_public"
  on public.practice_diaries
  for select
  using (true);

-- Allow insert by owner (JWT subject)
drop policy if exists "practice_diaries_insert_own" on public.practice_diaries;
create policy "practice_diaries_insert_own"
  on public.practice_diaries
  for insert
  with check (auth.uid() = user_id);

-- Allow update by owner
drop policy if exists "practice_diaries_update_own" on public.practice_diaries;
create policy "practice_diaries_update_own"
  on public.practice_diaries
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow delete by owner
drop policy if exists "practice_diaries_delete_own" on public.practice_diaries;
create policy "practice_diaries_delete_own"
  on public.practice_diaries
  for delete
  using (auth.uid() = user_id);

-- 3) lesson_videos: enable RLS and allow public read only
alter table if exists public.lesson_videos enable row level security;

drop policy if exists "lesson_videos_select_public" on public.lesson_videos;
create policy "lesson_videos_select_public"
  on public.lesson_videos
  for select
  using (true);


