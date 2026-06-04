-- コードラン初級: マップ ID 5〜10 をクエスト順に循環（ブロック境界でも継続）
-- 5=snow_run_01, 6=dev_run_06, 7=dev_run_07, 8=dev_run_08, 9=dev_run_09, 10=dev_run_10
-- 例: メジャートライアド b1-q1〜q3 → 5,6,7 / マイナートライアド b2-q1〜q3 → 8,9,10 / b3-q1 以降 5 から再開
BEGIN;

UPDATE public.survival_stages
SET
  run_map_id = (
    ARRAY[
      'snow_run_01',
      'dev_run_06',
      'dev_run_07',
      'dev_run_08',
      'dev_run_09',
      'dev_run_10'
    ]
  )[1 + mod(stage_number - 122, 6)],
  updated_at = now()
WHERE map_category = 'basic'
  AND stage_number >= 122
  AND stage_number <= 139;

COMMIT;
