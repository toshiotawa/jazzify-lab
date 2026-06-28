-- Code Run stage 182: Simple_01 map + developer test course lesson (C/F progression only).
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'Simple_01',
  'Simple 01',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":64,"worldTilesHigh":77,"worldHeight":3696,"groundRow":9,"spawn":{"c":2,"r":74},"pits":[],"solids":[{"kind":"brick","c":5,"r":0},{"kind":"brick","c":5,"r":1},{"kind":"brick","c":5,"r":2},{"kind":"brick","c":1,"r":3},{"kind":"brick","c":5,"r":3},{"kind":"brick","row":3,"c0":11,"c1":15},{"kind":"brick","c":1,"r":4},{"kind":"brick","c":5,"r":4},{"kind":"brick","c":11,"r":4},{"kind":"brick","c":15,"r":4},{"kind":"brick","c":1,"r":5},{"kind":"brick","c":5,"r":5},{"kind":"brick","c":11,"r":5},{"kind":"brick","c":15,"r":5},{"kind":"brick","c":1,"r":6},{"kind":"brick","c":5,"r":6},{"kind":"brick","c":11,"r":6},{"kind":"brick","c":15,"r":6},{"kind":"brick","c":1,"r":7},{"kind":"brick","c":5,"r":7},{"kind":"brick","c":11,"r":7},{"kind":"brick","c":15,"r":7},{"kind":"brick","c":1,"r":8},{"kind":"brick","c":5,"r":8},{"kind":"brick","c":11,"r":8},{"kind":"brick","c":15,"r":8},{"kind":"brick","c":1,"r":9},{"kind":"brick","c":5,"r":9},{"kind":"brick","c":11,"r":9},{"kind":"brick","c":15,"r":9},{"kind":"brick","c":1,"r":10},{"kind":"brick","c":5,"r":10},{"kind":"brick","c":11,"r":10},{"kind":"brick","c":15,"r":10},{"kind":"brick","c":1,"r":11},{"kind":"brick","c":5,"r":11},{"kind":"brick","c":11,"r":11},{"kind":"brick","c":15,"r":11},{"kind":"brick","c":1,"r":12},{"kind":"brick","c":5,"r":12},{"kind":"brick","c":11,"r":12},{"kind":"brick","c":15,"r":12},{"kind":"brick","c":1,"r":13},{"kind":"brick","c":5,"r":13},{"kind":"brick","c":11,"r":13},{"kind":"brick","c":15,"r":13},{"kind":"brick","c":1,"r":14},{"kind":"brick","c":5,"r":14},{"kind":"brick","c":11,"r":14},{"kind":"brick","c":15,"r":14},{"kind":"brick","c":1,"r":15},{"kind":"brick","c":5,"r":15},{"kind":"brick","c":11,"r":15},{"kind":"brick","c":15,"r":15},{"kind":"brick","c":1,"r":16},{"kind":"brick","c":5,"r":16},{"kind":"brick","c":11,"r":16},{"kind":"brick","c":15,"r":16},{"kind":"brick","c":1,"r":17},{"kind":"brick","c":5,"r":17},{"kind":"brick","c":11,"r":17},{"kind":"brick","c":15,"r":17},{"kind":"brick","c":1,"r":18},{"kind":"brick","c":5,"r":18},{"kind":"brick","c":11,"r":18},{"kind":"brick","c":15,"r":18},{"kind":"brick","c":1,"r":19},{"kind":"brick","c":11,"r":19},{"kind":"brick","c":15,"r":19},{"kind":"brick","c":1,"r":20},{"kind":"brick","c":11,"r":20},{"kind":"brick","c":15,"r":20},{"kind":"brick","c":1,"r":21},{"kind":"brick","c":11,"r":21},{"kind":"brick","c":15,"r":21},{"kind":"brick","row":22,"c0":0,"c1":15},{"kind":"brick","c":0,"r":23},{"kind":"brick","c":0,"r":24},{"kind":"brick","c":0,"r":25},{"kind":"brick","c":0,"r":26},{"kind":"brick","c":0,"r":27},{"kind":"brick","row":27,"c0":3,"c1":19},{"kind":"brick","c":0,"r":28},{"kind":"brick","row":28,"c0":3,"c1":4},{"kind":"brick","c":11,"r":28},{"kind":"brick","c":0,"r":29},{"kind":"brick","row":29,"c0":3,"c1":4},{"kind":"brick","c":11,"r":29},{"kind":"brick","c":0,"r":30},{"kind":"brick","row":30,"c0":3,"c1":4},{"kind":"brick","c":11,"r":30},{"kind":"brick","c":0,"r":31},{"kind":"brick","row":31,"c0":3,"c1":4},{"kind":"brick","c":11,"r":31},{"kind":"brick","c":0,"r":32},{"kind":"brick","row":32,"c0":3,"c1":4},{"kind":"brick","c":7,"r":32},{"kind":"brick","c":11,"r":32},{"kind":"brick","c":15,"r":32},{"kind":"brick","c":0,"r":33},{"kind":"brick","row":33,"c0":3,"c1":4},{"kind":"brick","c":7,"r":33},{"kind":"brick","c":11,"r":33},{"kind":"brick","c":15,"r":33},{"kind":"brick","c":0,"r":34},{"kind":"brick","row":34,"c0":3,"c1":4},{"kind":"brick","c":7,"r":34},{"kind":"brick","c":11,"r":34},{"kind":"brick","c":15,"r":34},{"kind":"brick","c":0,"r":35},{"kind":"brick","row":35,"c0":3,"c1":4},{"kind":"brick","c":7,"r":35},{"kind":"brick","c":11,"r":35},{"kind":"brick","c":15,"r":35},{"kind":"brick","c":0,"r":36},{"kind":"brick","row":36,"c0":3,"c1":4},{"kind":"brick","c":7,"r":36},{"kind":"brick","c":11,"r":36},{"kind":"brick","c":15,"r":36},{"kind":"brick","c":0,"r":37},{"kind":"brick","row":37,"c0":3,"c1":4},{"kind":"brick","c":7,"r":37},{"kind":"brick","c":11,"r":37},{"kind":"brick","c":15,"r":37},{"kind":"brick","c":0,"r":38},{"kind":"brick","c":7,"r":38},{"kind":"brick","c":11,"r":38},{"kind":"brick","c":15,"r":38},{"kind":"brick","c":0,"r":39},{"kind":"brick","c":7,"r":39},{"kind":"brick","c":15,"r":39},{"kind":"brick","c":0,"r":40},{"kind":"brick","c":7,"r":40},{"kind":"brick","c":15,"r":40},{"kind":"brick","row":41,"c0":0,"c1":15},{"kind":"brick","row":42,"c0":7,"c1":15},{"kind":"brick","row":43,"c0":7,"c1":15},{"kind":"brick","c":7,"r":44},{"kind":"brick","c":7,"r":45},{"kind":"brick","c":7,"r":46},{"kind":"brick","row":47,"c0":0,"c1":7},{"kind":"brick","row":47,"c0":11,"c1":19},{"kind":"brick","c":7,"r":48},{"kind":"brick","c":11,"r":48},{"kind":"brick","c":7,"r":49},{"kind":"brick","c":11,"r":49},{"kind":"brick","c":7,"r":50},{"kind":"brick","c":11,"r":50},{"kind":"brick","row":51,"c0":0,"c1":7},{"kind":"brick","row":51,"c0":11,"c1":19},{"kind":"brick","c":7,"r":52},{"kind":"brick","c":7,"r":53},{"kind":"brick","c":7,"r":54},{"kind":"brick","row":55,"c0":0,"c1":13},{"kind":"brick","row":60,"c0":3,"c1":19},{"kind":"brick","c":3,"r":61},{"kind":"brick","row":61,"c0":11,"c1":19},{"kind":"brick","c":3,"r":62},{"kind":"brick","row":62,"c0":11,"c1":19},{"kind":"brick","row":63,"c0":3,"c1":19},{"kind":"brick","row":66,"c0":0,"c1":15},{"kind":"brick","row":71,"c0":5,"c1":19},{"kind":"brick","c":5,"r":72},{"kind":"brick","c":5,"r":73},{"kind":"brick","c":5,"r":74},{"kind":"brick","c":5,"r":75},{"kind":"brick","row":76,"c0":0,"c1":19},{"kind":"platform","row":3,"c0":2,"c1":4},{"kind":"platform","row":3,"c0":16,"c1":19},{"kind":"platform","row":5,"c0":2,"c1":4},{"kind":"platform","row":5,"c0":16,"c1":19},{"kind":"platform","row":7,"c0":2,"c1":4},{"kind":"platform","row":7,"c0":16,"c1":19},{"kind":"platform","row":8,"c0":16,"c1":19},{"kind":"platform","row":9,"c0":2,"c1":4},{"kind":"platform","row":10,"c0":16,"c1":19},{"kind":"platform","row":11,"c0":2,"c1":4},{"kind":"platform","row":12,"c0":16,"c1":19},{"kind":"platform","row":13,"c0":2,"c1":4},{"kind":"platform","row":14,"c0":16,"c1":19},{"kind":"platform","row":15,"c0":2,"c1":4},{"kind":"platform","row":16,"c0":16,"c1":19},{"kind":"platform","row":17,"c0":2,"c1":4},{"kind":"platform","row":17,"c0":16,"c1":19},{"kind":"platform","row":19,"c0":2,"c1":4},{"kind":"platform","row":19,"c0":16,"c1":19},{"kind":"platform","row":21,"c0":16,"c1":19},{"kind":"platform","row":23,"c0":16,"c1":19},{"kind":"platform","row":25,"c0":16,"c1":19},{"kind":"platform","row":28,"c0":1,"c1":2},{"kind":"platform","row":30,"c0":1,"c1":2},{"kind":"platform","row":32,"c0":1,"c1":2},{"kind":"platform","row":32,"c0":8,"c1":10},{"kind":"platform","row":32,"c0":16,"c1":19},{"kind":"platform","row":34,"c0":1,"c1":2},{"kind":"platform","row":34,"c0":8,"c1":10},{"kind":"platform","row":34,"c0":16,"c1":19},{"kind":"platform","row":36,"c0":1,"c1":2},{"kind":"platform","row":36,"c0":8,"c1":10},{"kind":"platform","row":36,"c0":16,"c1":19},{"kind":"platform","row":38,"c0":1,"c1":2},{"kind":"platform","row":38,"c0":8,"c1":10},{"kind":"platform","row":38,"c0":16,"c1":19},{"kind":"platform","row":40,"c0":16,"c1":19},{"kind":"platform","row":43,"c0":16,"c1":19},{"kind":"platform","row":45,"c0":16,"c1":19},{"kind":"platform","row":47,"c0":8,"c1":10},{"kind":"platform","row":49,"c0":8,"c1":10},{"kind":"platform","row":51,"c0":8,"c1":10},{"kind":"platform","row":55,"c0":14,"c1":19},{"kind":"platform","row":57,"c0":14,"c1":19},{"kind":"platform","row":61,"c0":0,"c1":2},{"kind":"platform","row":63,"c0":0,"c1":2},{"kind":"platform","row":66,"c0":16,"c1":19},{"kind":"platform","row":68,"c0":16,"c1":19},{"kind":"platform","row":71,"c0":0,"c1":4},{"kind":"platform","row":73,"c0":0,"c1":4}],"spikes":[],"enemies":[],"goalOffsetX":18,"manualGround":true,"goal":{"c":0,"r":21},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  'basic', 182, 'progression', 'code_run', '開発: Simple 01', 'Dev: Simple 01', 'easy',
  '', 'Simple 01', 'Simple 01', NULL, '', '', 'code_run', false, NULL,
  '[
    {"name":"C","voicing":[48,52,55],"voicing_names":["C3","E3","G3"],"key_fifths":0,"voicing_staves":[2,2,2]},
    {"name":"F","voicing":[53,57,60],"voicing_names":["F3","A3","C4"],"key_fifths":-1,"voicing_staves":[2,2,2]},
    {"name":"C","voicing":[48,52,55],"voicing_names":["C3","E3","G3"],"key_fifths":0,"voicing_staves":[2,2,2]},
    {"name":"F","voicing":[53,57,60],"voicing_names":["F3","A3","C4"],"key_fifths":-1,"voicing_staves":[2,2,2]}
  ]'::jsonb,
  true, 'Simple_01', 150, NULL, 'fade_15s', 'fade_15s'
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type, play_mode = EXCLUDED.play_mode,
  name = EXCLUDED.name, name_en = EXCLUDED.name_en, difficulty = EXCLUDED.difficulty,
  chord_suffix = EXCLUDED.chord_suffix, chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  root_pattern = EXCLUDED.root_pattern, root_pattern_name = EXCLUDED.root_pattern_name,
  root_pattern_name_en = EXCLUDED.root_pattern_name_en, block_key = EXCLUDED.block_key,
  is_mixed_stage = EXCLUDED.is_mixed_stage, mixed_group_key = EXCLUDED.mixed_group_key,
  chord_progression = EXCLUDED.chord_progression, lesson_only = EXCLUDED.lesson_only,
  run_map_id = EXCLUDED.run_map_id, run_time_limit_sec = EXCLUDED.run_time_limit_sec,
  run_dialogue_script = EXCLUDED.run_dialogue_script,
  production_staff_hint_mode = EXCLUDED.production_staff_hint_mode,
  production_keyboard_hint_mode = EXCLUDED.production_keyboard_hint_mode,
  updated_at = now();

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en, premium_only,
  order_index, block_number, block_name, block_name_en, nav_links,
  assignment_description, assignment_description_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-simple-01-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: Simple 01（テスト）', 'Survival: Simple 01 (test)',
  '縦長のシンプルマップ（Simple_01）。出題は C と F のコードのみ。開発者向けテスト課題です。',
  'Developer test for the vertical Simple_01 CodeRun map. Chord prompts are C and F only.',
  false, COALESCE(mx.max_o, 0) + 1, 1, 'テスト', 'Test', '[]'::jsonb,
  '制限時間以内にゴールの旗に触れてください。出題コードは C と F のプログレッションです。マップ ID: Simple_01',
  'Reach the goal flag before the time limit. Chord prompts are a C/F progression. Map ID: Simple_01'
FROM (SELECT MAX(order_index) AS max_o FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')) mx
ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, title_en = EXCLUDED.title_en,
  description = EXCLUDED.description, description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en;

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions, is_fantasy, fantasy_stage_id,
  is_survival, survival_stage_number, survival_map_category, is_ear_training,
  ear_training_stage_id, title, title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-simple-01-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-simple-01-lesson'),
  NULL, 0, '{"count":1,"rank":"C"}'::jsonb, FALSE, NULL, TRUE, 182, 'basic', FALSE, NULL,
  '課題（Simple 01）', 'Assignment (Simple 01)'
)
ON CONFLICT (id) DO UPDATE SET is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions, title = EXCLUDED.title, title_en = EXCLUDED.title_en;

COMMIT;
