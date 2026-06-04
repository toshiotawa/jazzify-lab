-- Code Run night_city_run_01: 夜系ステージ向け石タイルと hurt スプライトを map_data に反映
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
            'ground', '/RUN/kenney_new-platformer-pack-1/Sprites/Tiles/Default/terrain_stone_block_center.png',
            'brick', '/RUN/kenney_new-platformer-pack-1/Sprites/Tiles/Default/bricks_grey.png',
            'platform', '/RUN/kenney_new-platformer-pack-1/Sprites/Tiles/Default/terrain_stone_cloud_middle.png',
            'block', '/RUN/kenney_new-platformer-pack-1/Sprites/Tiles/Default/brick_grey.png',
            'spike', '/RUN/kenney_new-platformer-pack-1/Sprites/Tiles/Default/spikes.png',
            'flag', '/RUN/kenney_new-platformer-pack-1/Sprites/Tiles/Default/flag_blue_a.png'
          )
        )
    ),
  updated_at = now()
WHERE id = 'night_city_run_01';

COMMIT;
