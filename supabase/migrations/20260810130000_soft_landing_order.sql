-- ソフトランディング対象コースの提示順（第1ブロックのみ無料開放）
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS soft_landing_order integer;

COMMENT ON COLUMN public.courses.soft_landing_order IS
  '第1ブロックのみ無料開放するソフトランディング対象コースの提示順。NULL は対象外。premium_only は true のまま据え置く（旧クライアント互換）。';

CREATE INDEX IF NOT EXISTS courses_soft_landing_order_idx
  ON public.courses (soft_landing_order)
  WHERE soft_landing_order IS NOT NULL;
