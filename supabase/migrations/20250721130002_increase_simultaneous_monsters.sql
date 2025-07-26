-- 同時出現モンスター数の上限を8体に増やす

-- 既存の制約を削除
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_simultaneous_monster_count_check;

-- 新しい制約を追加（1-8体）
ALTER TABLE fantasy_stages ADD CONSTRAINT fantasy_stages_simultaneous_monster_count_check 
CHECK (simultaneous_monster_count >= 1 AND simultaneous_monster_count <= 8);

-- コメントを更新
COMMENT ON COLUMN fantasy_stages.simultaneous_monster_count IS '同時に出現するモンスターの数 (1-8)';