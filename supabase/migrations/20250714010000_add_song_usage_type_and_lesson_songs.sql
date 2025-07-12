-- 1. songsテーブルにusage_typeカラムを追加
ALTER TABLE public.songs
ADD COLUMN usage_type TEXT NOT NULL DEFAULT 'general';

-- usage_typeにCHECK制約を追加してENUMのように振る舞わせる
ALTER TABLE public.songs
ADD CONSTRAINT check_song_usage_type CHECK (usage_type IN ('general', 'lesson'));

-- 2. lesson_songs 中間テーブルを作成
CREATE TABLE public.lesson_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックスを追加
CREATE INDEX idx_lesson_songs_lesson_id ON public.lesson_songs(lesson_id);
CREATE INDEX idx_lesson_songs_song_id ON public.lesson_songs(song_id);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.lesson_songs ENABLE ROW LEVEL SECURITY;

-- ポリシーを作成
-- 管理者はすべての操作が可能
CREATE POLICY "Admin can manage lesson songs"
ON public.lesson_songs
FOR ALL
USING ( (SELECT is_admin FROM public.profiles WHERE auth.uid() = id) = true )
WITH CHECK ( (SELECT is_admin FROM public.profiles WHERE auth.uid() = id) = true );

-- 認証済みユーザーは読み取りが可能
CREATE POLICY "Authenticated users can view lesson songs"
ON public.lesson_songs
FOR SELECT
USING ( auth.role() = 'authenticated' ); 