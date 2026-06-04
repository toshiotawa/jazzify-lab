-- dev_run_09: worldHeight を縦スクロール用に worldTilesHigh * tileSize へ修正（落下即死防止）
BEGIN;

UPDATE public.survival_run_maps
SET
  map_data = jsonb_set(map_data, '{worldHeight}', '3840'::jsonb),
  updated_at = now()
WHERE id = 'dev_run_09'
  AND (map_data->>'worldHeight')::int < 3840;

COMMIT;
