-- ファンタジーモード拡張機能のロールバックマイグレーション
-- 作成日: 2025-01-30
-- 説明: 20250730000000_add_multi_monster_features.sqlの取り消し

-- 追加されたサンプルデータを削除
DELETE FROM fantasy_stages WHERE stage_number IN ('3-1', '3-2', '3-3', '3-4', '3-5');

-- 既存ステージのデータを元に戻す
UPDATE fantasy_stages SET
    player_max_hp = NULL,
    enemy_min_damage = NULL,
    enemy_max_damage = NULL
WHERE stage_number LIKE '1-%' OR stage_number LIKE '2-%';

-- 新しく追加されたカラムを削除
ALTER TABLE fantasy_stages 
DROP COLUMN IF EXISTS simultaneous_monsters,
DROP COLUMN IF EXISTS has_boss,
DROP COLUMN IF EXISTS has_healer,
DROP COLUMN IF EXISTS player_max_hp,
DROP COLUMN IF EXISTS enemy_min_damage,
DROP COLUMN IF EXISTS enemy_max_damage;

-- コメントを削除（PostgreSQLでは自動的に削除される） 