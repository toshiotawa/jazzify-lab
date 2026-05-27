-- 第一ブロック（sort_order=0）の survival_stages を本番常時ヒントに設定
BEGIN;

UPDATE public.survival_stages ss
SET
  production_staff_hint_mode = 'always',
  production_keyboard_hint_mode = 'always'
FROM public.survival_stage_blocks ssb
WHERE ss.map_category = ssb.map_category
  AND ss.block_key = ssb.block_key
  AND ssb.sort_order = 0
  AND ss.map_category IN ('basic', 'songs', 'phrases');

COMMIT;
