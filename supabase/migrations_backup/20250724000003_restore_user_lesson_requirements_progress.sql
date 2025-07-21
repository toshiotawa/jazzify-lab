-- user_lesson_requirements_progress テーブル復活マイグレーション
-- 既存の場合はスキップする安全な実装

-- 1. テーブル作成
CREATE TABLE IF NOT EXISTS public.user_lesson_requirements_progress (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    clear_count integer NOT NULL DEFAULT 0,
    clear_dates date[] NOT NULL DEFAULT '{}',
    best_rank text,
    last_cleared_at timestamp with time zone,
    is_completed boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_lesson_requirements_unique UNIQUE (user_id, lesson_id, song_id)
);

-- 2. インデックス
CREATE INDEX IF NOT EXISTS idx_lesson_requirements_user ON public.user_lesson_requirements_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_lesson_requirements_lesson ON public.user_lesson_requirements_progress(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_requirements_completion ON public.user_lesson_requirements_progress(user_id, lesson_id, is_completed);

-- 3. RLS有効化
ALTER TABLE public.user_lesson_requirements_progress ENABLE ROW LEVEL SECURITY;

-- 4. RLSポリシー
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_lesson_requirements_progress' AND policyname = 'Users can view own requirements progress'
    ) THEN
        CREATE POLICY "Users can view own requirements progress" ON public.user_lesson_requirements_progress
            FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_lesson_requirements_progress' AND policyname = 'Users can update own requirements progress'
    ) THEN
        CREATE POLICY "Users can update own requirements progress" ON public.user_lesson_requirements_progress
            FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'user_lesson_requirements_progress' AND policyname = 'Users can insert own requirements progress'
    ) THEN
        CREATE POLICY "Users can insert own requirements progress" ON public.user_lesson_requirements_progress
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- 5. updated_at自動更新トリガー
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'set_lesson_requirements_progress_timestamp'
    ) THEN
        CREATE TRIGGER set_lesson_requirements_progress_timestamp
            BEFORE UPDATE ON public.user_lesson_requirements_progress
            FOR EACH ROW
            EXECUTE FUNCTION public.trigger_set_timestamp();
    END IF;
END $$;

-- 6. 進捗更新関数
CREATE OR REPLACE FUNCTION public.update_lesson_requirement_progress(
    p_user_id uuid,
    p_lesson_id uuid,
    p_song_id uuid,
    p_rank text,
    p_clear_conditions jsonb
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today date;
    v_clear_dates date[];
    v_clear_count integer;
    v_required_count integer;
    v_required_rank text;
    v_is_completed boolean;
BEGIN
    v_today := CURRENT_DATE;
    v_required_count := COALESCE((p_clear_conditions->>'count')::integer, 1);
    v_required_rank := COALESCE(p_clear_conditions->>'rank', 'B');
    SELECT clear_dates, clear_count 
    INTO v_clear_dates, v_clear_count
    FROM public.user_lesson_requirements_progress
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id AND song_id = p_song_id;
    IF NOT FOUND THEN
        v_clear_dates := ARRAY[]::date[];
        v_clear_count := 0;
    END IF;
    IF (p_rank = 'S') OR 
       (p_rank IN ('S', 'A') AND v_required_rank IN ('A', 'B', 'C')) OR
       (p_rank IN ('S', 'A', 'B') AND v_required_rank IN ('B', 'C')) OR
       (p_rank IN ('S', 'A', 'B', 'C') AND v_required_rank = 'C') THEN
        IF v_today != ALL(v_clear_dates) THEN
            v_clear_dates := array_append(v_clear_dates, v_today);
            v_clear_count := v_clear_count + 1;
        END IF;
    END IF;
    IF p_clear_conditions->>'requires_days' = 'true' THEN
        v_is_completed := array_length(v_clear_dates, 1) >= v_required_count;
    ELSE
        v_is_completed := v_clear_count >= v_required_count;
    END IF;
    INSERT INTO public.user_lesson_requirements_progress (
        user_id, lesson_id, song_id, clear_count, clear_dates, 
        best_rank, last_cleared_at, is_completed
    ) VALUES (
        p_user_id, p_lesson_id, p_song_id, v_clear_count, v_clear_dates,
        p_rank, now(), v_is_completed
    )
    ON CONFLICT (user_id, lesson_id, song_id)
    DO UPDATE SET
        clear_count = v_clear_count,
        clear_dates = v_clear_dates,
        best_rank = CASE 
            WHEN user_lesson_requirements_progress.best_rank IS NULL THEN p_rank
            WHEN p_rank = 'S' THEN 'S'
            WHEN p_rank = 'A' AND user_lesson_requirements_progress.best_rank != 'S' THEN 'A'
            WHEN p_rank = 'B' AND user_lesson_requirements_progress.best_rank NOT IN ('S', 'A') THEN 'B'
            ELSE user_lesson_requirements_progress.best_rank
        END,
        last_cleared_at = now(),
        is_completed = v_is_completed,
        updated_at = now();
    RETURN v_is_completed;
END;
$$; 