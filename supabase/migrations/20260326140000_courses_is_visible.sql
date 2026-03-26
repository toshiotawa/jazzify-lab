-- レッスンコース一覧の表示/非表示
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS is_visible boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.courses.is_visible IS 'レッスン一覧などにコースを表示するか（false の場合は一般ユーザー向け一覧から除外）';

-- サバイバルモード徹底攻略（DB UUID 固定）
UPDATE public.courses
SET is_visible = false
WHERE id = '95cf6992-e987-4235-b8e2-03fe1bad8a00'::uuid;
