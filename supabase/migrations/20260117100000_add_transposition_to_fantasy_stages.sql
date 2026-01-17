-- Add transposition columns to fantasy_stages table
-- 移調機能のためのカラムを追加

-- 基準キーの移調量（半音単位、±6の範囲）
-- 例: +2 なら素材をキーCで作成し、ステージはキーDで出題
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS base_key_transposition integer DEFAULT 0 CHECK (base_key_transposition >= -6 AND base_key_transposition <= 6);

-- 移調練習機能を有効にするか
-- true: ユーザーが練習モードで移調を選択可能
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS transposition_practice_enabled boolean DEFAULT false;

-- Comment for documentation
COMMENT ON COLUMN fantasy_stages.base_key_transposition IS 'Base key transposition in semitones (-6 to +6). Applied to all notes and sheet music.';
COMMENT ON COLUMN fantasy_stages.transposition_practice_enabled IS 'Whether users can select transposition in practice mode.';
