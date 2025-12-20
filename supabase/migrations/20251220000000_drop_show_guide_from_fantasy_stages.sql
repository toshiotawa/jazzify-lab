-- show_guide 列を廃止（ガイドは練習モードのUI設定で制御する）
ALTER TABLE public.fantasy_stages
DROP COLUMN IF EXISTS show_guide;

