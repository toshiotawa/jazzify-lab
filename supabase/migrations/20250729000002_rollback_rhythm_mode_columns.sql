-- リズムモード用カラムのロールバック
-- 注意: このマイグレーションを実行すると、追加したカラムのデータが失われます

-- インデックスを削除
DROP INDEX IF EXISTS idx_fantasy_stages_play_mode;

-- カラムを削除
ALTER TABLE fantasy_stages 
DROP COLUMN IF EXISTS play_mode,
DROP COLUMN IF EXISTS time_signature,
DROP COLUMN IF EXISTS pattern_type,
DROP COLUMN IF EXISTS simultaneous_monster_count;

-- 追加したサンプルデータを削除（必要に応じて）
DELETE FROM fantasy_stages WHERE id IN ('R-1', 'R-2', 'R-3');

-- 削除されたカラムの確認
-- コメントを解除して確認用クエリを実行できます
/*
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'fantasy_stages'
ORDER BY 
    ordinal_position;
*/