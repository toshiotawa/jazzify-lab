-- Code Run stage 119: dev_run_09 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_09',
  'Dev Run 09',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":125,"worldTilesHigh":80,"worldHeight":3840,"groundRow":9,"spawn":{"c":2,"r":76},"pits":[],"solids":[{"kind":"platform","row":4,"c0":22,"c1":29},{"kind":"platform","row":5,"c0":18,"c1":20},{"kind":"platform","row":7,"c0":31,"c1":33},{"kind":"platform","row":9,"c0":13,"c1":15},{"kind":"platform","row":9,"c0":35,"c1":37},{"kind":"platform","row":11,"c0":56,"c1":66},{"kind":"platform","row":12,"c0":18,"c1":20},{"kind":"platform","row":12,"c0":39,"c1":41},{"kind":"platform","row":15,"c0":23,"c1":25},{"kind":"platform","row":15,"c0":51,"c1":55},{"kind":"platform","row":15,"c0":68,"c1":71},{"kind":"platform","row":19,"c0":26,"c1":28},{"kind":"platform","row":20,"c0":56,"c1":59},{"kind":"platform","row":20,"c0":73,"c1":76},{"kind":"platform","row":20,"c0":79,"c1":82},{"kind":"platform","row":20,"c0":86,"c1":88},{"kind":"platform","row":20,"c0":92,"c1":94},{"kind":"platform","row":20,"c0":98,"c1":100},{"kind":"platform","row":20,"c0":104,"c1":106},{"kind":"platform","row":20,"c0":110,"c1":113},{"kind":"platform","row":23,"c0":22,"c1":24},{"kind":"platform","row":24,"c0":51,"c1":55},{"kind":"platform","row":26,"c0":18,"c1":20},{"kind":"platform","row":29,"c0":13,"c1":15},{"kind":"platform","row":29,"c0":36,"c1":37},{"kind":"platform","row":29,"c0":56,"c1":59},{"kind":"platform","row":32,"c0":8,"c1":10},{"kind":"platform","row":34,"c0":51,"c1":55},{"kind":"platform","row":35,"c0":4,"c1":6},{"kind":"platform","row":38,"c0":4,"c1":6},{"kind":"platform","row":39,"c0":56,"c1":59},{"kind":"platform","row":42,"c0":4,"c1":6},{"kind":"platform","row":46,"c0":4,"c1":6},{"kind":"platform","row":50,"c0":4,"c1":6},{"kind":"platform","row":50,"c0":11,"c1":13},{"kind":"platform","row":50,"c0":18,"c1":20},{"kind":"platform","row":53,"c0":24,"c1":26},{"kind":"platform","row":57,"c0":28,"c1":31},{"kind":"platform","row":60,"c0":32,"c1":34},{"kind":"platform","row":63,"c0":28,"c1":31},{"kind":"platform","row":65,"c0":24,"c1":27},{"kind":"platform","row":67,"c0":20,"c1":23},{"kind":"platform","row":69,"c0":16,"c1":19},{"kind":"platform","row":71,"c0":12,"c1":15},{"kind":"platform","row":74,"c0":9,"c1":11},{"kind":"platform","row":77,"c0":5,"c1":8},{"kind":"platform","row":79,"c0":0,"c1":4},{"kind":"block","c":50,"r":0},{"kind":"block","c":50,"r":1},{"kind":"block","c":50,"r":2},{"kind":"block","c":50,"r":3},{"kind":"block","c":50,"r":4},{"kind":"block","c":50,"r":5},{"kind":"block","c":50,"r":6},{"kind":"block","c":50,"r":7},{"kind":"block","c":50,"r":8},{"kind":"block","c":50,"r":9},{"kind":"block","c":50,"r":10},{"kind":"block","c":50,"r":11},{"kind":"block","c":50,"r":12},{"kind":"block","c":50,"r":13},{"kind":"block","c":50,"r":14},{"kind":"block","c":50,"r":15},{"kind":"block","row":16,"c0":32,"c1":45},{"kind":"block","c":50,"r":16},{"kind":"block","row":17,"c0":32,"c1":45},{"kind":"block","c":50,"r":17},{"kind":"block","row":18,"c0":32,"c1":45},{"kind":"block","c":50,"r":18},{"kind":"block","row":19,"c0":32,"c1":45},{"kind":"block","c":50,"r":19},{"kind":"block","row":20,"c0":25,"c1":45},{"kind":"block","c":50,"r":20},{"kind":"block","c":25,"r":21},{"kind":"block","row":21,"c0":41,"c1":45},{"kind":"block","c":50,"r":21},{"kind":"block","c":25,"r":22},{"kind":"block","row":22,"c0":41,"c1":45},{"kind":"block","c":50,"r":22},{"kind":"block","c":25,"r":23},{"kind":"block","row":23,"c0":41,"c1":45},{"kind":"block","c":50,"r":23},{"kind":"block","c":25,"r":24},{"kind":"block","row":24,"c0":41,"c1":45},{"kind":"block","c":50,"r":24},{"kind":"block","c":25,"r":25},{"kind":"block","row":25,"c0":30,"c1":35},{"kind":"block","row":25,"c0":41,"c1":45},{"kind":"block","c":50,"r":25},{"kind":"block","c":25,"r":26},{"kind":"block","c":35,"r":26},{"kind":"block","row":26,"c0":41,"c1":45},{"kind":"block","c":50,"r":26},{"kind":"block","c":25,"r":27},{"kind":"block","c":35,"r":27},{"kind":"block","row":27,"c0":41,"c1":45},{"kind":"block","c":50,"r":27},{"kind":"block","c":25,"r":28},{"kind":"block","c":35,"r":28},{"kind":"block","row":28,"c0":41,"c1":45},{"kind":"block","c":50,"r":28},{"kind":"block","c":25,"r":29},{"kind":"block","c":35,"r":29},{"kind":"block","row":29,"c0":41,"c1":45},{"kind":"block","c":50,"r":29},{"kind":"block","c":25,"r":30},{"kind":"block","c":35,"r":30},{"kind":"block","c":50,"r":30},{"kind":"block","c":25,"r":31},{"kind":"block","c":35,"r":31},{"kind":"block","c":50,"r":31},{"kind":"block","c":25,"r":32},{"kind":"block","c":35,"r":32},{"kind":"block","c":50,"r":32},{"kind":"block","c":25,"r":33},{"kind":"block","row":33,"c0":35,"c1":50},{"kind":"block","c":25,"r":34},{"kind":"block","c":25,"r":35},{"kind":"block","c":25,"r":36},{"kind":"block","c":25,"r":37},{"kind":"block","c":25,"r":38},{"kind":"block","c":25,"r":39},{"kind":"block","c":25,"r":40},{"kind":"block","row":41,"c0":25,"c1":55}],"spikes":[{"c":30,"row":9},{"c":31,"row":9},{"c":30,"row":10},{"c":31,"row":10},{"c":30,"row":11},{"c":31,"row":11},{"c":30,"row":12},{"c":31,"row":12},{"c":30,"row":13},{"c":31,"row":13},{"c":30,"row":14},{"c":31,"row":14},{"c":30,"row":15},{"c":31,"row":15},{"c":30,"row":16},{"c":31,"row":16},{"c":30,"row":17},{"c":31,"row":17},{"c":30,"row":18},{"c":31,"row":18},{"c":30,"row":20},{"c":31,"row":20}],"enemies":[{"c":25,"r":4,"id":"slime-25-4"},{"c":29,"r":4,"id":"slime-29-4"},{"c":29,"r":41,"id":"slime-29-41"},{"c":34,"r":41,"id":"slime-34-41"},{"c":39,"r":41,"id":"slime-39-41"},{"c":47,"r":41,"id":"slime-47-41"},{"c":43,"r":41,"id":"slime-43-41"},{"c":37,"r":33,"id":"slime-37-33"},{"c":58,"r":11,"id":"slime-58-11"},{"c":63,"r":11,"id":"slime-63-11"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":112,"r":20},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  119,
  'progression',
  'code_run',
  '開発: コードラン9',
  'Dev: Code Run 9',
  'easy',
  '',
  'コードラン9',
  'Code Run 9',
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
  'dev_run_09',
  150,
  '{"lines":[{"at_seconds":2,"speaker":"fai","text":"ちくわ足場と箱迷路、上段の足場ラインを組み合わせたステージだよ。トゲとスライムに注意！","text_en":"This stage mixes chikuwa platforms, crate mazes, upper routes, spikes, and slimes."},{"at_seconds":12,"speaker":"jajii","text":"下から足場を登り、中央の迷路を抜けて上段の足場へ。右の旗を目指せ。","text_en":"Climb from below, cross the central maze, reach the upper platforms, and head for the flag on the right."},{"at_seconds":24,"speaker":"fai","text":"ゴールの旗に触れたらクリア！","text_en":"Touch the goal flag to clear!"}]}'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-09-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン9（テスト）',
  'Survival: Code Run 9 (test)',
  'ちくわ足場・箱迷路・上段ルートのコードラン。トゲとスライムありの開発者向けテスト課題です。',
  'Developer test assignment for a CodeRun stage with chikuwa platforms, crate mazes, upper routes, spikes, and slimes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に右の旗に触れてください。足場を登り迷路を抜け、上段から進みます。',
  'Reach the flag on the right before the time limit. Climb platforms, cross the maze, and use the upper route.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-09-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-09-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  119,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン9）',
  'Assignment (Code Run 9)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
