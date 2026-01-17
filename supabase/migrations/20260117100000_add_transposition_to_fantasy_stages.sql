-- ファンタジーモード移調機能用のカラム追加

-- 基準キー（デフォルトはC）
ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS base_key TEXT DEFAULT 'C';

-- 移調練習機能を有効にするかどうか（デフォルトはfalse）
ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS enable_transposition_practice BOOLEAN DEFAULT FALSE;

-- コメント追加
COMMENT ON COLUMN public.fantasy_stages.base_key IS '楽曲の基準キー（C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B）';
COMMENT ON COLUMN public.fantasy_stages.enable_transposition_practice IS '移調練習機能を有効にするかどうか';

-- 有効なキー値のチェック制約を追加
ALTER TABLE public.fantasy_stages
ADD CONSTRAINT fantasy_stages_base_key_check
CHECK (base_key IN ('C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'));
