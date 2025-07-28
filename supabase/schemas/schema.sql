-- Jazz Learning Game – Supabase Schema
-- 実行手順:
-- 1. Supabase SQL Editor または `supabase db reset` でこのスキーマを適用
-- 2. auth.users テーブルは Supabase デフォルトで存在するため参照のみ行う

-- 会員ランク ENUM
create type public.membership_rank as enum ('free', 'standard', 'premium', 'platinum');

-- ユーザープロフィール
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text unique not null,
  nickname text not null,
  rank public.membership_rank not null default 'free',
  xp bigint not null default 0,
  level integer not null default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  next_season_xp_multiplier numeric not null default 1.0,
  is_admin boolean not null default false
);

alter table public.profiles enable row level security;

-- 楽曲テーブル
create table public.songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text,
  bpm integer,
  difficulty integer, -- 1–10 など
  data jsonb not null, -- MusicXML や内部 JSON 構造
  min_rank public.membership_rank not null default 'free',
  is_public boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  usage_type text not null default 'general',
  constraint check_song_usage_type check (usage_type in ('general', 'lesson'))
);

alter table public.songs enable row level security;

-- ユーザー × 楽曲 成績
create table public.user_song_stats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  song_id uuid references public.songs(id) on delete cascade,
  best_rank text,     -- 'S','A','B','C' 等
  best_score integer,
  clear_count integer not null default 0,
  last_played timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, song_id)
);

-- コース → レッスン → 曲 / 動画
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  min_rank public.membership_rank not null default 'premium',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses(id) on delete cascade,
  title text not null,
  description text,
  order_index integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- コース前提条件テーブル
create table public.course_prerequisites (
  course_id uuid not null references public.courses(id) on delete cascade,
  prerequisite_course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, prerequisite_course_id)
);

-- ユーザーコース進捗テーブル
create table public.user_course_progress (
  user_id uuid not null references public.profiles(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  is_unlocked boolean not null default false,
  locked_at timestamptz,
  unlocked_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (user_id, course_id)
);

-- ユーザー楽曲プレイ進捗テーブル
create table public.user_song_play_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  context_type text not null check (context_type in ('mission', 'lesson', 'general')),
  context_id uuid,
  clear_count integer not null default 0,
  best_rank text,
  best_score integer,
  last_cleared_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, song_id, context_type, context_id)
);

-- Lesson に紐づく曲
create table public.lesson_songs (
  id uuid default gen_random_uuid() not null primary key,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  song_id uuid not null references public.songs(id) on delete cascade,
  order_index integer not null default 0,
  clear_conditions jsonb,
  created_at timestamp with time zone default now() not null,
  constraint lesson_songs_lesson_id_song_id_key unique (lesson_id, song_id)
);

-- lesson_songs indexes
create index if not exists idx_lesson_songs_lesson_id on public.lesson_songs(lesson_id);
create index if not exists idx_lesson_songs_song_id on public.lesson_songs(song_id);

-- lesson_songs RLS
alter table public.lesson_songs enable row level security;

create policy "Admin can manage lesson songs" on public.lesson_songs
  for all using ( (select is_admin from public.profiles where auth.uid() = id) = true )
  with check ( (select is_admin from public.profiles where auth.uid() = id) = true );

create policy "Authenticated users can view lesson songs" on public.lesson_songs
  for select using ( auth.role() = 'authenticated' );

-- Lesson 動画 (Vimeo 埋め込み用)
create table public.lesson_videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  vimeo_url text not null,
  order_index integer not null default 0
);

-- チャレンジ / ミッション
create type public.challenge_type as enum ('weekly', 'monthly');
create type public.challenge_category as enum ('diary', 'song_clear');

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  type public.challenge_type not null,
  category public.challenge_category not null default 'song_clear',
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  reward_multiplier numeric not null default 1.3,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  diary_count integer,
  song_clear_count integer
);

create table public.challenge_tracks (
  challenge_id uuid references public.challenges(id) on delete cascade,
  song_id uuid references public.songs(id) on delete cascade,
  key_offset integer default 0,
  min_speed numeric default 1.0,
  min_rank text default 'B',
  min_clear_count integer default 1,
  notation_setting text default 'both',
  primary key (challenge_id, song_id)
);

-- ユーザー進捗 (チャレンジ / ミッション)
create table public.user_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  challenge_id uuid references public.challenges(id) on delete cascade,
  clear_count integer not null default 0,
  completed boolean not null default false,
  reward_claimed boolean not null default false,
  unique (user_id, challenge_id)
);

