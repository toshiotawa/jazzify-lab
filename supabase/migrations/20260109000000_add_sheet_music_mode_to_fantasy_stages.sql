-- 楽譜モード機能の追加
-- 作成日: 2026-01-09
-- 説明: ファンタジーステージに楽譜モード（敵アイコンとして楽譜画像を使用）を追加

-- 楽譜モードフラグを追加
-- true の場合、モンスターアイコンの代わりに楽譜画像（treble/bass）を表示
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS sheet_music_mode BOOLEAN NOT NULL DEFAULT false;

-- 許可された音名リストを追加
-- 例: ['treble_A#3', 'treble_C4', 'bass_G2']
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS allowed_notes TEXT[] DEFAULT '{}';

-- コメント追加
COMMENT ON COLUMN fantasy_stages.sheet_music_mode IS '楽譜モード: true の場合、敵アイコンとして楽譜画像を使用';
COMMENT ON COLUMN fantasy_stages.allowed_notes IS '楽譜モード時の許可された音名リスト (例: treble_A#3, bass_C4)';
