-- ファンタジーモードの移調練習機能を追加
-- 作成日: 2026-01-18
-- 説明: fantasy_stagesテーブルに移調練習機能の有効/無効設定カラムを追加

-- transposition_practice_enabledカラムを追加
-- デフォルトはfalse（無効）
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS transposition_practice_enabled BOOLEAN NOT NULL DEFAULT false;

-- コメント追加
COMMENT ON COLUMN fantasy_stages.transposition_practice_enabled IS '移調練習機能の有効/無効。trueの場合、練習モードで移調設定が表示される';
