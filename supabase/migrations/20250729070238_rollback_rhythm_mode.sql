-- リズムモード実装を元に戻すロールバック用マイグレーション
-- 注意: このファイルを実行すると、リズムモードに関連するすべての変更が削除されます

-- 1. インデックスを削除
DROP INDEX IF EXISTS idx_fantasy_stages_game_mode_pattern;

-- 2. 制約を削除
ALTER TABLE public.fantasy_stages
DROP CONSTRAINT IF EXISTS fantasy_stages_pattern_type_check;

ALTER TABLE public.fantasy_stages
DROP CONSTRAINT IF EXISTS fantasy_stages_music_meta_check;

ALTER TABLE public.fantasy_stages
DROP CONSTRAINT IF EXISTS fantasy_stages_audio_url_check;

-- 3. 新しいカラムを削除
ALTER TABLE public.fantasy_stages
DROP COLUMN IF EXISTS game_mode;

ALTER TABLE public.fantasy_stages
DROP COLUMN IF EXISTS pattern_type;

ALTER TABLE public.fantasy_stages
DROP COLUMN IF EXISTS music_meta;

ALTER TABLE public.fantasy_stages
DROP COLUMN IF EXISTS audio_url;

-- 4. stage_modeカラムを元のmodeに戻す
ALTER TABLE public.fantasy_stages
RENAME COLUMN stage_mode TO mode;

-- 5. コメントを元に戻す
COMMENT ON COLUMN public.fantasy_stages.mode IS 'ステージモード: single(単体) | progression(進行)';

-- 6. 元のインデックスを再作成（もし必要であれば）
-- CREATE INDEX idx_fantasy_stages_mode ON public.fantasy_stages(mode);