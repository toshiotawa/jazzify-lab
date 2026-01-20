-- ファンタジーステージにtimingモード本番用の設定カラムを追加
-- 1. production_repeat_transposition_mode: 本番モードでのリピート転調設定
-- 2. production_start_key: 本番モードでの開始時キー設定

-- リピート転調設定の型（off, +1, +5, -1, -5, random）
-- 練習モードでは既存のtransposeSettingsを使用
-- 本番モードではこれらの新しいカラムを使用

ALTER TABLE public.fantasy_stages 
ADD COLUMN IF NOT EXISTS production_repeat_transposition_mode TEXT DEFAULT 'off' 
CHECK (production_repeat_transposition_mode IN ('off', '+1', '+5', '-1', '-5', 'random'));

ALTER TABLE public.fantasy_stages 
ADD COLUMN IF NOT EXISTS production_start_key INTEGER DEFAULT 0 
CHECK (production_start_key >= -6 AND production_start_key <= 6);

-- カラムのコメント追加
COMMENT ON COLUMN public.fantasy_stages.production_repeat_transposition_mode IS 
'本番モードでのリピート転調設定: off=なし, +1=半音上, +5=完全4度上, -1=半音下, -5=完全4度下, random=ランダム(+1,+5,-1,-5)';

COMMENT ON COLUMN public.fantasy_stages.production_start_key IS 
'本番モードでの開始時キー（-6〜+6の半音数）。0=原曲キー';
