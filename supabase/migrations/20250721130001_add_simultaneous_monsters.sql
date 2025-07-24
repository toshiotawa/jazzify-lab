-- マルチモンスターモード対応
-- 同時出現するモンスター数を設定できるようにする

-- fantasy_stagesテーブルに同時出現数カラムを追加
ALTER TABLE fantasy_stages ADD COLUMN IF NOT EXISTS simultaneous_monster_count INTEGER NOT NULL DEFAULT 1 CHECK (simultaneous_monster_count >= 1 AND simultaneous_monster_count <= 3);

-- コメント追加
COMMENT ON COLUMN fantasy_stages.simultaneous_monster_count IS '同時に出現するモンスターの数 (1-3)';

-- 既存データの更新（必要に応じて）
-- ステージ2-2以降は2体同時、2-5は3体同時に設定
UPDATE fantasy_stages SET simultaneous_monster_count = 2 WHERE stage_number IN ('2-2', '2-3', '2-4');
UPDATE fantasy_stages SET simultaneous_monster_count = 3 WHERE stage_number = '2-5';