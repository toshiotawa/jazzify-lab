-- レッスン課題でファンタジーモードを使用するためのマイグレーション
-- 作成日: 2025-01-25
-- 説明: lesson_songsテーブルにファンタジーモード用のクリア条件を追加

-- lesson_songsテーブルにファンタジーモード用のクリア条件カラムを追加
ALTER TABLE lesson_songs 
ADD COLUMN IF NOT EXISTS fantasy_clear_conditions jsonb;

-- コメントを追加
COMMENT ON COLUMN lesson_songs.fantasy_clear_conditions IS 'ファンタジーモード用のクリア条件 (is_fantasy=trueの場合のみ使用)';

-- 既存のレコードにデフォルト値を設定
UPDATE lesson_songs SET fantasy_clear_conditions = '{"clears_required": 1}'::jsonb 
WHERE is_fantasy = true AND fantasy_clear_conditions IS NULL; 