-- Code Run Tutorial: graveyard_run_03 layout update (chikuwa platforms) + developer test lesson refresh
-- Note: map id is renamed to tutorial in 20260805250000_code_run_tutorial_rename.sql
BEGIN;

UPDATE public.survival_run_maps
SET
  map_data = '{"source":"db","variant":"tutorial","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":150,"worldTilesHigh":11,"worldHeight":528,"groundRow":9,"spawn":{"c":2,"r":8},"pits":[],"solids":[{"kind":"ground","row":7,"c0":102,"c1":103},{"kind":"ground","row":7,"c0":110,"c1":111},{"kind":"ground","row":7,"c0":118,"c1":119},{"kind":"ground","row":7,"c0":127,"c1":128},{"kind":"ground","row":7,"c0":136,"c1":137},{"kind":"ground","row":8,"c0":102,"c1":103},{"kind":"ground","row":8,"c0":110,"c1":111},{"kind":"ground","row":8,"c0":118,"c1":119},{"kind":"ground","row":8,"c0":127,"c1":128},{"kind":"ground","row":8,"c0":136,"c1":137},{"kind":"ground","row":9,"c0":0,"c1":149},{"kind":"ground","row":10,"c0":0,"c1":149},{"kind":"brick","c":14,"r":1},{"kind":"brick","row":1,"c0":72,"c1":76},{"kind":"brick","row":4,"c0":65,"c1":74},{"kind":"brick","row":4,"c0":106,"c1":107},{"kind":"brick","row":4,"c0":114,"c1":115},{"kind":"brick","row":4,"c0":122,"c1":124},{"kind":"brick","row":4,"c0":131,"c1":133},{"kind":"brick","c":6,"r":5},{"kind":"brick","row":5,"c0":12,"c1":16},{"kind":"brick","row":5,"c0":21,"c1":25},{"kind":"platform","row":4,"c0":43,"c1":44},{"kind":"platform","row":5,"c0":43,"c1":44},{"kind":"platform","row":6,"c0":43,"c1":44},{"kind":"platform","row":7,"c0":43,"c1":44},{"kind":"platform","row":8,"c0":43,"c1":44},{"kind":"block","row":0,"c0":59,"c1":60},{"kind":"block","row":1,"c0":59,"c1":60},{"kind":"block","row":2,"c0":59,"c1":60},{"kind":"block","row":2,"c0":95,"c1":96},{"kind":"block","row":3,"c0":49,"c1":50},{"kind":"block","row":3,"c0":55,"c1":56},{"kind":"block","row":3,"c0":59,"c1":60},{"kind":"block","row":3,"c0":94,"c1":96},{"kind":"block","row":4,"c0":45,"c1":56},{"kind":"block","row":4,"c0":59,"c1":60},{"kind":"block","row":4,"c0":93,"c1":96},{"kind":"block","row":5,"c0":45,"c1":46},{"kind":"block","row":5,"c0":92,"c1":96},{"kind":"block","row":6,"c0":45,"c1":46},{"kind":"block","row":6,"c0":91,"c1":96},{"kind":"block","row":7,"c0":45,"c1":46},{"kind":"block","c":71,"r":7},{"kind":"block","c":78,"r":7},{"kind":"block","row":7,"c0":90,"c1":96},{"kind":"block","row":8,"c0":30,"c1":31},{"kind":"block","row":8,"c0":38,"c1":39},{"kind":"block","row":8,"c0":45,"c1":46},{"kind":"block","c":65,"r":8},{"kind":"block","c":71,"r":8},{"kind":"block","c":78,"r":8},{"kind":"block","row":8,"c0":89,"c1":96}],"spikes":[{"c":47,"row":9},{"c":48,"row":9},{"c":49,"row":9},{"c":50,"row":9},{"c":51,"row":9}],"enemies":[{"c":23,"r":5,"id":"slime-23-5"},{"c":74,"r":1,"id":"slime-74-1"},{"c":14,"r":5,"id":"slime-14-5"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":148,"r":9},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb,
  updated_at = now()
WHERE id IN ('graveyard_run_03', 'tutorial');

UPDATE public.survival_stages
SET
  run_dialogue_script = '{"lines":[{"at_seconds":2,"speaker":"fai","text":"縦のちくわ足場を降りて、スパイク帯を越えよう。","text_en":"Descend the vertical chikuwa platforms and cross the spike lane."},{"at_seconds":10,"speaker":"jajii","text":"箱の迷路を抜けて右端の旗を目指せ。スライムに注意だ。","text_en":"Navigate the crate maze and head for the flag on the right. Watch the slimes."},{"at_seconds":22,"speaker":"fai","text":"右端の旗に触れたらゴール！","text_en":"Touch the flag on the right to clear!"}]}'::jsonb,
  updated_at = now()
WHERE map_category = 'basic'
  AND stage_number = 113;

UPDATE public.lessons
SET
  description = '縦のちくわ足場・箱迷路・スパイク帯を含む横長コードランの開発者向けテスト課題です。',
  description_en = 'Developer test assignment for a horizontal CodeRun stage with vertical chikuwa platforms, a crate maze, and spike lanes.',
  assignment_description = '制限時間以内に右端の旗に触れてください。ちくわ足場を降り、スパイク帯と箱迷路を抜けます。',
  assignment_description_en = 'Reach the flag on the right before the time limit. Descend the chikuwa platforms and cross the spike lane and crate maze.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-03-lesson');

COMMIT;
