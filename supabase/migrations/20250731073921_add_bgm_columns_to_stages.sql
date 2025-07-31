-- BGM関連カラムの追加
ALTER TABLE stages
ADD COLUMN IF NOT EXISTS time_signature integer DEFAULT 4 CHECK (time_signature > 0 AND time_signature <= 16),
ADD COLUMN IF NOT EXISTS count_in_measures integer DEFAULT 0 CHECK (count_in_measures >= 0);

-- カラムにコメントを追加
COMMENT ON COLUMN stages.time_signature IS '拍子 (例: 4=4/4拍子, 3=3/4拍子)';
COMMENT ON COLUMN stages.count_in_measures IS 'カウントイン小節数 (BGMループ開始前の小節数)';

-- 既存のステージデータを更新（デフォルト値を明示的に設定）
UPDATE stages 
SET 
  time_signature = 4,
  count_in_measures = 0
WHERE time_signature IS NULL OR count_in_measures IS NULL;