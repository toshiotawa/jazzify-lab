-- 1. songsテーブルにusage_typeカラムを追加（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'songs' 
    AND column_name = 'usage_type'
  ) THEN
    ALTER TABLE public.songs ADD COLUMN usage_type TEXT NOT NULL DEFAULT 'general';
  END IF;
END $$;

-- usage_typeにCHECK制約を追加してENUMのように振る舞わせる（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'songs' 
    AND constraint_name = 'check_song_usage_type'
  ) THEN
    ALTER TABLE public.songs ADD CONSTRAINT check_song_usage_type CHECK (usage_type IN ('general', 'lesson'));
  END IF;
END $$;

-- 2. lesson_songs 中間テーブルを作成（存在しない場合のみ）
CREATE TABLE IF NOT EXISTS public.lesson_songs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックスを追加（存在しない場合のみ）
CREATE INDEX IF NOT EXISTS idx_lesson_songs_lesson_id ON public.lesson_songs(lesson_id);
CREATE INDEX IF NOT EXISTS idx_lesson_songs_song_id ON public.lesson_songs(song_id);

-- RLS (Row Level Security) を有効化
ALTER TABLE public.lesson_songs ENABLE ROW LEVEL SECURITY;

-- ポリシーを作成（存在しない場合のみ）
DROP POLICY IF EXISTS "Admin can manage lesson songs" ON public.lesson_songs;
CREATE POLICY "Admin can manage lesson songs"
ON public.lesson_songs
FOR ALL
USING ( (SELECT is_admin FROM public.profiles WHERE auth.uid() = id) = true )
WITH CHECK ( (SELECT is_admin FROM public.profiles WHERE auth.uid() = id) = true );

DROP POLICY IF EXISTS "Authenticated users can view lesson songs" ON public.lesson_songs;
CREATE POLICY "Authenticated users can view lesson songs"
ON public.lesson_songs
FOR SELECT
USING ( auth.role() = 'authenticated' ); 