-- コースの難易度セクション（一覧のグルーピング・並び用）
BEGIN;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS difficulty_tier text NOT NULL DEFAULT 'beginner';

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_difficulty_tier_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_difficulty_tier_check CHECK (
    difficulty_tier = ANY (
      ARRAY[
        'tutorial'::text,
        'beginner'::text,
        'intermediate'::text,
        'advanced'::text
      ]
    )
  );

COMMENT ON COLUMN public.courses.difficulty_tier IS 'レッスン一覧の難易度セクション: tutorial, beginner, intermediate, advanced';

-- 既存データの付与（チュートリアルコース）
UPDATE public.courses
SET difficulty_tier = 'tutorial'
WHERE COALESCE(is_tutorial, false) = true;

-- サバイバル / 音符（既知ID）
UPDATE public.courses
SET difficulty_tier = 'beginner'
WHERE id IN (
  '95cf6992-e987-4235-b8e2-03fe1bad8a00'::uuid,
  'a2fe7c8c-a754-4a11-8b60-890abf37329e'::uuid
);

-- II-V-I コース（マイグレーション生成UUID）
UPDATE public.courses
SET difficulty_tier = 'intermediate'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'ii-v-i-course')
   OR title ILIKE '%II-V-I%'
   OR COALESCE(title_en, '') ILIKE '%II-V-I%';

-- バッハ（タイトル一致）
UPDATE public.courses
SET difficulty_tier = 'intermediate'
WHERE title ILIKE '%バッハ%'
   OR COALESCE(title_en, '') ILIKE '%bach%';

COMMIT;
