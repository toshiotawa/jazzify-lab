-- ファンタジーステージにミス数上限条件を追加
-- レッスン用ファンタジーモードで使用。NULLの場合はミス数条件なし。

ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS max_miss_count INTEGER DEFAULT NULL;

-- コメント追加
COMMENT ON COLUMN fantasy_stages.max_miss_count IS 'クリア条件のミス数上限。NULLの場合はミス数条件なし（レッスンモード用）';
