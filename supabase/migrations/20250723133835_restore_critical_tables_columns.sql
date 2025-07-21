-- 緊急修正: 削除された重要なテーブルとカラムを復活させるmigration
-- アプリケーションの正常動作に必要な要素を最優先で復旧

-- 1. challenge_tracks テーブルに削除されたカラムを復活
ALTER TABLE public.challenge_tracks ADD COLUMN clears_required integer NOT NULL DEFAULT 1;
ALTER TABLE public.challenge_tracks ADD COLUMN created_at timestamp with time zone DEFAULT now();
ALTER TABLE public.challenge_tracks ADD COLUMN id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.challenge_tracks ADD COLUMN score_mode text NOT NULL DEFAULT 'NOTES_AND_CHORDS';

-- 2. course_prerequisites テーブルを復活
CREATE TABLE IF NOT EXISTS public.course_prerequisites (
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    prerequisite_course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (course_id, prerequisite_course_id)
);

-- course_prerequisites制約とインデックス
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
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_course_id ON public.course_prerequisites(course_id);
CREATE INDEX IF NOT EXISTS idx_course_prerequisites_prerequisite_id ON public.course_prerequisites(prerequisite_course_id);

-- 3. user_course_progress テーブルを復活
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

-- user_course_progressインデックス
CREATE INDEX IF NOT EXISTS user_course_progress_user_idx ON public.user_course_progress(user_id);
CREATE INDEX IF NOT EXISTS user_course_progress_course_idx ON public.user_course_progress(course_id);
CREATE INDEX IF NOT EXISTS user_course_progress_unlocked_idx ON public.user_course_progress(is_unlocked);

-- 4. user_song_play_progress テーブルを復活
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

-- user_song_play_progressインデックス
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_user_id ON public.user_song_play_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_song_id ON public.user_song_play_progress(song_id);
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_context ON public.user_song_play_progress(context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_user_context ON public.user_song_play_progress(user_id, context_type, context_id);
CREATE INDEX IF NOT EXISTS idx_user_song_play_progress_user_song ON public.user_song_play_progress(user_id, song_id);

-- 5. challenge_progress テーブルを復活（user_challenge_progressと併存）
CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    completed_clears integer NOT NULL DEFAULT 0,
    is_completed boolean DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (user_id, challenge_id)
);

-- 6. RLSポリシーの設定
-- course_prerequisites
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'course_prerequisites' 
        AND policyname = 'Allow admin full access on course_prerequisites'
    ) THEN
        CREATE POLICY "Allow admin full access on course_prerequisites" ON public.course_prerequisites
            FOR ALL TO public
            USING ((SELECT profiles.is_admin FROM profiles WHERE profiles.id = auth.uid()))
            WITH CHECK ((SELECT profiles.is_admin FROM profiles WHERE profiles.id = auth.uid()));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'course_prerequisites' 
        AND policyname = 'Allow authenticated users to read course_prerequisites'
    ) THEN
        CREATE POLICY "Allow authenticated users to read course_prerequisites" ON public.course_prerequisites
            FOR SELECT TO public
            USING (auth.role() = 'authenticated');
    END IF;
END $$;

-- user_course_progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_course_progress' 
        AND policyname = 'course_progress_user_or_admin_select'
    ) THEN
        CREATE POLICY "course_progress_user_or_admin_select" ON public.user_course_progress
            FOR SELECT TO public
            USING (auth.uid() = user_id OR (SELECT profiles.is_admin FROM profiles WHERE profiles.id = auth.uid()));
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_course_progress' 
        AND policyname = 'course_progress_user_or_admin_modify'
    ) THEN
        CREATE POLICY "course_progress_user_or_admin_modify" ON public.user_course_progress
            FOR ALL TO public
            USING (auth.uid() = user_id OR (SELECT profiles.is_admin FROM profiles WHERE profiles.id = auth.uid()))
            WITH CHECK (auth.uid() = user_id OR (SELECT profiles.is_admin FROM profiles WHERE profiles.id = auth.uid()));
    END IF;
END $$;

-- user_song_play_progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_song_play_progress' 
        AND policyname = 'Users can read their own song play progress'
    ) THEN
        CREATE POLICY "Users can read their own song play progress" ON public.user_song_play_progress
            FOR SELECT TO public
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_song_play_progress' 
        AND policyname = 'Users can manage their own song play progress'
    ) THEN
        CREATE POLICY "Users can manage their own song play progress" ON public.user_song_play_progress
            FOR ALL TO public
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'user_song_play_progress' 
        AND policyname = 'Admin can read all song play progress'
    ) THEN
        CREATE POLICY "Admin can read all song play progress" ON public.user_song_play_progress
            FOR SELECT TO public
            USING ((SELECT profiles.is_admin FROM profiles WHERE profiles.id = auth.uid()));
    END IF;
END $$;

-- challenge_progress
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'challenge_progress' 
        AND policyname = 'Users can view their own challenge progress'
    ) THEN
        CREATE POLICY "Users can view their own challenge progress" ON public.challenge_progress
            FOR SELECT TO public
            USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'challenge_progress' 
        AND policyname = 'Users can insert their own challenge progress'
    ) THEN
        CREATE POLICY "Users can insert their own challenge progress" ON public.challenge_progress
            FOR INSERT TO public
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'challenge_progress' 
        AND policyname = 'Users can update their own challenge progress'
    ) THEN
        CREATE POLICY "Users can update their own challenge progress" ON public.challenge_progress
            FOR UPDATE TO public
            USING (auth.uid() = user_id)
            WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 7. RLS有効化
ALTER TABLE public.course_prerequisites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_song_play_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;