-- チャレンジ進捗テーブル（古い形式）
create table public.challenge_progress (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  completed_clears integer not null default 0,
  is_completed boolean default false,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id),
  unique (user_id, challenge_id)
);

-- 経験値履歴 (ステージ終了毎)
create table public.xp_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  song_id uuid references public.songs(id),
  gained_xp integer not null,
  base_xp integer not null,
  speed_multiplier numeric not null,
  rank_multiplier numeric not null,
  transpose_multiplier numeric not null,
  membership_multiplier numeric not null,
  mission_multiplier numeric not null default 1.0,
  reason text not null default 'unknown',
  created_at timestamptz default now()
);

-- RLS: xp_history は本人のみ参照 / 挿入可
alter table public.xp_history enable row level security;
create policy "xp_owner_select" on public.xp_history for select using ( auth.uid() = user_id );
create policy "xp_owner_insert" on public.xp_history for insert with check ( auth.uid() = user_id );

-- 練習日記
create table public.practice_diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  practice_date date not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, practice_date)
);

-- RLS: practice_diaries (公開読み取り、本人のみ書き込み・編集・削除)
alter table public.practice_diaries enable row level security;
create policy "diary_select" on public.practice_diaries for select using ( true );
create policy "diary_insert" on public.practice_diaries for insert with check ( auth.uid() = user_id );
create policy "diary_update" on public.practice_diaries for update using ( auth.uid() = user_id );
create policy "diary_delete" on public.practice_diaries for delete using ( auth.uid() = user_id );

create table public.diary_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  diary_id uuid references public.practice_diaries(id) on delete cascade,
  primary key (user_id, diary_id)
);

-- RLS: diary_likes (本人のみ insert/delete, 公開 select)
alter table public.diary_likes enable row level security;
create policy "likes_select" on public.diary_likes for select using ( true );
create policy "likes_insert" on public.diary_likes for insert with check ( auth.uid() = user_id );
create policy "likes_delete" on public.diary_likes for delete using ( auth.uid() = user_id );

-- RPC: 練習日記投稿でミッション進捗を +1
create or replace function public.increment_diary_progress(
  _user_id uuid,
  _mission_id uuid
) returns void
language plpgsql
security definer
as $$
begin
  insert into public.user_challenge_progress (user_id, challenge_id, clear_count)
       values (_user_id, _mission_id, 1)
  on conflict (user_id, challenge_id)
  do update set clear_count = user_challenge_progress.clear_count + 1;
end;
$$;

-- 日記コメント
create table public.diary_comments (
  id uuid primary key default gen_random_uuid(),
  diary_id uuid references public.practice_diaries(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table public.diary_comments enable row level security;

create policy "comments_public_read" on public.diary_comments for select using ( true );
create policy "comments_owner_insert" on public.diary_comments for insert with check ( auth.uid() = user_id );
create policy "comments_owner_delete" on public.diary_comments for delete using ( auth.uid() = user_id );

create index if not exists comments_diary_idx on public.diary_comments (diary_id);

-- ------------------------------------------------------------
-- RLS & Indexes for Challenge System (2024-07-10)
-- ------------------------------------------------------------

-- challenges: 全ユーザー読み取り可、admin のみ書き込み可
alter table public.challenges enable row level security;

create policy "challenges_read_all" on public.challenges
  for select using ( true );

create policy "challenges_admin_modify" on public.challenges
  for all
  using ( (select is_admin from public.profiles where id = auth.uid()) )
  with check ( (select is_admin from public.profiles where id = auth.uid()) );

-- challenge_tracks: 全ユーザー読み取り可、admin のみ書き込み可
alter table public.challenge_tracks enable row level security;

create policy "challenge_tracks_read_all" on public.challenge_tracks
  for select using ( true );

create policy "challenge_tracks_admin_modify" on public.challenge_tracks
  for all
  using ( (select is_admin from public.profiles where id = auth.uid()) )
  with check ( (select is_admin from public.profiles where id = auth.uid()) );

-- user_challenge_progress: 本人のみ読み書き可
alter table public.user_challenge_progress enable row level security;

create policy "progress_owner_select" on public.user_challenge_progress
  for select using ( auth.uid() = user_id );

create policy "progress_owner_modify" on public.user_challenge_progress
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- Indexes for performance
create index if not exists challenges_active_idx
  on public.challenges (start_date, end_date);

create index if not exists progress_user_idx
  on public.user_challenge_progress (user_id);

-- ------------------------------------------------------------
-- Lesson Progress System (2024-12-19)
-- ------------------------------------------------------------

-- ユーザー × レッスン 進捗
create table public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  lesson_id uuid references public.lessons(id) on delete cascade,
  course_id uuid references public.courses(id) on delete cascade,
  completed boolean not null default false,
  completion_date timestamptz,
  unlock_date timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, lesson_id)
);

