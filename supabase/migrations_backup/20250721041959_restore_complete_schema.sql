-- 本番環境のテーブル完全復元マイグレーション
-- 全てのテーブル、インデックス、RLSポリシーを復元

-- 1. 基本的なENUM型の作成
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_rank') THEN
        CREATE TYPE public.membership_rank AS ENUM ('free', 'standard', 'premium', 'platinum');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_type') THEN
        CREATE TYPE public.challenge_type AS ENUM ('weekly', 'monthly');
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'challenge_category') THEN
        CREATE TYPE public.challenge_category AS ENUM ('diary', 'song_clear');
    END IF;
END $$;

-- 2. プロフィールテーブル
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

-- 4. ユーザー楽曲成績テーブル
CREATE TABLE IF NOT EXISTS public.user_song_stats (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    song_id uuid REFERENCES public.songs(id) ON DELETE CASCADE,
    best_rank text,
    best_score integer,
    clear_count integer NOT NULL DEFAULT 0,
    last_played timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, song_id)
);

-- 5. コーステーブル
CREATE TABLE IF NOT EXISTS public.courses (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    min_rank public.membership_rank NOT NULL DEFAULT 'premium',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 6. レッスンテーブル
CREATE TABLE IF NOT EXISTS public.lessons (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    order_index integer NOT NULL DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 7. コース前提条件テーブル
CREATE TABLE IF NOT EXISTS public.course_prerequisites (
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    prerequisite_course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (course_id, prerequisite_course_id)
);

-- 8. ユーザーコース進捗テーブル
CREATE TABLE IF NOT EXISTS public.user_course_progress (
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    is_unlocked boolean NOT NULL DEFAULT false,
    locked_at timestamptz,
    unlocked_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, course_id)
);

-- 9. ユーザー楽曲プレイ進捗テーブル
CREATE TABLE IF NOT EXISTS public.user_song_play_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    context_type text NOT NULL CHECK (context_type IN ('mission', 'lesson', 'general')),
    context_id uuid,
    clear_count integer NOT NULL DEFAULT 0,
    best_rank text,
    best_score integer,
    last_cleared_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, song_id, context_type, context_id)
);

-- 10. レッスン楽曲テーブル
CREATE TABLE IF NOT EXISTS public.lesson_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    order_index integer NOT NULL DEFAULT 0,
    clear_conditions jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lesson_songs_lesson_id_song_id_key UNIQUE (lesson_id, song_id)
);

-- 11. レッスン動画テーブル
CREATE TABLE IF NOT EXISTS public.lesson_videos (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
    vimeo_url text NOT NULL,
    order_index integer NOT NULL DEFAULT 0
);

-- 12. チャレンジテーブル
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

-- 13. チャレンジトラックテーブル
CREATE TABLE IF NOT EXISTS public.challenge_tracks (
    challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE,
    song_id uuid REFERENCES public.songs(id) ON DELETE CASCADE,
    key_offset integer DEFAULT 0,
    min_speed numeric DEFAULT 1.0,
    min_rank text DEFAULT 'B',
    min_clear_count integer DEFAULT 1,
    notation_setting text DEFAULT 'both',
    PRIMARY KEY (challenge_id, song_id)
);

-- 14. ユーザーチャレンジ進捗テーブル
CREATE TABLE IF NOT EXISTS public.user_challenge_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id uuid REFERENCES public.challenges(id) ON DELETE CASCADE,
    clear_count integer NOT NULL DEFAULT 0,
    completed boolean NOT NULL DEFAULT false,
    reward_claimed boolean NOT NULL DEFAULT false,
    UNIQUE (user_id, challenge_id)
);

-- 15. チャレンジ進捗テーブル（古い形式）
CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    completed_clears integer NOT NULL DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (user_id, challenge_id)
);

