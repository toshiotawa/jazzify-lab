-- survival_stages に大譜表モードフラグを追加
ALTER TABLE public.survival_stages
  ADD COLUMN IF NOT EXISTS grand_staff_mode boolean NOT NULL DEFAULT false;

-- 両手ヴォイシングコース（中級・上級）のサバイバル課題を大譜表モードに設定
UPDATE public.survival_stages
SET grand_staff_mode = true
WHERE map_category = 'lesson'
  AND name LIKE '両手ヴォイシング%';
