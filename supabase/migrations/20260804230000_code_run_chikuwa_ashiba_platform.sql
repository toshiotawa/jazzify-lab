-- Code Run 開発者テストコース: 足場タイルを chikuwa_ashiba.png へ差し替え
BEGIN;

UPDATE public.survival_run_maps
SET
  map_data = map_data
    || jsonb_build_object(
      'assets',
      COALESCE(map_data->'assets', '{}'::jsonb)
        || jsonb_build_object(
          'tiles',
          COALESCE(map_data->'assets'->'tiles', '{}'::jsonb)
            || jsonb_build_object(
              'platform', '/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png'
            )
        )
    ),
  updated_at = now()
WHERE id IN (
  'night_city_run_01',
  'graveyard_run_02',
  'graveyard_run_03',
  'tower_run_01',
  'snow_run_01'
);

COMMIT;
