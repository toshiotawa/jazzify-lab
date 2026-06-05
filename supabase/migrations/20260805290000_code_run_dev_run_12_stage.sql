-- Code Run stage 179: dev_run_12 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_12',
  'Dev Run 12',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":20,"worldTilesHigh":80,"worldHeight":3840,"groundRow":9,"spawn":{"c":1,"r":2},"pits":[],"solids":[{"kind":"brick","row":0,"c0":0,"c1":19},{"kind":"brick","c":0,"r":1},{"kind":"brick","c":19,"r":1},{"kind":"brick","c":0,"r":2},{"kind":"brick","c":3,"r":2},{"kind":"brick","c":5,"r":2},{"kind":"brick","c":19,"r":2},{"kind":"brick","row":3,"c0":0,"c1":8},{"kind":"brick","c":19,"r":3},{"kind":"brick","row":4,"c0":0,"c1":9},{"kind":"brick","c":19,"r":4},{"kind":"brick","row":5,"c0":0,"c1":10},{"kind":"brick","c":19,"r":5},{"kind":"brick","row":6,"c0":0,"c1":11},{"kind":"brick","c":19,"r":6},{"kind":"brick","c":0,"r":7},{"kind":"brick","c":12,"r":7},{"kind":"brick","c":19,"r":7},{"kind":"brick","c":0,"r":8},{"kind":"brick","c":13,"r":8},{"kind":"brick","c":19,"r":8},{"kind":"brick","c":0,"r":9},{"kind":"brick","c":14,"r":9},{"kind":"brick","c":19,"r":9},{"kind":"brick","c":0,"r":10},{"kind":"brick","c":15,"r":10},{"kind":"brick","c":19,"r":10},{"kind":"brick","row":11,"c0":0,"c1":15},{"kind":"brick","c":19,"r":11},{"kind":"brick","row":12,"c0":0,"c1":15},{"kind":"brick","c":19,"r":12},{"kind":"brick","row":13,"c0":0,"c1":1},{"kind":"brick","c":19,"r":13},{"kind":"brick","c":0,"r":14},{"kind":"brick","c":19,"r":14},{"kind":"brick","c":0,"r":15},{"kind":"brick","c":19,"r":15},{"kind":"brick","c":0,"r":16},{"kind":"brick","c":19,"r":16},{"kind":"brick","c":0,"r":17},{"kind":"brick","row":17,"c0":5,"c1":8},{"kind":"brick","row":17,"c0":11,"c1":13},{"kind":"brick","row":17,"c0":16,"c1":19},{"kind":"brick","c":0,"r":18},{"kind":"brick","row":18,"c0":4,"c1":5},{"kind":"brick","c":19,"r":18},{"kind":"brick","c":0,"r":19},{"kind":"brick","row":19,"c0":3,"c1":19},{"kind":"brick","c":0,"r":20},{"kind":"brick","row":20,"c0":3,"c1":5},{"kind":"brick","c":19,"r":20},{"kind":"brick","c":0,"r":21},{"kind":"brick","row":21,"c0":3,"c1":5},{"kind":"brick","c":19,"r":21},{"kind":"brick","c":0,"r":22},{"kind":"brick","row":22,"c0":3,"c1":5},{"kind":"brick","c":19,"r":22},{"kind":"brick","c":0,"r":23},{"kind":"brick","c":19,"r":23},{"kind":"brick","c":0,"r":24},{"kind":"brick","c":19,"r":24},{"kind":"brick","c":0,"r":25},{"kind":"brick","row":25,"c0":9,"c1":10},{"kind":"brick","c":19,"r":25},{"kind":"brick","c":0,"r":26},{"kind":"brick","row":26,"c0":9,"c1":10},{"kind":"brick","c":19,"r":26},{"kind":"brick","row":27,"c0":0,"c1":14},{"kind":"brick","c":19,"r":27},{"kind":"brick","c":0,"r":28},{"kind":"brick","c":14,"r":28},{"kind":"brick","c":19,"r":28},{"kind":"brick","c":0,"r":29},{"kind":"brick","c":14,"r":29},{"kind":"brick","c":19,"r":29},{"kind":"brick","c":0,"r":30},{"kind":"brick","c":14,"r":30},{"kind":"brick","c":19,"r":30},{"kind":"brick","c":0,"r":31},{"kind":"brick","c":14,"r":31},{"kind":"brick","c":19,"r":31},{"kind":"brick","c":0,"r":32},{"kind":"brick","row":32,"c0":5,"c1":9},{"kind":"brick","c":14,"r":32},{"kind":"brick","c":19,"r":32},{"kind":"brick","c":0,"r":33},{"kind":"brick","row":33,"c0":5,"c1":9},{"kind":"brick","c":14,"r":33},{"kind":"brick","c":19,"r":33},{"kind":"brick","c":0,"r":34},{"kind":"brick","row":34,"c0":5,"c1":9},{"kind":"brick","row":34,"c0":13,"c1":14},{"kind":"brick","c":19,"r":34},{"kind":"brick","c":0,"r":35},{"kind":"brick","row":35,"c0":5,"c1":9},{"kind":"brick","row":35,"c0":13,"c1":14},{"kind":"brick","c":19,"r":35},{"kind":"brick","c":0,"r":36},{"kind":"brick","row":36,"c0":5,"c1":10},{"kind":"brick","c":19,"r":36},{"kind":"brick","c":0,"r":37},{"kind":"brick","row":37,"c0":5,"c1":10},{"kind":"brick","c":19,"r":37},{"kind":"brick","c":0,"r":38},{"kind":"brick","row":38,"c0":5,"c1":19},{"kind":"brick","c":0,"r":39},{"kind":"brick","row":39,"c0":5,"c1":7},{"kind":"brick","c":19,"r":39},{"kind":"brick","c":0,"r":40},{"kind":"brick","row":40,"c0":5,"c1":7},{"kind":"brick","c":19,"r":40},{"kind":"brick","c":0,"r":41},{"kind":"brick","row":41,"c0":5,"c1":7},{"kind":"brick","c":19,"r":41},{"kind":"brick","c":0,"r":42},{"kind":"brick","row":42,"c0":5,"c1":7},{"kind":"brick","c":19,"r":42},{"kind":"brick","c":0,"r":43},{"kind":"brick","row":43,"c0":5,"c1":7},{"kind":"brick","c":14,"r":43},{"kind":"brick","c":19,"r":43},{"kind":"brick","c":0,"r":44},{"kind":"brick","row":44,"c0":5,"c1":7},{"kind":"brick","c":14,"r":44},{"kind":"brick","c":19,"r":44},{"kind":"brick","c":0,"r":45},{"kind":"brick","row":45,"c0":5,"c1":9},{"kind":"brick","c":14,"r":45},{"kind":"brick","c":19,"r":45},{"kind":"brick","c":0,"r":46},{"kind":"brick","row":46,"c0":5,"c1":9},{"kind":"brick","c":14,"r":46},{"kind":"brick","c":19,"r":46},{"kind":"brick","c":0,"r":47},{"kind":"brick","row":47,"c0":5,"c1":9},{"kind":"brick","c":14,"r":47},{"kind":"brick","c":19,"r":47},{"kind":"brick","c":0,"r":48},{"kind":"brick","row":48,"c0":13,"c1":14},{"kind":"brick","c":19,"r":48},{"kind":"brick","c":0,"r":49},{"kind":"brick","row":49,"c0":13,"c1":14},{"kind":"brick","c":19,"r":49},{"kind":"brick","row":50,"c0":0,"c1":14},{"kind":"brick","c":19,"r":50},{"kind":"brick","row":51,"c0":0,"c1":14},{"kind":"brick","c":19,"r":51},{"kind":"brick","c":0,"r":52},{"kind":"brick","c":19,"r":52},{"kind":"brick","c":0,"r":53},{"kind":"brick","c":19,"r":53},{"kind":"brick","c":0,"r":54},{"kind":"brick","c":19,"r":54},{"kind":"brick","c":0,"r":55},{"kind":"brick","row":55,"c0":4,"c1":6},{"kind":"brick","row":55,"c0":15,"c1":19},{"kind":"brick","c":0,"r":56},{"kind":"brick","row":56,"c0":4,"c1":6},{"kind":"brick","row":56,"c0":13,"c1":19},{"kind":"brick","c":0,"r":57},{"kind":"brick","row":57,"c0":4,"c1":6},{"kind":"brick","row":57,"c0":11,"c1":19},{"kind":"brick","c":0,"r":58},{"kind":"brick","row":58,"c0":4,"c1":19},{"kind":"brick","c":0,"r":59},{"kind":"brick","c":19,"r":59},{"kind":"brick","c":0,"r":60},{"kind":"brick","c":19,"r":60},{"kind":"brick","c":0,"r":61},{"kind":"brick","c":19,"r":61},{"kind":"brick","c":0,"r":62},{"kind":"brick","c":19,"r":62},{"kind":"brick","row":63,"c0":0,"c1":4},{"kind":"brick","row":63,"c0":8,"c1":9},{"kind":"brick","row":63,"c0":13,"c1":14},{"kind":"brick","c":19,"r":63},{"kind":"brick","row":64,"c0":0,"c1":4},{"kind":"brick","row":64,"c0":8,"c1":9},{"kind":"brick","row":64,"c0":13,"c1":14},{"kind":"brick","c":19,"r":64},{"kind":"brick","row":65,"c0":0,"c1":17},{"kind":"brick","c":19,"r":65},{"kind":"brick","c":0,"r":66},{"kind":"brick","c":4,"r":66},{"kind":"brick","row":66,"c0":12,"c1":14},{"kind":"brick","c":19,"r":66},{"kind":"brick","c":0,"r":67},{"kind":"brick","c":4,"r":67},{"kind":"brick","row":67,"c0":12,"c1":14},{"kind":"brick","c":19,"r":67},{"kind":"brick","c":0,"r":68},{"kind":"brick","c":4,"r":68},{"kind":"brick","c":8,"r":68},{"kind":"brick","row":68,"c0":12,"c1":14},{"kind":"brick","row":68,"c0":17,"c1":19},{"kind":"brick","row":69,"c0":0,"c1":1},{"kind":"brick","c":4,"r":69},{"kind":"brick","c":8,"r":69},{"kind":"brick","c":14,"r":69},{"kind":"brick","row":69,"c0":17,"c1":19},{"kind":"brick","c":0,"r":70},{"kind":"brick","c":4,"r":70},{"kind":"brick","c":8,"r":70},{"kind":"brick","c":14,"r":70},{"kind":"brick","c":19,"r":70},{"kind":"brick","c":0,"r":71},{"kind":"brick","row":71,"c0":4,"c1":5},{"kind":"brick","row":71,"c0":8,"c1":9},{"kind":"brick","c":14,"r":71},{"kind":"brick","c":19,"r":71},{"kind":"brick","c":0,"r":72},{"kind":"brick","row":72,"c0":3,"c1":5},{"kind":"brick","row":72,"c0":8,"c1":9},{"kind":"brick","c":14,"r":72},{"kind":"brick","c":19,"r":72},{"kind":"brick","c":0,"r":73},{"kind":"brick","c":4,"r":73},{"kind":"brick","c":8,"r":73},{"kind":"brick","c":14,"r":73},{"kind":"brick","c":19,"r":73},{"kind":"brick","c":0,"r":74},{"kind":"brick","c":4,"r":74},{"kind":"brick","c":8,"r":74},{"kind":"brick","row":74,"c0":12,"c1":16},{"kind":"brick","c":19,"r":74},{"kind":"brick","row":75,"c0":0,"c1":1},{"kind":"brick","c":4,"r":75},{"kind":"brick","c":8,"r":75},{"kind":"brick","row":75,"c0":12,"c1":16},{"kind":"brick","c":19,"r":75},{"kind":"brick","c":0,"r":76},{"kind":"brick","c":4,"r":76},{"kind":"brick","c":8,"r":76},{"kind":"brick","c":19,"r":76},{"kind":"brick","c":0,"r":77},{"kind":"brick","row":77,"c0":8,"c1":10},{"kind":"brick","c":19,"r":77},{"kind":"brick","c":0,"r":78},{"kind":"brick","row":78,"c0":8,"c1":10},{"kind":"brick","c":19,"r":78},{"kind":"brick","row":79,"c0":0,"c1":19}],"spikes":[{"c":4,"row":3},{"c":6,"row":19},{"c":7,"row":19},{"c":8,"row":19},{"c":9,"row":19},{"c":10,"row":19},{"c":11,"row":19},{"c":12,"row":19},{"c":13,"row":19},{"c":14,"row":19},{"c":15,"row":19},{"c":16,"row":19},{"c":17,"row":19},{"c":18,"row":19},{"c":7,"row":58},{"c":8,"row":58},{"c":9,"row":58},{"c":10,"row":58},{"c":5,"row":65},{"c":6,"row":65},{"c":7,"row":65},{"c":10,"row":65},{"c":11,"row":65},{"c":12,"row":65}],"enemies":[{"c":4,"r":11,"id":"slime-4-11"},{"c":9,"r":11,"id":"slime-9-11"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":1,"r":69},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  179,
  'progression',
  'code_run',
  '開発: コードラン12',
  'Dev: Code Run 12',
  'easy',
  '',
  'コードラン12',
  'Code Run 12',
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
  true,
  'dev_run_12',
  180,
  '{"lines":[{"at_seconds":2,"speaker":"fai","text":"上から下へ降りる縦長タワーだよ。カメラも縦に追うから落ち着いて進んでね。","text_en":"This is a tall tower you descend from top to bottom. The camera follows vertically, so take your time."},{"at_seconds":12,"speaker":"jajii","text":"トゲとスライムに注意。レンガ迷路を抜けて最下段の旗を目指せ。","text_en":"Watch for spikes and slimes. Navigate the brick maze and head for the flag at the bottom."},{"at_seconds":28,"speaker":"fai","text":"最下段の旗に触れたらゴール！","text_en":"Touch the flag at the bottom to clear!"}]}'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-12-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン12（テスト）',
  'Survival: Code Run 12 (test)',
  '上から下へ降りる縦長タワー型コードラン。トゲ・スライムありの開発者向けテスト課題です。',
  'Developer test assignment for a vertically scrolling tower CodeRun stage with spikes and slimes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に最下段の旗に触れてください。上からレンガ迷路を降りて進みます。トゲとスライムに注意してください。',
  'Reach the flag at the bottom before the time limit. Descend from the top through the brick maze. Watch out for spikes and slimes.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-12-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-12-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  179,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン12）',
  'Assignment (Code Run 12)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
