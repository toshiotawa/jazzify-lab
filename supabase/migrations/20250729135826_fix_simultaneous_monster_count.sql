-- simultaneous_monster_countカラムを再追加
-- 20250730000001_rollback_multi_monster_features.sqlで誤って削除されなかったため、カラムが存在しない場合のみ追加

ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS simultaneous_monster_count INTEGER NOT NULL DEFAULT 1 
CHECK (simultaneous_monster_count >= 1 AND simultaneous_monster_count <= 8);

-- コメントを再追加
COMMENT ON COLUMN fantasy_stages.simultaneous_monster_count IS '同時に出現するモンスターの数 (1-8)';

-- 既存のステージデータに適切な値を設定（もし必要なら）
UPDATE fantasy_stages SET simultaneous_monster_count = 1 WHERE simultaneous_monster_count IS NULL;