-- ファンタジーモード拡張機能のマイグレーション
-- 作成日: 2025-01-30
-- 説明: 複数同時モンスター、ボス、ヒーラー、ダメージ範囲などの新機能追加

-- fantasy_stagesテーブルに新しいカラムを追加
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS simultaneous_monsters INTEGER NOT NULL DEFAULT 1 CHECK (simultaneous_monsters >= 1 AND simultaneous_monsters <= 3),
ADD COLUMN IF NOT EXISTS has_boss BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS has_healer BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS player_max_hp INTEGER NOT NULL DEFAULT 100,
ADD COLUMN IF NOT EXISTS enemy_min_damage INTEGER NOT NULL DEFAULT 5,
ADD COLUMN IF NOT EXISTS enemy_max_damage INTEGER NOT NULL DEFAULT 15;

-- 既存のmin_damage, max_damageカラムは使わないが、後方互換性のため残す

-- ボスステージのサンプルデータを追加
INSERT INTO fantasy_stages (
    stage_number, name, description, max_hp, enemy_count, enemy_hp, 
    min_damage, max_damage, enemy_gauge_seconds, mode, allowed_chords, 
    monster_icon, simultaneous_monsters, has_boss, player_max_hp, 
    enemy_min_damage, enemy_max_damage
) VALUES
('3-1', '炎の試練', 'ボスが待ち受ける最初の試練', 4, 5, 5, 2, 2, 4.0, 'single', 
 '["C", "F", "G", "Am", "Dm", "Em", "G7", "C7", "FM7"]'::jsonb, 'fire', 2, false, 120, 10, 20),
('3-2', '氷の回廊', 'ヒーラーを含む敵との戦い', 4, 6, 4, 2, 2, 3.8, 'single', 
 '["Am7", "Dm7", "Em7", "FM7", "GM7", "C6", "D7"]'::jsonb, 'ice', 2, false, 120, 8, 18),
('3-3', '雷の塔', '3体同時出現の激戦', 3, 9, 3, 2, 2, 3.5, 'single', 
 '["G7", "C7", "F7", "B7", "E7", "A7", "D7", "CM7", "Am7"]'::jsonb, 'lightning', 3, false, 150, 12, 25),
('3-4', '闇の城', '魔王との最初の対決', 2, 3, 10, 3, 3, 3.0, 'single', 
 '["All"]'::jsonb, 'demon', 2, true, 150, 15, 30),
('3-5', '最終決戦', 'すべての力を試される究極の戦い', 2, 1, 20, 4, 4, 2.5, 'progression', 
 '["All"]'::jsonb, 'dragon', 1, true, 200, 20, 40)
ON CONFLICT (stage_number) DO UPDATE SET
    simultaneous_monsters = EXCLUDED.simultaneous_monsters,
    has_boss = EXCLUDED.has_boss,
    has_healer = EXCLUDED.has_healer,
    player_max_hp = EXCLUDED.player_max_hp,
    enemy_min_damage = EXCLUDED.enemy_min_damage,
    enemy_max_damage = EXCLUDED.enemy_max_damage;

-- 既存ステージのデータも更新
UPDATE fantasy_stages SET
    player_max_hp = 100,
    enemy_min_damage = 5,
    enemy_max_damage = 15
WHERE stage_number LIKE '1-%';

UPDATE fantasy_stages SET
    player_max_hp = 120,
    enemy_min_damage = 8,
    enemy_max_damage = 20
WHERE stage_number LIKE '2-%';

-- コメント追加
COMMENT ON COLUMN fantasy_stages.simultaneous_monsters IS '同時出現モンスター数 (1-3)';
COMMENT ON COLUMN fantasy_stages.has_boss IS 'ボスステージかどうか';
COMMENT ON COLUMN fantasy_stages.has_healer IS 'ヒーラーが含まれるかどうか';
COMMENT ON COLUMN fantasy_stages.player_max_hp IS 'プレイヤーの最大HP';
COMMENT ON COLUMN fantasy_stages.enemy_min_damage IS '敵の最小ダメージ';
COMMENT ON COLUMN fantasy_stages.enemy_max_damage IS '敵の最大ダメージ';