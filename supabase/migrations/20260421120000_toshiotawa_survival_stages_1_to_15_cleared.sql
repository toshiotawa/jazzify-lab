-- 検証用: toshiotawa@me.com のサバイバルステージ1〜15をクリア済みにする（ボス戦テスト用）
-- 適用後: survival_stage_progress は current_stage_number=16, total_cleared_stages=15

WITH u AS (
  SELECT id AS user_id FROM auth.users WHERE email = 'toshiotawa@me.com' LIMIT 1
)
INSERT INTO public.survival_stage_clears (
  user_id,
  stage_number,
  character_id,
  survival_time_seconds,
  final_level,
  enemies_defeated,
  cleared_at
)
SELECT
  u.user_id,
  s.stage_number,
  NULL::uuid,
  90,
  10,
  300,
  timezone('utc', now())
FROM u
CROSS JOIN generate_series(1, 15) AS s(stage_number)
ON CONFLICT (user_id, stage_number) DO UPDATE SET
  survival_time_seconds = EXCLUDED.survival_time_seconds,
  final_level = EXCLUDED.final_level,
  enemies_defeated = EXCLUDED.enemies_defeated,
  cleared_at = EXCLUDED.cleared_at;

WITH u AS (
  SELECT id AS user_id FROM auth.users WHERE email = 'toshiotawa@me.com' LIMIT 1
)
INSERT INTO public.survival_stage_progress (
  user_id,
  current_stage_number,
  total_cleared_stages,
  updated_at
)
SELECT
  u.user_id,
  16,
  15,
  timezone('utc', now())
FROM u
ON CONFLICT (user_id) DO UPDATE SET
  current_stage_number = EXCLUDED.current_stage_number,
  total_cleared_stages = EXCLUDED.total_cleared_stages,
  updated_at = EXCLUDED.updated_at;
