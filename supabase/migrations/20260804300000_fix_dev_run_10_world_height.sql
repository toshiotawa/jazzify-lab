-- dev_run_10: worldHeight was 528 while spawn/geometry use rows up to 39 → instant pit death.
BEGIN;

UPDATE public.survival_run_maps
SET
  map_data = map_data || '{"worldHeight":1920}'::jsonb,
  updated_at = now()
WHERE id = 'dev_run_10'
  AND COALESCE((map_data->>'worldHeight')::int, 0) < 1920;

COMMIT;
