-- ファンタジーステージに移調練習機能の有効/無効フラグを追加
-- Timingモード（progression_timing）で使用される移調練習機能の管理用

ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS enable_transposition boolean DEFAULT false;

COMMENT ON COLUMN public.fantasy_stages.enable_transposition IS 
  '移調練習機能を有効にするかどうか（Timingモード用）。trueの場合、練習モードで移調オプションが表示される。';