-- 16. 経験値履歴テーブル
CREATE TABLE IF NOT EXISTS public.xp_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    song_id uuid REFERENCES public.songs(id),
    gained_xp integer NOT NULL,
    base_xp integer NOT NULL,
    speed_multiplier numeric NOT NULL,
    rank_multiplier numeric NOT NULL,
    transpose_multiplier numeric NOT NULL,
    membership_multiplier numeric NOT NULL,
    mission_multiplier numeric NOT NULL DEFAULT 1.0,
    reason text NOT NULL DEFAULT 'unknown',
    created_at timestamptz DEFAULT now()
);

-- 17. 練習日記テーブル
CREATE TABLE IF NOT EXISTS public.practice_diaries (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    practice_date date NOT NULL,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, practice_date)
);

-- 18. 日記いいねテーブル
CREATE TABLE IF NOT EXISTS public.diary_likes (
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    diary_id uuid REFERENCES public.practice_diaries(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, diary_id)
);

-- 19. 日記コメントテーブル
CREATE TABLE IF NOT EXISTS public.diary_comments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    diary_id uuid REFERENCES public.practice_diaries(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    created_at timestamptz DEFAULT now()
);

-- 20. ユーザーレッスン進捗テーブル
CREATE TABLE IF NOT EXISTS public.user_lesson_progress (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id uuid REFERENCES public.lessons(id) ON DELETE CASCADE,
    course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
    completed boolean NOT NULL DEFAULT false,
    completion_date timestamptz,
    unlock_date timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    UNIQUE (user_id, lesson_id)
);

-- 21. お知らせテーブル
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

-- 22. インデックスの作成
-- profiles indexes
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);
CREATE INDEX IF NOT EXISTS profiles_rank_idx ON public.profiles(rank);

-- songs indexes
CREATE INDEX IF NOT EXISTS songs_created_by_idx ON public.songs(created_by);
CREATE INDEX IF NOT EXISTS songs_min_rank_idx ON public.songs(min_rank);
CREATE INDEX IF NOT EXISTS songs_is_public_idx ON public.songs(is_public);

-- user_song_stats indexes
CREATE INDEX IF NOT EXISTS user_song_stats_user_id_idx ON public.user_song_stats(user_id);
CREATE INDEX IF NOT EXISTS user_song_stats_song_id_idx ON public.user_song_stats(song_id);

-- courses indexes
CREATE INDEX IF NOT EXISTS courses_min_rank_idx ON public.courses(min_rank);

-- lessons indexes
CREATE INDEX IF NOT EXISTS lessons_course_id_idx ON public.lessons(course_id);
CREATE INDEX IF NOT EXISTS lessons_order_idx ON public.lessons(order_index);

-- course_prerequisites indexes
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course_id ON public.course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_prerequisite_id ON public.course_prerequisites(prerequisite_course_id);

-- user_course_progress indexes
CREATE INDEX IF NOT EXISTS user_course_progress_user_idx ON public.user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS user_course_progress_course_idx ON public.user_course_progress(course_id);
CREATE INDEX IF NOT EXISTS user_course_progress_unlocked_idx ON public.user_course_progress(is_unlocked);

