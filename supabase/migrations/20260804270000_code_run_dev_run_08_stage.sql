-- Code Run stage 118: dev_run_08 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_08',
  'Dev Run 08',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":130,"worldTilesHigh":25,"worldHeight":1200,"groundRow":23,"spawn":{"c":2,"r":22},"pits":[],"solids":[{"kind":"ground","row":12,"c0":56,"c1":58},{"kind":"ground","row":13,"c0":56,"c1":58},{"kind":"ground","row":14,"c0":56,"c1":58},{"kind":"ground","row":15,"c0":56,"c1":58},{"kind":"ground","row":16,"c0":56,"c1":58},{"kind":"ground","row":17,"c0":56,"c1":58},{"kind":"ground","row":18,"c0":56,"c1":58},{"kind":"ground","row":19,"c0":56,"c1":58},{"kind":"ground","row":20,"c0":56,"c1":58},{"kind":"ground","row":21,"c0":56,"c1":58},{"kind":"ground","row":22,"c0":56,"c1":58},{"kind":"ground","row":23,"c0":0,"c1":16},{"kind":"ground","row":23,"c0":18,"c1":24},{"kind":"ground","row":23,"c0":28,"c1":29},{"kind":"ground","row":23,"c0":31,"c1":85},{"kind":"ground","row":24,"c0":0,"c1":16},{"kind":"ground","row":24,"c0":18,"c1":24},{"kind":"ground","row":24,"c0":28,"c1":29},{"kind":"ground","row":24,"c0":31,"c1":85},{"kind":"platform","row":5,"c0":31,"c1":34},{"kind":"platform","row":5,"c0":38,"c1":41},{"kind":"platform","row":5,"c0":45,"c1":48},{"kind":"platform","row":5,"c0":52,"c1":57},{"kind":"platform","row":5,"c0":67,"c1":72},{"kind":"platform","row":5,"c0":83,"c1":87},{"kind":"platform","row":5,"c0":99,"c1":102},{"kind":"platform","row":5,"c0":114,"c1":117},{"kind":"platform","row":6,"c0":23,"c1":26},{"kind":"platform","c":31,"r":6},{"kind":"platform","c":127,"r":6},{"kind":"platform","c":31,"r":7},{"kind":"platform","row":8,"c0":13,"c1":16},{"kind":"platform","c":31,"r":8},{"kind":"platform","row":8,"c0":59,"c1":63},{"kind":"platform","row":8,"c0":75,"c1":79},{"kind":"platform","row":8,"c0":90,"c1":94},{"kind":"platform","row":8,"c0":105,"c1":109},{"kind":"platform","row":8,"c0":120,"c1":123},{"kind":"platform","c":31,"r":9},{"kind":"platform","row":10,"c0":27,"c1":29},{"kind":"platform","c":31,"r":10},{"kind":"platform","row":11,"c0":13,"c1":16},{"kind":"platform","c":31,"r":11},{"kind":"platform","row":11,"c0":59,"c1":63},{"kind":"platform","c":127,"r":11},{"kind":"platform","c":31,"r":12},{"kind":"platform","c":31,"r":13},{"kind":"platform","c":69,"r":13},{"kind":"platform","row":14,"c0":13,"c1":16},{"kind":"platform","row":14,"c0":23,"c1":26},{"kind":"platform","c":31,"r":14},{"kind":"platform","row":14,"c0":59,"c1":117},{"kind":"platform","c":127,"r":14},{"kind":"platform","c":31,"r":15},{"kind":"platform","c":31,"r":16},{"kind":"platform","row":17,"c0":13,"c1":16},{"kind":"platform","c":31,"r":17},{"kind":"platform","c":127,"r":17},{"kind":"platform","c":31,"r":18},{"kind":"platform","row":19,"c0":27,"c1":29},{"kind":"platform","c":31,"r":19},{"kind":"platform","row":20,"c0":13,"c1":16},{"kind":"platform","c":31,"r":20},{"kind":"platform","c":127,"r":20},{"kind":"platform","c":31,"r":21},{"kind":"platform","c":31,"r":22},{"kind":"platform","row":24,"c0":86,"c1":90},{"kind":"platform","row":24,"c0":92,"c1":95},{"kind":"platform","row":24,"c0":97,"c1":101},{"kind":"platform","row":24,"c0":103,"c1":109},{"kind":"platform","row":24,"c0":111,"c1":118},{"kind":"platform","row":24,"c0":120,"c1":123},{"kind":"platform","row":24,"c0":125,"c1":129},{"kind":"block","c":22,"r":0},{"kind":"block","c":125,"r":0},{"kind":"block","c":22,"r":1},{"kind":"block","c":125,"r":1},{"kind":"block","c":22,"r":2},{"kind":"block","c":125,"r":2},{"kind":"block","c":22,"r":3},{"kind":"block","c":125,"r":3},{"kind":"block","row":4,"c0":3,"c1":17},{"kind":"block","c":22,"r":4},{"kind":"block","c":30,"r":4},{"kind":"block","c":125,"r":4},{"kind":"block","c":17,"r":5},{"kind":"block","c":22,"r":5},{"kind":"block","c":30,"r":5},{"kind":"block","c":125,"r":5},{"kind":"block","c":128,"r":5},{"kind":"block","c":17,"r":6},{"kind":"block","row":6,"c0":20,"c1":22},{"kind":"block","c":30,"r":6},{"kind":"block","c":125,"r":6},{"kind":"block","c":128,"r":6},{"kind":"block","c":17,"r":7},{"kind":"block","c":22,"r":7},{"kind":"block","c":30,"r":7},{"kind":"block","c":125,"r":7},{"kind":"block","c":128,"r":7},{"kind":"block","row":8,"c0":0,"c1":12},{"kind":"block","c":17,"r":8},{"kind":"block","c":22,"r":8},{"kind":"block","c":30,"r":8},{"kind":"block","c":125,"r":8},{"kind":"block","c":128,"r":8},{"kind":"block","row":9,"c0":17,"c1":19},{"kind":"block","c":22,"r":9},{"kind":"block","c":30,"r":9},{"kind":"block","c":125,"r":9},{"kind":"block","c":128,"r":9},{"kind":"block","c":17,"r":10},{"kind":"block","c":22,"r":10},{"kind":"block","c":30,"r":10},{"kind":"block","row":10,"c0":114,"c1":123},{"kind":"block","c":125,"r":10},{"kind":"block","c":128,"r":10},{"kind":"block","c":17,"r":11},{"kind":"block","c":22,"r":11},{"kind":"block","c":30,"r":11},{"kind":"block","c":118,"r":11},{"kind":"block","c":125,"r":11},{"kind":"block","c":128,"r":11},{"kind":"block","c":17,"r":12},{"kind":"block","row":12,"c0":20,"c1":22},{"kind":"block","c":30,"r":12},{"kind":"block","c":118,"r":12},{"kind":"block","c":125,"r":12},{"kind":"block","c":128,"r":12},{"kind":"block","c":17,"r":13},{"kind":"block","c":22,"r":13},{"kind":"block","c":30,"r":13},{"kind":"block","c":118,"r":13},{"kind":"block","c":125,"r":13},{"kind":"block","c":128,"r":13},{"kind":"block","c":12,"r":14},{"kind":"block","c":17,"r":14},{"kind":"block","c":22,"r":14},{"kind":"block","c":30,"r":14},{"kind":"block","c":118,"r":14},{"kind":"block","c":125,"r":14},{"kind":"block","c":128,"r":14},{"kind":"block","c":12,"r":15},{"kind":"block","row":15,"c0":17,"c1":19},{"kind":"block","c":22,"r":15},{"kind":"block","c":30,"r":15},{"kind":"block","c":125,"r":15},{"kind":"block","c":128,"r":15},{"kind":"block","c":12,"r":16},{"kind":"block","c":17,"r":16},{"kind":"block","c":22,"r":16},{"kind":"block","c":30,"r":16},{"kind":"block","c":125,"r":16},{"kind":"block","c":128,"r":16},{"kind":"block","c":12,"r":17},{"kind":"block","c":17,"r":17},{"kind":"block","c":22,"r":17},{"kind":"block","c":30,"r":17},{"kind":"block","c":125,"r":17},{"kind":"block","c":128,"r":17},{"kind":"block","c":12,"r":18},{"kind":"block","c":17,"r":18},{"kind":"block","row":18,"c0":20,"c1":22},{"kind":"block","c":30,"r":18},{"kind":"block","c":125,"r":18},{"kind":"block","c":128,"r":18},{"kind":"block","c":12,"r":19},{"kind":"block","c":17,"r":19},{"kind":"block","c":22,"r":19},{"kind":"block","c":30,"r":19},{"kind":"block","c":69,"r":19},{"kind":"block","c":74,"r":19},{"kind":"block","c":81,"r":19},{"kind":"block","c":89,"r":19},{"kind":"block","c":96,"r":19},{"kind":"block","c":101,"r":19},{"kind":"block","c":107,"r":19},{"kind":"block","c":116,"r":19},{"kind":"block","c":125,"r":19},{"kind":"block","c":128,"r":19},{"kind":"block","row":20,"c0":0,"c1":12},{"kind":"block","c":17,"r":20},{"kind":"block","c":22,"r":20},{"kind":"block","c":30,"r":20},{"kind":"block","row":20,"c0":66,"c1":125},{"kind":"block","c":128,"r":20},{"kind":"block","c":17,"r":21},{"kind":"block","c":30,"r":21},{"kind":"block","c":128,"r":21},{"kind":"block","c":17,"r":22},{"kind":"block","c":30,"r":22},{"kind":"block","c":128,"r":22},{"kind":"block","c":17,"r":23},{"kind":"block","c":30,"r":23},{"kind":"block","c":91,"r":23},{"kind":"block","c":96,"r":23},{"kind":"block","c":102,"r":23},{"kind":"block","c":110,"r":23},{"kind":"block","c":119,"r":23},{"kind":"block","c":124,"r":23},{"kind":"block","c":128,"r":23},{"kind":"block","c":17,"r":24},{"kind":"block","c":30,"r":24},{"kind":"block","c":91,"r":24},{"kind":"block","c":96,"r":24},{"kind":"block","c":102,"r":24},{"kind":"block","c":110,"r":24},{"kind":"block","c":119,"r":24},{"kind":"block","c":124,"r":24}],"spikes":[],"enemies":[{"c":9,"r":8,"id":"slime-9-8"},{"c":3,"r":8,"id":"slime-3-8"},{"c":2,"r":20,"id":"slime-2-20"},{"c":5,"r":20,"id":"slime-5-20"},{"c":8,"r":20,"id":"slime-8-20"},{"c":10,"r":20,"id":"slime-10-20"},{"c":24,"r":14,"id":"slime-24-14"},{"c":112,"r":14,"id":"slime-112-14"},{"c":106,"r":14,"id":"slime-106-14"},{"c":99,"r":14,"id":"slime-99-14"},{"c":92,"r":14,"id":"slime-92-14"},{"c":85,"r":14,"id":"slime-85-14"},{"c":77,"r":14,"id":"slime-77-14"},{"c":69,"r":14,"id":"slime-69-14"},{"c":65,"r":14,"id":"slime-65-14"},{"c":104,"r":19,"id":"slime-104-19"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":129,"r":24},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/tiles/graveyard/platform.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  map_data = EXCLUDED.map_data,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, play_mode, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression,
  lesson_only, run_map_id, run_time_limit_sec, run_dialogue_script,
  production_staff_hint_mode, production_keyboard_hint_mode
) VALUES (
  'basic',
  118,
  'progression',
  'code_run',
  '開発: コードラン8',
  'Dev: Code Run 8',
  'easy',
  '',
  'コードラン8',
  'Code Run 8',
  NULL,
  '',
  '',
  'code_run',
  false,
  NULL,
  '[
    {"name":"Dm7(9)","voicing":[53,60,64,69],"voicing_names":["F3","C4","E4","A4"],"key_fifths":0,"voicing_staves":[2,2,1,1]},
    {"name":"G7(9.13)","voicing":[53,57,59,64],"voicing_names":["F3","A3","B3","E4"],"key_fifths":0,"voicing_staves":[2,2,2,1]},
    {"name":"CM7(9)","voicing":[52,55,59,62],"voicing_names":["E3","G3","B3","D4"],"key_fifths":0,"voicing_staves":[2,2,2,2]}
  ]'::jsonb,
  false,
  'dev_run_08',
  150,
  '{"lines":[{"at_seconds":2,"speaker":"fai","text":"迷路と縦の足場、上段の横長足場を組み合わせたステージだよ。スライムに注意！","text_en":"This stage mixes mazes, a vertical platform column, and upper walkways. Watch the slimes!"},{"at_seconds":12,"speaker":"jajii","text":"中央の柱を登って上段へ。右の長い足場で旗へ向かえ。","text_en":"Climb the central column to the upper route. Use the long platforms on the right to reach the flag."},{"at_seconds":24,"speaker":"fai","text":"右端の旗に触れたらゴール！","text_en":"Touch the flag on the far right to clear!"}]}'::jsonb,
  'fade_15s',
  'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  chord_suffix = EXCLUDED.chord_suffix,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  root_pattern = EXCLUDED.root_pattern,
  root_pattern_name = EXCLUDED.root_pattern_name,
  root_pattern_name_en = EXCLUDED.root_pattern_name_en,
  block_key = EXCLUDED.block_key,
  is_mixed_stage = EXCLUDED.is_mixed_stage,
  mixed_group_key = EXCLUDED.mixed_group_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  run_map_id = EXCLUDED.run_map_id,
  run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.lessons (
  id,
  course_id,
  title,
  title_en,
  description,
  description_en,
  premium_only,
  order_index,
  block_number,
  block_name,
  block_name_en,
  nav_links,
  assignment_description,
  assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-08-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン8（テスト）',
  'Survival: Code Run 8 (test)',
  '迷路・縦足場・上段横長ルートを組み合わせたコードラン。スライムありの開発者向けテスト課題です。',
  'Developer test assignment for a CodeRun stage with mazes, vertical platforms, upper routes, and slimes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に右端の旗に触れてください。中央の足場を登り、上段から進みます。',
  'Reach the flag on the far right before the time limit. Climb the central platforms and cross the upper route.'
FROM (
  SELECT MAX(order_index) AS max_o
  FROM public.lessons
  WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')
) mx
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  song_id,
  order_index,
  clear_conditions,
  is_fantasy,
  fantasy_stage_id,
  is_survival,
  survival_stage_number,
  survival_map_category,
  is_ear_training,
  ear_training_stage_id,
  title,
  title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-08-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-08-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  118,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン8）',
  'Assignment (Code Run 8)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
