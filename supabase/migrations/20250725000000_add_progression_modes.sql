-- ファンタジーモードのプログレッションモード拡張
-- modeカラムの型定義を拡張し、chord_progression_dataカラムを追加

-- 既存のCHECK制約を削除（存在する場合のみ）
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

-- 一時的に全ての値を許可する制約を追加（マイグレーション中のエラーを防ぐ）
ALTER TABLE fantasy_stages 
ADD CONSTRAINT fantasy_stages_mode_check_temp 
CHECK (mode IS NOT NULL);

-- 既存のprogressionモードをprogression_orderに移行
UPDATE fantasy_stages 
SET mode = 'progression_order' 
WHERE mode = 'progression';

-- 一時的な制約を削除
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check_temp;

-- 正式な制約を追加
-- progression_order: 順番通りに出題
-- progression_random: ランダムに出題  
-- progression_timing: タイミング指定（chord_progression_dataを使用）
ALTER TABLE fantasy_stages 
ADD CONSTRAINT fantasy_stages_mode_check 
CHECK (mode IN ('single', 'progression_order', 'progression_random', 'progression_timing'));

-- chord_progression_dataカラムを追加（JSON形式のコード進行データ）
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS chord_progression_data JSONB DEFAULT NULL;

-- コメントを更新
COMMENT ON COLUMN fantasy_stages.mode IS 'single: 単一コードモード, progression_order: 順番通り出題, progression_random: ランダム出題, progression_timing: タイミング指定出題';
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'progression_timingモード用のJSON形式コード進行データ';