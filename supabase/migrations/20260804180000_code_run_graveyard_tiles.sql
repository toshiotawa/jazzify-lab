-- Code Run night_city_run_01: 墓場タイルセット・背景・木箱ブロックへ差し替え
BEGIN;

UPDATE public.survival_run_maps
SET
  map_data = map_data
    || jsonb_build_object(
      'assets',
      COALESCE(map_data->'assets', '{}'::jsonb)
        || jsonb_build_object(
          'background', '/RUN/background.png',
          'playerHurt', '/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png',
          'tiles', jsonb_build_object(
            'ground', '/RUN/tiles/graveyard/ground_fill.png',
            'groundTop', '/RUN/tiles/graveyard/ground_top.png',
            'groundTopLeft', '/RUN/tiles/graveyard/ground_top_left.png',
            'groundTopRight', '/RUN/tiles/graveyard/ground_top_right.png',
            'brick', '/RUN/tiles/graveyard/brick.png',
            'platform', '/RUN/tiles/graveyard/platform.png',
            'block', '/RUN/graveyardtilesetnew/png/Objects/Crate.png',
            'spike', '/RUN/tiles/graveyard/spike.png',
            'flag', '/RUN/tiles/graveyard/flag.png'
          )
        )
    ),
  updated_at = now()
WHERE id = 'night_city_run_01';

COMMIT;
