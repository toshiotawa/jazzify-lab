-- dev_run_11: 横長ちくわ足場 + スライム6体レイアウトへ更新
BEGIN;

UPDATE public.survival_run_maps
SET
  map_data = '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":64,"worldTilesHigh":20,"worldHeight":528,"groundRow":9,"spawn":{"c":8,"r":10},"pits":[],"solids":[{"kind":"platform","row":11,"c0":8,"c1":60}],"spikes":[],"enemies":[{"c":13,"r":11,"id":"slime-13-11"},{"c":18,"r":11,"id":"slime-18-11"},{"c":22,"r":11,"id":"slime-22-11"},{"c":34,"r":11,"id":"slime-34-11"},{"c":28,"r":11,"id":"slime-28-11"},{"c":41,"r":11,"id":"slime-41-11"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":60,"r":11},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb,
  updated_at = now()
WHERE id = 'dev_run_11';

UPDATE public.survival_stages
SET
  run_dialogue_script = '{"lines":[{"at_seconds":2,"speaker":"fai","text":"長いちくわ足場の上を進むステージだよ。スライムに注意！","text_en":"Cross a long chikuwa platform. Watch the slimes!"},{"at_seconds":12,"speaker":"jajii","text":"右端の旗を目指せ。スライムを避けながら進め。","text_en":"Head for the flag on the far right. Dodge the slimes along the way."},{"at_seconds":24,"speaker":"fai","text":"右の旗に触れたらゴール！","text_en":"Touch the flag on the right to clear!"}]}'::jsonb,
  updated_at = now()
WHERE map_category = 'basic'
  AND stage_number = 121;

UPDATE public.lessons
SET
  description = '横長ちくわ足場を渡るコードラン。スライム6体ありの開発者向けテスト課題です。',
  description_en = 'Developer test assignment for a CodeRun stage with a long chikuwa platform and six slimes.',
  assignment_description = '制限時間以内に右端の旗に触れてください。足場上のスライムに注意して進みます。',
  assignment_description_en = 'Reach the flag on the far right before the time limit. Watch out for slimes on the platform.'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-11-lesson');

COMMIT;
