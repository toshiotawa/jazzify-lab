-- デイリーチャレンジの難易度をアプリ・Web 共通の5段階に合わせる
-- super_beginner / super_advanced は UI で選択可能だが、元マイグレーションの CHECK に含まれていなかった

ALTER TABLE daily_challenge_records
  DROP CONSTRAINT IF EXISTS daily_challenge_records_difficulty_check;

ALTER TABLE daily_challenge_records
  ADD CONSTRAINT daily_challenge_records_difficulty_check
  CHECK (difficulty IN (
    'super_beginner',
    'beginner',
    'intermediate',
    'advanced',
    'super_advanced'
  ));
