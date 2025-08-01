-- リズムモード対応のためのファンタジーステージテーブル拡張
-- mode列の値に'rhythm'を追加するため、新しいCHECK制約を設定

-- 既存のCHECK制約を削除（もし存在する場合）
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

-- mode列にリズムモードを含む新しいCHECK制約を追加
ALTER TABLE fantasy_stages ADD CONSTRAINT fantasy_stages_mode_check CHECK (mode IN ('single', 'progression', 'rhythm'));

-- コメントを更新
COMMENT ON COLUMN fantasy_stages.mode IS 'ステージモード: single(単体) | progression(進行) | rhythm(リズム)';