-- 基本的なテーブル作成マイグレーション
-- 依存関係のない基本的なテーブルから作成

-- 1. 基本的なENUM型の作成
CREATE TYPE IF NOT EXISTS public.membership_rank AS ENUM ('free', 'standard', 'premium', 'platinum');
CREATE TYPE IF NOT EXISTS public.challenge_type AS ENUM ('weekly', 'monthly');
CREATE TYPE IF NOT EXISTS public.challenge_category AS ENUM ('diary', 'song_clear');

-- 2. プロフィールテーブル（auth.usersに依存）
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    nickname text NOT NULL,
    rank public.membership_rank NOT NULL DEFAULT 'free',
    xp bigint NOT NULL DEFAULT 0,
    level integer NOT NULL DEFAULT 1,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    next_season_xp_multiplier numeric NOT NULL DEFAULT 1.0,
    is_admin boolean NOT NULL DEFAULT false
);

-- 3. 楽曲テーブル
CREATE TABLE IF NOT EXISTS public.songs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    artist text,
    bpm integer,
    difficulty integer,
    data jsonb NOT NULL,
    min_rank public.membership_rank NOT NULL DEFAULT 'free',
    is_public boolean NOT NULL DEFAULT true,
    created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    usage_type text NOT NULL DEFAULT 'general',
    CONSTRAINT check_song_usage_type CHECK (usage_type IN ('general', 'lesson'))
);

-- 4. コーステーブル
CREATE TABLE IF NOT EXISTS public.courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    min_rank public.membership_rank NOT NULL DEFAULT 'premium',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 5. レッスンテーブル
CREATE TABLE IF NOT EXISTS public.lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. チャレンジテーブル
CREATE TABLE IF NOT EXISTS public.challenges (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    type public.challenge_type NOT NULL,
    category public.challenge_category NOT NULL DEFAULT 'song_clear',
    title text NOT NULL,
    description text,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reward_multiplier numeric NOT NULL DEFAULT 1.3,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    diary_count integer,
    song_clear_count integer
);

-- 7. 練習日記テーブル
CREATE TABLE IF NOT EXISTS public.practice_diaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    practice_date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, practice_date)
);

-- 8. お知らせテーブル
CREATE TABLE IF NOT EXISTS public.announcements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    content text NOT NULL,
    link_url text,
    link_text text,
    is_active boolean NOT NULL DEFAULT true,
    priority integer NOT NULL DEFAULT 1,
    created_by uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 9. 基本的なインデックス
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_rank_idx ON public.profiles(rank);
CREATE INDEX IF NOT EXISTS songs_created_by_idx ON public.songs(created_by);
CREATE INDEX IF NOT EXISTS songs_min_rank_idx ON public.songs(min_rank);
CREATE INDEX IF NOT EXISTS songs_is_public_idx ON public.songs(is_public);
CREATE INDEX IF NOT EXISTS courses_min_rank_idx ON public.courses(min_rank);
CREATE INDEX IF NOT EXISTS lessons_course_id_idx ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS lessons_order_idx ON public.lessons(order_index);
CREATE INDEX IF NOT EXISTS challenges_active_idx ON public.challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS practice_diaries_user_id_idx ON public.practice_diaries(user_id);
CREATE INDEX IF NOT EXISTS practice_diaries_practice_date_idx ON public.practice_diaries(practice_date);
CREATE INDEX IF NOT EXISTS announcements_active_idx ON public.announcements(is_active, priority, created_at);
CREATE INDEX IF NOT EXISTS announcements_created_by_idx ON public.announcements(created_by);

-- 10. RLS有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 11. 基本的なRLSポリシー
-- profiles policies
CREATE POLICY IF NOT EXISTS "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_admin_select" ON public.profiles FOR SELECT USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
CREATE POLICY IF NOT EXISTS "profiles_admin_update" ON public.profiles FOR UPDATE USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- songs policies
CREATE POLICY IF NOT EXISTS "songs_select_public" ON public.songs FOR SELECT USING (is_public = true OR auth.uid() = created_by OR (SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
CREATE POLICY IF NOT EXISTS "songs_admin_modify" ON public.songs FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- courses policies
CREATE POLICY IF NOT EXISTS "courses_select_all" ON public.courses FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "courses_admin_modify" ON public.courses FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- lessons policies
CREATE POLICY IF NOT EXISTS "lessons_select_all" ON public.lessons FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "lessons_admin_modify" ON public.lessons FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- challenges policies
CREATE POLICY IF NOT EXISTS "challenges_read_all" ON public.challenges FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "challenges_admin_modify" ON public.challenges FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- practice_diaries policies
CREATE POLICY IF NOT EXISTS "diary_select" ON public.practice_diaries FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "diary_insert" ON public.practice_diaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "diary_update" ON public.practice_diaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "diary_delete" ON public.practice_diaries FOR DELETE USING (auth.uid() = user_id);

-- announcements policies
CREATE POLICY IF NOT EXISTS "announcements_public_read" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "announcements_admin_read" ON public.announcements FOR SELECT USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
CREATE POLICY IF NOT EXISTS "announcements_admin_modify" ON public.announcements FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
