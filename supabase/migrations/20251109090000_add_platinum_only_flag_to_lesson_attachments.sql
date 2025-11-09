-- レッスン添付ファイルにプラチナ会員限定フラグを追加する
ALTER TABLE public.lesson_attachments
ADD COLUMN IF NOT EXISTS platinum_only boolean DEFAULT false NOT NULL;

-- 既存レコードの updated_at を更新
UPDATE public.lesson_attachments
SET updated_at = NOW()
WHERE platinum_only IS NULL;
