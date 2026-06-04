-- Code Run stage 115: snow_run_01 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'snow_run_01',
  'Snow Run 01',
  '{"source":"db","variant":"snow_climb","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":20,"worldTilesHigh":65,"worldHeight":3120,"groundRow":30,"spawn":{"c":4,"r":63},"goal":{"c":0,"r":63},"goalOffsetX":18,"manualGround":true,"pits":[],"solids":[{"kind":"platform","row":8,"c0":14,"c1":18},{"kind":"platform","row":11,"c0":14,"c1":16},{"kind":"platform","row":13,"c0":10,"c1":12},{"kind":"platform","row":15,"c0":6,"c1":8},{"kind":"platform","row":17,"c0":4,"c1":5},{"kind":"platform","row":19,"c0":5,"c1":7},{"kind":"platform","row":20,"c0":9,"c1":11},{"kind":"platform","row":20,"c0":13,"c1":15},{"kind":"platform","row":22,"c0":17,"c1":18},{"kind":"platform","row":27,"c0":8,"c1":10},{"kind":"platform","row":30,"c0":8,"c1":10},{"kind":"platform","row":34,"c0":2,"c1":4},{"kind":"platform","row":37,"c0":17,"c1":18},{"kind":"platform","row":39,"c0":17,"c1":18},{"kind":"platform","row":42,"c0":2,"c1":5},{"kind":"platform","row":42,"c0":7,"c1":9},{"kind":"platform","row":42,"c0":11,"c1":13},{"kind":"platform","row":42,"c0":15,"c1":17},{"kind":"platform","row":44,"c0":2,"c1":5},{"kind":"platform","row":46,"c0":2,"c1":5},{"kind":"platform","row":48,"c0":2,"c1":5},{"kind":"platform","row":50,"c0":2,"c1":5},{"kind":"platform","row":52,"c0":2,"c1":5},{"kind":"platform","row":52,"c0":9,"c1":11},{"kind":"platform","row":55,"c0":10,"c1":11},{"kind":"block","row":0,"c0":1,"c1":19},{"kind":"block","c":19,"r":1},{"kind":"block","c":19,"r":2},{"kind":"block","row":3,"c0":1,"c1":2},{"kind":"block","c":19,"r":3},{"kind":"block","row":4,"c0":1,"c1":3},{"kind":"block","c":19,"r":4},{"kind":"block","row":5,"c0":1,"c1":4},{"kind":"block","c":19,"r":5},{"kind":"block","row":6,"c0":1,"c1":5},{"kind":"block","c":19,"r":6},{"kind":"block","row":7,"c0":1,"c1":6},{"kind":"block","c":19,"r":7},{"kind":"block","row":8,"c0":1,"c1":13},{"kind":"block","c":19,"r":8},{"kind":"block","c":1,"r":9},{"kind":"block","c":19,"r":9},{"kind":"block","c":1,"r":10},{"kind":"block","c":19,"r":10},{"kind":"block","c":1,"r":11},{"kind":"block","c":19,"r":11},{"kind":"block","c":1,"r":12},{"kind":"block","c":19,"r":12},{"kind":"block","c":1,"r":13},{"kind":"block","c":19,"r":13},{"kind":"block","c":1,"r":14},{"kind":"block","c":19,"r":14},{"kind":"block","c":1,"r":15},{"kind":"block","c":19,"r":15},{"kind":"block","c":1,"r":16},{"kind":"block","row":16,"c0":11,"c1":13},{"kind":"block","c":19,"r":16},{"kind":"block","c":1,"r":17},{"kind":"block","c":19,"r":17},{"kind":"block","c":1,"r":18},{"kind":"block","c":19,"r":18},{"kind":"block","c":1,"r":19},{"kind":"block","c":19,"r":19},{"kind":"block","c":1,"r":20},{"kind":"block","c":19,"r":20},{"kind":"block","c":1,"r":21},{"kind":"block","c":19,"r":21},{"kind":"block","c":1,"r":22},{"kind":"block","c":19,"r":22},{"kind":"block","c":1,"r":23},{"kind":"block","c":19,"r":23},{"kind":"block","c":1,"r":24},{"kind":"block","c":19,"r":24},{"kind":"block","row":25,"c0":1,"c1":8},{"kind":"block","row":25,"c0":12,"c1":19},{"kind":"block","c":1,"r":26},{"kind":"block","c":19,"r":26},{"kind":"block","c":1,"r":27},{"kind":"block","c":19,"r":27},{"kind":"block","c":1,"r":28},{"kind":"block","c":19,"r":28},{"kind":"block","row":29,"c0":1,"c1":7},{"kind":"block","row":29,"c0":11,"c1":16},{"kind":"block","c":19,"r":29},{"kind":"block","c":1,"r":30},{"kind":"block","c":19,"r":30},{"kind":"block","c":1,"r":31},{"kind":"block","c":19,"r":31},{"kind":"block","c":1,"r":32},{"kind":"block","c":19,"r":32},{"kind":"block","c":1,"r":33},{"kind":"block","row":33,"c0":5,"c1":19},{"kind":"block","c":1,"r":34},{"kind":"block","c":19,"r":34},{"kind":"block","c":1,"r":35},{"kind":"block","c":19,"r":35},{"kind":"block","c":1,"r":36},{"kind":"block","c":5,"r":36},{"kind":"block","c":8,"r":36},{"kind":"block","c":11,"r":36},{"kind":"block","c":14,"r":36},{"kind":"block","c":19,"r":36},{"kind":"block","row":37,"c0":1,"c1":16},{"kind":"block","c":19,"r":37},{"kind":"block","c":1,"r":38},{"kind":"block","c":19,"r":38},{"kind":"block","c":1,"r":39},{"kind":"block","c":19,"r":39},{"kind":"block","c":1,"r":40},{"kind":"block","c":19,"r":40},{"kind":"block","c":1,"r":41},{"kind":"block","c":19,"r":41},{"kind":"block","c":1,"r":42},{"kind":"block","c":19,"r":42},{"kind":"block","c":1,"r":43},{"kind":"block","c":19,"r":43},{"kind":"block","c":1,"r":44},{"kind":"block","c":19,"r":44},{"kind":"block","c":1,"r":45},{"kind":"block","c":19,"r":45},{"kind":"block","c":1,"r":46},{"kind":"block","c":19,"r":46},{"kind":"block","c":1,"r":47},{"kind":"block","c":19,"r":47},{"kind":"block","c":1,"r":48},{"kind":"block","c":19,"r":48},{"kind":"block","c":1,"r":49},{"kind":"block","c":19,"r":49},{"kind":"block","c":1,"r":50},{"kind":"block","c":19,"r":50},{"kind":"block","c":1,"r":51},{"kind":"block","c":19,"r":51},{"kind":"block","c":1,"r":52},{"kind":"block","c":19,"r":52},{"kind":"block","c":1,"r":53},{"kind":"block","c":19,"r":53},{"kind":"block","c":1,"r":54},{"kind":"block","c":19,"r":54},{"kind":"block","row":55,"c0":1,"c1":9},{"kind":"block","row":55,"c0":12,"c1":19},{"kind":"block","c":1,"r":56},{"kind":"block","c":19,"r":56},{"kind":"block","c":1,"r":57},{"kind":"block","c":19,"r":57},{"kind":"block","c":1,"r":58},{"kind":"block","row":58,"c0":4,"c1":19},{"kind":"block","c":1,"r":59},{"kind":"block","c":19,"r":59},{"kind":"block","c":1,"r":60},{"kind":"block","c":19,"r":60},{"kind":"block","row":61,"c0":1,"c1":15},{"kind":"block","c":19,"r":61},{"kind":"block","c":1,"r":62},{"kind":"block","c":19,"r":62},{"kind":"block","c":1,"r":63},{"kind":"block","c":19,"r":63},{"kind":"block","row":64,"c0":0,"c1":19}],"spikes":[{"c":11,"row":16},{"c":12,"row":16},{"c":13,"row":16},{"c":2,"row":25},{"c":3,"row":25},{"c":4,"row":25},{"c":5,"row":25},{"c":6,"row":25},{"c":7,"row":25},{"c":8,"row":25},{"c":12,"row":25},{"c":18,"row":45},{"c":18,"row":46},{"c":18,"row":47},{"c":18,"row":48},{"c":18,"row":49},{"c":18,"row":50},{"c":18,"row":51},{"c":9,"row":52},{"c":10,"row":52},{"c":11,"row":52},{"c":18,"row":52},{"c":18,"row":53},{"c":18,"row":54},{"c":18,"row":55}],"enemies":[{"c":3,"r":55,"id":"slime-3-55"},{"c":15,"r":55,"id":"slime-15-55"},{"c":9,"r":8,"id":"slime-9-8"},{"c":5,"r":25,"id":"slime-5-25"},{"c":3,"r":29,"id":"slime-3-29"},{"c":14,"r":29,"id":"slime-14-29"}],"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  115,
  'progression',
  'code_run',
  '開発: コードラン5 スノー登攀',
  'Dev: Code Run 5 Snow Climb',
  'easy',
  '',
  'コードラン5',
  'Code Run 5',
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
  'snow_run_01',
  150,
  '{
    "lines": [
      {"at_seconds": 2, "speaker": "fai", "text": "雪山を登攀するステージだよ。ちくわ足場を使って登ろう！", "text_en": "This stage climbs a snowy mountain. Use the chikuwa platforms!"},
      {"at_seconds": 10, "speaker": "jajii", "text": "足場は細い。ジャンプのタイミングを外すな。", "text_en": "The platforms are narrow. Don't mistime your jumps."},
      {"at_seconds": 22, "speaker": "fai", "text": "下の旗に触れたらゴールだよ。", "text_en": "Touch the flag below to clear!"}
    ]
  }'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-05-snow-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン5 スノー登攀（テスト）',
  'Survival: Code Run 5 Snow Climb (test)',
  '縦長の雪山登攀コードラン。ちくわ足場を使って頂上から麓のゴールへ降りる開発者向けテスト課題です。',
  'Developer test assignment for a vertically scrolling snow-climb CodeRun stage with chikuwa platforms.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '雪山を登攀し、麓の旗に触れてください。',
  'Climb the snowy mountain and touch the flag at the base.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-05-snow-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-05-snow-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  115,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン5 スノー登攀）',
  'Assignment (Code Run 5 Snow Climb)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
