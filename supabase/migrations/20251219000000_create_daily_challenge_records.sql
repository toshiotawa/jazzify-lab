-- デイリーチャレンジ（ダッシュボード「記録」用）の記録テーブル
-- 作成日: 2025-12-19

CREATE TABLE IF NOT EXISTS daily_challenge_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  played_on DATE NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  score INTEGER NOT NULL CHECK (score >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, played_on, difficulty)
);

CREATE INDEX IF NOT EXISTS daily_challenge_records_user_date_idx
  ON daily_challenge_records(user_id, played_on);

CREATE INDEX IF NOT EXISTS daily_challenge_records_user_difficulty_date_idx
  ON daily_challenge_records(user_id, difficulty, played_on);

ALTER TABLE daily_challenge_records ENABLE ROW LEVEL SECURITY;

-- 自分の記録のみ読み書き可能（管理者は全件）
DROP POLICY IF EXISTS daily_challenge_records_policy ON daily_challenge_records;
CREATE POLICY daily_challenge_records_policy ON daily_challenge_records FOR ALL USING (
  auth.uid() = user_id OR
  auth.uid() IN (SELECT id FROM profiles WHERE is_admin = true)
);

COMMENT ON TABLE daily_challenge_records IS 'デイリーチャレンジの日次記録（難易度別）';