-- user_song_play_progress indexes
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_user_id ON public.user_song_play_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_song_id ON public.user_song_play_progress(song_id);
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_context ON public.user_song_play_progress(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_user_context ON public.user_song_play_progress(user_id, context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_user_song ON public.user_song_play_progress(user_id, song_id);

-- lesson_songs indexes
CREATE INDEX IF NOT EXISTS idx_lesson_songs_lesson_id ON public.lesson_songs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_songs_song_id ON public.lesson_songs(song_id);

-- challenges indexes
CREATE INDEX IF NOT EXISTS challenges_active_idx ON public.challenges(start_date, end_date);
CREATE INDEX IF NOT EXISTS challenges_type_idx ON public.challenges(type);
CREATE INDEX IF NOT EXISTS challenges_category_idx ON public.challenges(category);

-- challenge_tracks indexes
CREATE INDEX IF NOT EXISTS challenge_tracks_challenge_id_idx ON public.challenge_tracks(challenge_id);
CREATE INDEX IF NOT EXISTS challenge_tracks_song_id_idx ON public.challenge_tracks(song_id);

-- user_challenge_progress indexes
CREATE INDEX IF NOT EXISTS progress_user_idx ON public.user_challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS progress_challenge_idx ON public.user_challenge_progress(challenge_id);

-- challenge_progress indexes
CREATE INDEX IF NOT EXISTS idx_challenge_progress_user_id ON public.challenge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_challenge_id ON public.challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_progress_completed ON public.challenge_progress(is_completed);

-- xp_history indexes
CREATE INDEX IF NOT EXISTS xp_history_user_id_idx ON public.xp_history(user_id);
CREATE INDEX IF NOT EXISTS xp_history_song_id_idx ON public.xp_history(song_id);
CREATE INDEX IF NOT EXISTS xp_history_created_at_idx ON public.xp_history(created_at);

-- practice_diaries indexes
CREATE INDEX IF NOT EXISTS practice_diaries_user_id_idx ON public.practice_diaries(user_id);
CREATE INDEX IF NOT EXISTS practice_diaries_practice_date_idx ON public.practice_diaries(practice_date);

-- diary_likes indexes
CREATE INDEX IF NOT EXISTS diary_likes_user_id_idx ON public.diary_likes(user_id);
CREATE INDEX IF NOT EXISTS diary_likes_diary_id_idx ON public.diary_likes(diary_id);

-- diary_comments indexes
CREATE INDEX IF NOT EXISTS comments_diary_idx ON public.diary_comments(diary_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.diary_comments(user_id);

-- user_lesson_progress indexes
CREATE INDEX IF NOT EXISTS lesson_progress_user_idx ON public.user_lesson_progress(user_id);
CREATE INDEX IF NOT EXISTS lesson_progress_course_idx ON public.user_lesson_progress(user_id, course_id);
CREATE INDEX IF NOT EXISTS lesson_progress_completion_idx ON public.user_lesson_progress(user_id, completed, completion_date);

-- announcements indexes
CREATE INDEX IF NOT EXISTS announcements_active_idx ON public.announcements(is_active, priority, created_at);
CREATE INDEX IF NOT EXISTS announcements_created_by_idx ON public.announcements(created_by);

-- 23. RLS有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_song_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_song_play_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.practice_diaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diary_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- 24. RLSポリシーの作成
-- profiles policies
CREATE POLICY IF NOT EXISTS "profiles_select_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_admin_select" ON public.profiles FOR SELECT USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
CREATE POLICY IF NOT EXISTS "profiles_admin_update" ON public.profiles FOR UPDATE USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- songs policies
CREATE POLICY IF NOT EXISTS "songs_select_public" ON public.songs FOR SELECT USING (is_public = true OR auth.uid() = created_by OR (SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
CREATE POLICY IF NOT EXISTS "songs_admin_modify" ON public.songs FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- user_song_stats policies
CREATE POLICY IF NOT EXISTS "user_song_stats_owner" ON public.user_song_stats FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- courses policies
CREATE POLICY IF NOT EXISTS "courses_select_all" ON public.courses FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "courses_admin_modify" ON public.courses FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- lessons policies
CREATE POLICY IF NOT EXISTS "lessons_select_all" ON public.lessons FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "lessons_admin_modify" ON public.lessons FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- course_prerequisites policies
CREATE POLICY IF NOT EXISTS "Allow admin full access on course_prerequisites" ON public.course_prerequisites FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
CREATE POLICY IF NOT EXISTS "Allow authenticated users to read course_prerequisites" ON public.course_prerequisites FOR SELECT USING (auth.role() = 'authenticated');

-- user_course_progress policies
CREATE POLICY IF NOT EXISTS "course_progress_user_or_admin_select" ON public.user_course_progress FOR SELECT USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
CREATE POLICY IF NOT EXISTS "course_progress_user_or_admin_modify" ON public.user_course_progress FOR ALL USING (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK (auth.uid() = user_id OR (SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- user_song_play_progress policies
CREATE POLICY IF NOT EXISTS "Users can read their own song play progress" ON public.user_song_play_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can manage their own song play progress" ON public.user_song_play_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Admin can read all song play progress" ON public.user_song_play_progress FOR SELECT USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- lesson_songs policies
CREATE POLICY IF NOT EXISTS "Admin can manage lesson songs" ON public.lesson_songs FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
CREATE POLICY IF NOT EXISTS "Authenticated users can view lesson songs" ON public.lesson_songs FOR SELECT USING (auth.role() = 'authenticated');

-- lesson_videos policies
CREATE POLICY IF NOT EXISTS "lesson_videos_select_all" ON public.lesson_videos FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "lesson_videos_admin_modify" ON public.lesson_videos FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- challenges policies
CREATE POLICY IF NOT EXISTS "challenges_read_all" ON public.challenges FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "challenges_admin_modify" ON public.challenges FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- challenge_tracks policies
CREATE POLICY IF NOT EXISTS "challenge_tracks_read_all" ON public.challenge_tracks FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "challenge_tracks_admin_modify" ON public.challenge_tracks FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- user_challenge_progress policies
CREATE POLICY IF NOT EXISTS "progress_owner_select" ON public.user_challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "progress_owner_modify" ON public.user_challenge_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- challenge_progress policies
CREATE POLICY IF NOT EXISTS "Users can view their own challenge progress" ON public.challenge_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can insert their own challenge progress" ON public.challenge_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "Users can update their own challenge progress" ON public.challenge_progress FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- xp_history policies
CREATE POLICY IF NOT EXISTS "xp_owner_select" ON public.xp_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "xp_owner_insert" ON public.xp_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- practice_diaries policies
CREATE POLICY IF NOT EXISTS "diary_select" ON public.practice_diaries FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "diary_insert" ON public.practice_diaries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "diary_update" ON public.practice_diaries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "diary_delete" ON public.practice_diaries FOR DELETE USING (auth.uid() = user_id);

-- diary_likes policies
CREATE POLICY IF NOT EXISTS "likes_select" ON public.diary_likes FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "likes_insert" ON public.diary_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "likes_delete" ON public.diary_likes FOR DELETE USING (auth.uid() = user_id);

-- diary_comments policies
CREATE POLICY IF NOT EXISTS "comments_public_read" ON public.diary_comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "comments_owner_insert" ON public.diary_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "comments_owner_delete" ON public.diary_comments FOR DELETE USING (auth.uid() = user_id);

-- user_lesson_progress policies
CREATE POLICY IF NOT EXISTS "lesson_progress_owner_select" ON public.user_lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "lesson_progress_owner_modify" ON public.user_lesson_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- announcements policies
CREATE POLICY IF NOT EXISTS "announcements_public_read" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY IF NOT EXISTS "announcements_admin_read" ON public.announcements FOR SELECT USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));
CREATE POLICY IF NOT EXISTS "announcements_admin_modify" ON public.announcements FOR ALL USING ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id)) WITH CHECK ((SELECT is_admin FROM public.profiles WHERE auth.uid() = id));

-- 25. 制約の追加
-- course_prerequisites制約
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'course_prerequisites' 
        AND constraint_name = 'no_self_reference'
    ) THEN
        ALTER TABLE public.course_prerequisites ADD CONSTRAINT no_self_reference CHECK (course_id != prerequisite_course_id);
    END IF;
END $$;

-- 26. 関数の作成
-- 練習日記投稿でミッション進捗を +1
CREATE OR REPLACE FUNCTION public.increment_diary_progress(
    _user_id uuid,
    _mission_id uuid
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.user_challenge_progress (user_id, challenge_id, clear_count)
         VALUES (_user_id, _mission_id, 1)
    ON CONFLICT (user_id, challenge_id)
    DO UPDATE SET clear_count = user_challenge_progress.clear_count + 1;
END;
$$;

-- 27. Realtime設定
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.practice_diaries, public.diary_comments;
    END IF;
END $$;
