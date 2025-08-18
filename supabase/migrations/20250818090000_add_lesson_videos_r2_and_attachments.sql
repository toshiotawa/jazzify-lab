-- レッスン動画テーブルにR2対応カラムを追加
ALTER TABLE public.lesson_videos
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS r2_key text,
  ADD COLUMN IF NOT EXISTS content_type text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- タイムスタンプ更新トリガー
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_lesson_videos_timestamp'
  ) THEN
    CREATE TRIGGER set_lesson_videos_timestamp
    BEFORE UPDATE ON public.lesson_videos
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END $$;

-- RLSの有効化
ALTER TABLE public.lesson_videos ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員許可
DROP POLICY IF EXISTS lesson_videos_read_policy ON public.lesson_videos;
CREATE POLICY lesson_videos_read_policy ON public.lesson_videos
  FOR SELECT USING (true);

-- 管理者のみ書き込み可能
DROP POLICY IF EXISTS lesson_videos_admin_all_policy ON public.lesson_videos;
CREATE POLICY lesson_videos_admin_all_policy ON public.lesson_videos
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- 添付ファイルテーブルの作成
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  url text NOT NULL,
  r2_key text NOT NULL,
  content_type text,
  size bigint,
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- インデックス
CREATE INDEX IF NOT EXISTS idx_lesson_attachments_lesson_id ON public.lesson_attachments(lesson_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_attachments_unique_key ON public.lesson_attachments(lesson_id, r2_key);

-- タイムスタンプ更新トリガー
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_lesson_attachments_timestamp'
  ) THEN
    CREATE TRIGGER set_lesson_attachments_timestamp
    BEFORE UPDATE ON public.lesson_attachments
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_set_timestamp();
  END IF;
END $$;

-- RLSの有効化
ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

-- 読み取りは全員許可
DROP POLICY IF EXISTS lesson_attachments_read_policy ON public.lesson_attachments;
CREATE POLICY lesson_attachments_read_policy ON public.lesson_attachments
  FOR SELECT USING (true);

-- 管理者のみ書き込み可能
DROP POLICY IF EXISTS lesson_attachments_admin_all_policy ON public.lesson_attachments;
CREATE POLICY lesson_attachments_admin_all_policy ON public.lesson_attachments
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  ) WITH CHECK (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );