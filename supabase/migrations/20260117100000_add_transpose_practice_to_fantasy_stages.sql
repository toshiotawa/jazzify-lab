-- 移調練習機能用のカラムを追加
-- progression_timingモードで使用

-- 移調練習機能の有効化フラグ
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS transpose_practice_enabled BOOLEAN DEFAULT FALSE;

-- 基準キー（デフォルトはC）
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS base_key TEXT DEFAULT 'C';

-- コメント追加
COMMENT ON COLUMN fantasy_stages.transpose_practice_enabled IS '移調練習機能を有効にするかどうか';
COMMENT ON COLUMN fantasy_stages.base_key IS '曲の基準キー（C, Db, D, Eb, E, F, Gb, G, Ab, A, Bb, B）';
