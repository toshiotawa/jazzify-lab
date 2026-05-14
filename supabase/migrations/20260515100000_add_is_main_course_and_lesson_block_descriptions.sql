-- メインクエスト / サブクエスト切り分け用
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_main_course boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.courses.is_main_course IS 'メインクエスト用コースか（将来的にサブクエストと区別）';

UPDATE public.courses
SET is_main_course = true
WHERE is_tutorial = true;

-- レッスン行にブロック単位の説明（タイトルと同様、同一ブロックで同一値を想定）
ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS block_description text,
  ADD COLUMN IF NOT EXISTS block_description_en text;

COMMENT ON COLUMN public.lessons.block_description IS 'ブロック説明（日本語）';
COMMENT ON COLUMN public.lessons.block_description_en IS 'Block description (English)';
