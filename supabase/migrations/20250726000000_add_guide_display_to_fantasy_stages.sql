-- ファンタジーステージテーブルにガイド表示設定を追加
ALTER TABLE fantasy_stages 
ADD COLUMN show_guide boolean DEFAULT false;

-- 既存のレコードにデフォルト値を設定
UPDATE fantasy_stages SET show_guide = false WHERE show_guide IS NULL;

-- コメントを追加
COMMENT ON COLUMN fantasy_stages.show_guide IS 'ガイド表示ON/OFF設定（true: ガイド表示、false: ガイド非表示）'; 