alter table public.user_lesson_progress enable row level security;

-- RLS: user_lesson_progress は本人のみ読み書き可
create policy "lesson_progress_owner_select" on public.user_lesson_progress
  for select using ( auth.uid() = user_id );

create policy "lesson_progress_owner_modify" on public.user_lesson_progress
  for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- Lesson Progress Indexes
create index if not exists lesson_progress_user_idx
  on public.user_lesson_progress (user_id);

create index if not exists lesson_progress_course_idx
  on public.user_lesson_progress (user_id, course_id);

create index if not exists lesson_progress_completion_idx
  on public.user_lesson_progress (user_id, completed, completion_date);

-- ------------------------------------------------------------
-- Announcement System (2024-12-19)
-- ------------------------------------------------------------

-- お知らせテーブル
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  link_url text,
  link_text text,
  is_active boolean not null default true,
  priority integer not null default 1,
  created_by uuid references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.announcements enable row level security;

-- RLS: お知らせ
create policy "announcements_public_read" on public.announcements
  for select using ( is_active = true );

create policy "announcements_admin_read" on public.announcements
  for select using ( (select is_admin from public.profiles where id = auth.uid()) );

create policy "announcements_admin_modify" on public.announcements
  for all
  using ( (select is_admin from public.profiles where id = auth.uid()) )
  with check ( (select is_admin from public.profiles where id = auth.uid()) );

-- インデックス
create index if not exists announcements_active_idx
  on public.announcements (is_active, priority, created_at);

create index if not exists announcements_created_by_idx
  on public.announcements (created_by); 

-- ------------------------------------------------------------
-- Additional Indexes and RLS for New Tables
-- ------------------------------------------------------------

-- course_prerequisites indexes
create index if not exists idx_course_prerequisites_course_id on public.course_prerequisites(course_id);
create index if not exists idx_course_prerequisites_prerequisite_id on public.course_prerequisites(prerequisite_course_id);

-- user_course_progress indexes
create index if not exists user_course_progress_user_idx on public.user_course_progress(user_id);
create index if not exists user_course_progress_course_idx on public.user_course_progress(course_id);
create index if not exists user_course_progress_unlocked_idx on public.user_course_progress(is_unlocked);

-- user_song_play_progress indexes
create index if not exists idx_user_song_play_progress_user_id on public.user_song_play_progress(user_id);
create index if not exists idx_user_song_play_progress_song_id on public.user_song_play_progress(song_id);
create index if not exists idx_user_song_play_progress_context on public.user_song_play_progress(context_type, context_id);
create index if not exists idx_user_song_play_progress_user_context on public.user_song_play_progress(user_id, context_type, context_id);
create index if not exists idx_user_song_play_progress_user_song on public.user_song_play_progress(user_id, song_id);

-- challenge_progress indexes
create index if not exists idx_challenge_progress_user_id on public.challenge_progress(user_id);
create index if not exists idx_challenge_progress_challenge_id on public.challenge_progress(challenge_id);
create index if not exists idx_challenge_progress_completed on public.challenge_progress(is_completed);

-- RLS for new tables
alter table public.course_prerequisites enable row level security;
alter table public.user_course_progress enable row level security;
alter table public.user_song_play_progress enable row level security;
alter table public.challenge_progress enable row level security;

-- course_prerequisites RLS policies
create policy "Allow admin full access on course_prerequisites" on public.course_prerequisites
  for all using ( (select is_admin from public.profiles where auth.uid() = id) )
  with check ( (select is_admin from public.profiles where auth.uid() = id) );

create policy "Allow authenticated users to read course_prerequisites" on public.course_prerequisites
  for select using ( auth.role() = 'authenticated' );

-- user_course_progress RLS policies
create policy "course_progress_user_or_admin_select" on public.user_course_progress
  for select using ( auth.uid() = user_id or (select is_admin from public.profiles where auth.uid() = id) );

