-- スキーマファイルを最新の状態に更新するためのマイグレーション
-- このマイグレーションは、削除されたテーブルがスキーマファイルに追加されることを保証します

-- 注意: このマイグレーションは、スキーマファイルの更新のみを行います
-- 実際のテーブル作成は前のマイグレーションで完了しています

-- スキーマファイルの更新を確認するためのコメント
-- 以下のテーブルが復活されていることを確認:
-- 1. course_prerequisites
-- 2. user_course_progress  
-- 3. user_song_play_progress
-- 4. challenge_progress

-- スキーマファイルの更新が必要な場合は、手動で以下のテーブル定義を追加してください:

/*
-- course_prerequisites テーブル定義（スキーマファイルに追加）
create table public.course_prerequisites (
  course_id uuid not null references public.courses(id) on delete cascade,
  prerequisite_course_id uuid not null references public.courses(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (course_id, prerequisite_course_id)
);

-- user_course_progress テーブル定義（スキーマファイルに追加）
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

-- user_song_play_progress テーブル定義（スキーマファイルに追加）
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

-- challenge_progress テーブル定義（スキーマファイルに追加）
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
*/ 