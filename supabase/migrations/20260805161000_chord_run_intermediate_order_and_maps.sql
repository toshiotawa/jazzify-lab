-- 横スクロールコードラン:中級 — 中級 tier 最上位 + マップ ID 5〜10 循環
BEGIN;

UPDATE public.courses
SET
  order_index = COALESCE((
    SELECT MIN(c.order_index)
    FROM public.courses c
    WHERE COALESCE(c.is_developer_only, false) = false
      AND COALESCE(c.is_visible, true) = true
      AND c.is_main_course = false
      AND c.difficulty_tier = 'intermediate'
      AND c.id <> uuid_generate_v5(
        'a0000000-0000-4000-8000-000000000001'::uuid,
        'course-chord-run-intermediate'
      )
  ), 0) - 1,
  updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'course-chord-run-intermediate'
);

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
  )[1 + mod(stage_number - 140, 6)],
  updated_at = now()
WHERE map_category = 'basic'
  AND stage_number >= 140
  AND stage_number <= 175;

COMMIT;
