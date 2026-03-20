-- レッスン動画・添付の表示言語スコープ（日本語のみ / 英語のみ / 共通）
ALTER TABLE public.lesson_attachments
  ADD COLUMN IF NOT EXISTS locale_scope text NOT NULL DEFAULT 'both';

DO $$
BEGIN
  ALTER TABLE public.lesson_attachments
    ADD CONSTRAINT lesson_attachments_locale_scope_check
    CHECK (locale_scope IN ('ja_only', 'en_only', 'both'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.lesson_videos
  ADD COLUMN IF NOT EXISTS locale_scope text NOT NULL DEFAULT 'both';

DO $$
BEGIN
  ALTER TABLE public.lesson_videos
    ADD CONSTRAINT lesson_videos_locale_scope_check
    CHECK (locale_scope IN ('ja_only', 'en_only', 'both'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

COMMENT ON COLUMN public.lesson_attachments.locale_scope IS 'ja_only: 日本語UIのみ; en_only: 英語UIのみ; both: 両方';
COMMENT ON COLUMN public.lesson_videos.locale_scope IS 'ja_only: 日本語UIのみ; en_only: 英語UIのみ; both: 両方';
