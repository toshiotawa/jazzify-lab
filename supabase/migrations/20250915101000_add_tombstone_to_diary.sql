-- Add tombstone (soft delete) fields to practice_diaries and diary_comments
-- Ensures we can display placeholders like "(削除されました)" while removing PII/content

DO $$
BEGIN
  -- practice_diaries
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'practice_diaries' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE public.practice_diaries ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'practice_diaries' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.practice_diaries ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'practice_diaries' AND column_name = 'deleted_reason'
  ) THEN
    ALTER TABLE public.practice_diaries ADD COLUMN deleted_reason text;
  END IF;

  -- diary_comments
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'diary_comments' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE public.diary_comments ADD COLUMN is_deleted boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'diary_comments' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE public.diary_comments ADD COLUMN deleted_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'diary_comments' AND column_name = 'deleted_reason'
  ) THEN
    ALTER TABLE public.diary_comments ADD COLUMN deleted_reason text;
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS practice_diaries_is_deleted_idx ON public.practice_diaries (is_deleted);
CREATE INDEX IF NOT EXISTS diary_comments_is_deleted_idx ON public.diary_comments (is_deleted);

COMMENT ON COLUMN public.practice_diaries.is_deleted IS 'True if content was removed and entry is a tombstone placeholder';
COMMENT ON COLUMN public.diary_comments.is_deleted IS 'True if comment content was removed and row is a placeholder';
