-- fantasy_bgm_assetsテーブルにテンポ関連カラムを追加

-- BPM（1分あたりの拍数）
ALTER TABLE public.fantasy_bgm_assets
  ADD COLUMN IF NOT EXISTS bpm integer;

-- 拍子（1小節あたりの拍数）
ALTER TABLE public.fantasy_bgm_assets
  ADD COLUMN IF NOT EXISTS time_signature integer;

-- 小節数（曲の長さ）
ALTER TABLE public.fantasy_bgm_assets
  ADD COLUMN IF NOT EXISTS measure_count integer;

-- カウントイン小節数
ALTER TABLE public.fantasy_bgm_assets
  ADD COLUMN IF NOT EXISTS count_in_measures integer;

COMMENT ON COLUMN public.fantasy_bgm_assets.bpm IS 'BPM（テンポ）';
COMMENT ON COLUMN public.fantasy_bgm_assets.time_signature IS '拍子（1小節あたりの拍数）';
COMMENT ON COLUMN public.fantasy_bgm_assets.measure_count IS '小節数（曲の長さ）';
COMMENT ON COLUMN public.fantasy_bgm_assets.count_in_measures IS 'カウントイン小節数';