create policy "course_progress_user_or_admin_modify" on public.user_course_progress
  for all using ( auth.uid() = user_id or (select is_admin from public.profiles where auth.uid() = id) )
  with check ( auth.uid() = user_id or (select is_admin from public.profiles where auth.uid() = id) );

-- user_song_play_progress RLS policies
create policy "Users can read their own song play progress" on public.user_song_play_progress
  for select using ( auth.uid() = user_id );

create policy "Users can manage their own song play progress" on public.user_song_play_progress
  for all using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

create policy "Admin can read all song play progress" on public.user_song_play_progress
  for select using ( (select is_admin from public.profiles where auth.uid() = id) );

-- challenge_progress RLS policies
create policy "Users can view their own challenge progress" on public.challenge_progress
  for select using ( auth.uid() = user_id );

create policy "Users can insert their own challenge progress" on public.challenge_progress
  for insert with check ( auth.uid() = user_id );

create policy "Users can update their own challenge progress" on public.challenge_progress
  for update using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- course_prerequisites constraint
alter table public.course_prerequisites add constraint no_self_reference 
  check (course_id != prerequisite_course_id);

-- Database → Replication → Publication で追加
alter publication supabase_realtime
  add table public.practice_diaries,
          public.diary_comments;

-- ------------------------------------------------------------
-- XP Calculation Functions (Updated 2025-01-24)
-- ------------------------------------------------------------

-- Helper function to calculate required XP for next level
CREATE OR REPLACE FUNCTION public.xp_to_next_level(current_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN current_level <= 10 THEN 2000
    WHEN current_level <= 50 THEN 50000
    ELSE 100000
  END;
$$;

-- Helper function to calculate level from total XP
CREATE OR REPLACE FUNCTION public.calculate_level_from_xp(total_xp bigint)
RETURNS integer
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  level_counter integer := 1;
  remaining_xp bigint := total_xp;
  required_xp integer;
BEGIN
  WHILE remaining_xp > 0 LOOP
    required_xp := public.xp_to_next_level(level_counter);
    IF remaining_xp >= required_xp THEN
      remaining_xp := remaining_xp - required_xp;
      level_counter := level_counter + 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN level_counter;
END;
$$;

-- Updated add_xp function with new level calculation logic
CREATE OR REPLACE FUNCTION public.add_xp(
  _user_id uuid,
  _gained_xp integer,
  _reason text DEFAULT 'unknown',
  _song_id uuid DEFAULT NULL,
  _mission_multiplier numeric DEFAULT 1.0
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  _current_xp bigint;
  _new_xp bigint;
  _current_level integer;
  _new_level integer;
  _result json;
BEGIN
  -- Get current XP and level
  SELECT xp, level INTO _current_xp, _current_level
  FROM public.profiles
  WHERE id = _user_id;
  
  -- If user doesn't exist, return error
  IF _current_xp IS NULL THEN
    RETURN json_build_object('error', 'User not found');
  END IF;
  
  -- Calculate new XP
  _new_xp := _current_xp + _gained_xp;
  
  -- Calculate new level using updated logic
  _new_level := public.calculate_level_from_xp(_new_xp);
  
  -- Update user's XP and level
  UPDATE public.profiles
  SET 
    xp = _new_xp,
    level = _new_level,
    updated_at = now()
  WHERE id = _user_id;
  
  -- Insert XP history record
  INSERT INTO public.xp_history (
    user_id,
    gained_xp,
    reason,
    song_id,
    mission_multiplier,
    created_at
  ) VALUES (
    _user_id,
    _gained_xp,
    _reason,
    _song_id,
    _mission_multiplier,
    now()
  );
  
  -- Return result
  SELECT json_build_object(
    'success', true,
    'previous_xp', _current_xp,
    'gained_xp', _gained_xp,
    'new_xp', _new_xp,
    'previous_level', _current_level,
    'new_level', _new_level,
    'level_up', _new_level > _current_level
  ) INTO _result;
  
  RETURN _result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.add_xp TO authenticated;
GRANT EXECUTE ON FUNCTION public.xp_to_next_level TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_level_from_xp TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.add_xp IS 'Adds XP to a user and maintains XP history. Uses updated level calculation: 1-10: 2k XP, 11-50: 50k XP, 51+: 100k XP per level.';
COMMENT ON FUNCTION public.xp_to_next_level IS 'Returns XP required for next level based on current level.';
COMMENT ON FUNCTION public.calculate_level_from_xp IS 'Calculates player level from total XP using new progression system.';