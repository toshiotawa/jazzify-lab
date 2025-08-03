-- リズムモードをfantasy_stagesのmodeに追加
-- 説明: fantasy_stagesテーブルのmode列に'rhythm'を追加し、プログレッションパターンのタイミング機能を有効にする

-- 既存の制約を削除
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;

-- 新しい制約を追加（'rhythm'を含む）
ALTER TABLE fantasy_stages ADD CONSTRAINT fantasy_stages_mode_check 
  CHECK (mode = ANY (ARRAY['single'::text, 'progression'::text, 'rhythm'::text]));

-- コメントを更新
COMMENT ON COLUMN fantasy_stages.mode IS 'single: 単一コードモード, progression: コード進行モード, rhythm: リズムモード（タイミング判定あり）';