-- Code Run night_city_run_01: 夜のジャズ街向けカスタムタイルへ差し替え
BEGIN;

UPDATE public.survival_run_maps
SET
  map_data = map_data
    || jsonb_build_object(
      'assets',
      COALESCE(map_data->'assets', '{}'::jsonb)
        || jsonb_build_object(
          'playerHurt', '/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png',
          'tiles', jsonb_build_object(
            'ground', '/RUN/tiles/night-city/ground_fill.png',
            'groundTop', '/RUN/tiles/night-city/ground_top.png',
            'brick', '/RUN/tiles/night-city/brick.png',
            'platform', '/RUN/tiles/night-city/platform.png',
            'block', '/RUN/tiles/night-city/block.png',
            'spike', '/RUN/tiles/night-city/spike.png',
            'flag', '/RUN/tiles/night-city/flag.png'
          )
        )
    ),
  updated_at = now()
WHERE id = 'night_city_run_01';

COMMIT;
