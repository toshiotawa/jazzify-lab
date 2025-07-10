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
  updated_at timestamptz default now()
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

-- Lesson に紐づく曲
create table public.lesson_songs (
  lesson_id uuid references public.lessons(id) on delete cascade,
  song_id uuid references public.songs(id) on delete cascade,
  key_offset integer default 0,
  min_speed numeric default 1.0,
  min_rank text default 'B',
  min_clear_count integer default 1,
  notation_setting text default 'both', -- 'notes_chords' | 'chords_only'
  primary key (lesson_id, song_id)
);

-- Lesson 動画 (Vimeo 埋め込み用)
create table public.lesson_videos (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete cascade,
  vimeo_url text not null,
  order_index integer not null default 0
);

-- チャレンジ / ミッション
create type public.challenge_type as enum ('weekly', 'monthly');

create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  type public.challenge_type not null,
  title text not null,
  description text,
  start_date date not null,
  end_date date not null,
  reward_multiplier numeric not null default 1.3,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  diary_count integer
);

create table public.challenge_songs (
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

-- RLS: practice_diaries (公開読み取り、本人のみ書き込み)
alter table public.practice_diaries enable row level security;
create policy "diary_select" on public.practice_diaries for select using ( true );
create policy "diary_insert" on public.practice_diaries for insert with check ( auth.uid() = user_id );

create table public.diary_likes (
  user_id uuid references public.profiles(id) on delete cascade,
  diary_id uuid references public.practice_diaries(id) on delete cascade,
  primary key (user_id, diary_id)
);

-- RLS: diary_likes (本人のみ insert/delete, 公開 select)
alter table public.diary_likes enable row level security;
create policy "likes_select" on public.diary_likes for select using ( true );
create policy "likes_modify" on public.diary_likes for insert, delete with check ( auth.uid() = user_id );

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

-- ------------------------------------------------------------
-- RLS & Indexes for Challenge System (2024-07-10)
-- ------------------------------------------------------------

-- challenges: 全ユーザー読み取り可、admin のみ書き込み可
alter table public.challenges enable row level security;

create policy "challenges_read_all" on public.challenges
  for select using ( true );

create policy "challenges_admin_modify" on public.challenges
  for insert, update, delete
  using ( (select is_admin from public.profiles where id = auth.uid()) )
  with check ( (select is_admin from public.profiles where id = auth.uid()) );

-- challenge_songs: 全ユーザー読み取り可、admin のみ書き込み可
alter table public.challenge_songs enable row level security;

create policy "challenge_songs_read_all" on public.challenge_songs
  for select using ( true );

create policy "challenge_songs_admin_modify" on public.challenge_songs
  for insert, update, delete
  using ( (select is_admin from public.profiles where id = auth.uid()) )
  with check ( (select is_admin from public.profiles where id = auth.uid()) );

-- user_challenge_progress: 本人のみ読み書き可
alter table public.user_challenge_progress enable row level security;

create policy "progress_owner_select" on public.user_challenge_progress
  for select using ( auth.uid() = user_id );

create policy "progress_owner_modify" on public.user_challenge_progress
  for insert, update, delete
  with check ( auth.uid() = user_id );

-- Indexes for performance
create index if not exists challenges_active_idx
  on public.challenges (start_date, end_date);

create index if not exists progress_user_idx
  on public.user_challenge_progress (user_id); 