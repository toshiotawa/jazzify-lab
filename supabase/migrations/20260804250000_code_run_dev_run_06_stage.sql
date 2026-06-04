-- Code Run stage 116: dev_run_06 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_06',
  'Dev Run 06',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":100,"worldTilesHigh":30,"worldHeight":1440,"groundRow":0,"spawn":{"c":2,"r":9},"pits":[],"manualGround":true,"goalOffsetX":18,"goal":{"c":98,"r":27},"solids":[{"kind":"ground","row":26,"c0":10,"c1":12},{"kind":"ground","row":27,"c0":10,"c1":12},{"kind":"ground","row":28,"c0":0,"c1":7},{"kind":"ground","row":28,"c0":10,"c1":12},{"kind":"ground","row":29,"c0":0,"c1":7},{"kind":"ground","row":29,"c0":10,"c1":12},{"kind":"platform","row":6,"c0":15,"c1":17},{"kind":"platform","row":8,"c0":61,"c1":64},{"kind":"platform","row":9,"c0":15,"c1":17},{"kind":"platform","row":11,"c0":57,"c1":60},{"kind":"platform","row":12,"c0":15,"c1":17},{"kind":"platform","row":12,"c0":71,"c1":72},{"kind":"platform","row":14,"c0":47,"c1":49},{"kind":"platform","row":14,"c0":61,"c1":64},{"kind":"platform","row":14,"c0":73,"c1":74},{"kind":"platform","row":15,"c0":15,"c1":17},{"kind":"platform","row":15,"c0":76,"c1":79},{"kind":"platform","row":17,"c0":57,"c1":60},{"kind":"platform","row":17,"c0":80,"c1":83},{"kind":"platform","row":17,"c0":94,"c1":99},{"kind":"platform","row":18,"c0":15,"c1":17},{"kind":"platform","row":18,"c0":43,"c1":46},{"kind":"platform","row":18,"c0":86,"c1":88},{"kind":"platform","row":19,"c0":61,"c1":64},{"kind":"platform","row":20,"c0":90,"c1":93},{"kind":"platform","row":21,"c0":15,"c1":17},{"kind":"platform","row":21,"c0":57,"c1":60},{"kind":"platform","row":22,"c0":39,"c1":42},{"kind":"platform","row":24,"c0":15,"c1":17},{"kind":"platform","row":24,"c0":61,"c1":64},{"kind":"platform","row":26,"c0":15,"c1":17},{"kind":"platform","row":27,"c0":43,"c1":46},{"kind":"platform","row":27,"c0":51,"c1":54},{"kind":"platform","row":27,"c0":57,"c1":60},{"kind":"platform","row":28,"c0":65,"c1":99},{"kind":"platform","row":29,"c0":65,"c1":99},{"kind":"block","c":37,"r":0},{"kind":"block","row":0,"c0":50,"c1":51},{"kind":"block","c":37,"r":1},{"kind":"block","row":1,"c0":50,"c1":51},{"kind":"block","c":37,"r":2},{"kind":"block","row":2,"c0":50,"c1":51},{"kind":"block","row":3,"c0":19,"c1":33},{"kind":"block","c":37,"r":3},{"kind":"block","row":3,"c0":50,"c1":51},{"kind":"block","row":4,"c0":19,"c1":20},{"kind":"block","c":37,"r":4},{"kind":"block","row":4,"c0":50,"c1":51},{"kind":"block","row":4,"c0":65,"c1":68},{"kind":"block","row":5,"c0":19,"c1":20},{"kind":"block","c":37,"r":5},{"kind":"block","row":5,"c0":50,"c1":51},{"kind":"block","c":65,"r":5},{"kind":"block","row":5,"c0":68,"c1":71},{"kind":"block","row":6,"c0":19,"c1":20},{"kind":"block","c":37,"r":6},{"kind":"block","row":6,"c0":50,"c1":51},{"kind":"block","c":65,"r":6},{"kind":"block","row":6,"c0":71,"c1":73},{"kind":"block","row":6,"c0":83,"c1":84},{"kind":"block","row":7,"c0":19,"c1":20},{"kind":"block","row":7,"c0":24,"c1":37},{"kind":"block","row":7,"c0":50,"c1":51},{"kind":"block","c":65,"r":7},{"kind":"block","row":7,"c0":73,"c1":75},{"kind":"block","row":7,"c0":83,"c1":84},{"kind":"block","row":8,"c0":19,"c1":20},{"kind":"block","row":8,"c0":50,"c1":51},{"kind":"block","c":65,"r":8},{"kind":"block","row":8,"c0":75,"c1":78},{"kind":"block","row":8,"c0":83,"c1":84},{"kind":"block","row":9,"c0":19,"c1":20},{"kind":"block","row":9,"c0":50,"c1":51},{"kind":"block","c":65,"r":9},{"kind":"block","c":70,"r":9},{"kind":"block","row":9,"c0":78,"c1":81},{"kind":"block","row":9,"c0":83,"c1":84},{"kind":"block","row":10,"c0":19,"c1":20},{"kind":"block","row":10,"c0":50,"c1":51},{"kind":"block","c":65,"r":10},{"kind":"block","c":70,"r":10},{"kind":"block","row":10,"c0":81,"c1":88},{"kind":"block","row":11,"c0":19,"c1":43},{"kind":"block","row":11,"c0":50,"c1":51},{"kind":"block","c":65,"r":11},{"kind":"block","c":70,"r":11},{"kind":"block","row":11,"c0":88,"c1":90},{"kind":"block","row":12,"c0":19,"c1":20},{"kind":"block","row":12,"c0":50,"c1":51},{"kind":"block","c":65,"r":12},{"kind":"block","c":70,"r":12},{"kind":"block","row":12,"c0":90,"c1":91},{"kind":"block","row":13,"c0":19,"c1":20},{"kind":"block","row":13,"c0":50,"c1":51},{"kind":"block","c":65,"r":13},{"kind":"block","c":70,"r":13},{"kind":"block","row":13,"c0":91,"c1":93},{"kind":"block","row":14,"c0":19,"c1":20},{"kind":"block","row":14,"c0":50,"c1":51},{"kind":"block","c":65,"r":14},{"kind":"block","c":70,"r":14},{"kind":"block","c":93,"r":14},{"kind":"block","row":15,"c0":19,"c1":20},{"kind":"block","row":15,"c0":50,"c1":51},{"kind":"block","c":65,"r":15},{"kind":"block","c":70,"r":15},{"kind":"block","row":16,"c0":19,"c1":20},{"kind":"block","row":16,"c0":50,"c1":51},{"kind":"block","c":65,"r":16},{"kind":"block","c":70,"r":16},{"kind":"block","row":17,"c0":19,"c1":20},{"kind":"block","row":17,"c0":50,"c1":51},{"kind":"block","c":65,"r":17},{"kind":"block","c":70,"r":17},{"kind":"block","row":18,"c0":19,"c1":20},{"kind":"block","row":18,"c0":47,"c1":51},{"kind":"block","c":65,"r":18},{"kind":"block","c":70,"r":18},{"kind":"block","row":19,"c0":19,"c1":20},{"kind":"block","c":65,"r":19},{"kind":"block","c":70,"r":19},{"kind":"block","row":20,"c0":19,"c1":20},{"kind":"block","c":65,"r":20},{"kind":"block","c":70,"r":20},{"kind":"block","row":21,"c0":19,"c1":20},{"kind":"block","c":65,"r":21},{"kind":"block","c":70,"r":21},{"kind":"block","row":22,"c0":19,"c1":20},{"kind":"block","c":65,"r":22},{"kind":"block","c":70,"r":22},{"kind":"block","row":23,"c0":19,"c1":20},{"kind":"block","c":65,"r":23},{"kind":"block","c":70,"r":23},{"kind":"block","row":24,"c0":19,"c1":20},{"kind":"block","c":65,"r":24},{"kind":"block","c":70,"r":24},{"kind":"block","row":25,"c0":19,"c1":20},{"kind":"block","c":65,"r":25},{"kind":"block","c":70,"r":25},{"kind":"block","row":26,"c0":19,"c1":20},{"kind":"block","c":65,"r":26},{"kind":"block","row":27,"c0":19,"c1":20},{"kind":"block","c":65,"r":27},{"kind":"block","row":28,"c0":19,"c1":20},{"kind":"block","row":29,"c0":19,"c1":20}],"spikes":[{"c":34,"row":7},{"c":35,"row":7},{"c":36,"row":7},{"c":71,"row":23},{"c":72,"row":23},{"c":73,"row":23},{"c":74,"row":23},{"c":75,"row":23},{"c":76,"row":23},{"c":77,"row":23},{"c":78,"row":23},{"c":79,"row":23},{"c":80,"row":23},{"c":81,"row":23},{"c":82,"row":23},{"c":83,"row":23},{"c":84,"row":23},{"c":85,"row":23},{"c":86,"row":23},{"c":87,"row":23},{"c":88,"row":23},{"c":89,"row":23},{"c":90,"row":23},{"c":91,"row":23},{"c":92,"row":23},{"c":93,"row":23},{"c":94,"row":23},{"c":95,"row":23},{"c":96,"row":23},{"c":97,"row":23},{"c":98,"row":23},{"c":99,"row":23},{"c":71,"row":24},{"c":72,"row":24},{"c":73,"row":24},{"c":74,"row":24},{"c":75,"row":24},{"c":76,"row":24},{"c":77,"row":24},{"c":78,"row":24},{"c":79,"row":24},{"c":80,"row":24},{"c":81,"row":24},{"c":82,"row":24},{"c":83,"row":24},{"c":84,"row":24},{"c":85,"row":24},{"c":86,"row":24},{"c":87,"row":24},{"c":88,"row":24},{"c":89,"row":24},{"c":90,"row":24},{"c":91,"row":24},{"c":92,"row":24},{"c":93,"row":24},{"c":94,"row":24},{"c":95,"row":24},{"c":96,"row":24},{"c":97,"row":24},{"c":98,"row":24},{"c":99,"row":24},{"c":47,"row":29},{"c":48,"row":29},{"c":49,"row":29},{"c":50,"row":29}],"enemies":[{"c":11,"r":26,"id":"slime-11-26"},{"c":63,"r":19,"id":"slime-63-19"},{"c":58,"r":17,"id":"slime-58-17"},{"c":63,"r":14,"id":"slime-63-14"},{"c":59,"r":11,"id":"slime-59-11"},{"c":41,"r":11,"id":"slime-41-11"},{"c":24,"r":3,"id":"slime-24-3"},{"c":16,"r":6,"id":"slime-16-6"}],"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/tiles/graveyard/platform.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  116,
  'progression',
  'code_run',
  '開発: コードラン6',
  'Dev: Code Run 6',
  'easy',
  '',
  'コードラン6',
  'Code Run 6',
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
  'dev_run_06',
  130,
  '{
    "lines": [
      {"at_seconds": 2, "speaker": "fai", "text": "迷路と足場を組み合わせた横長ステージだよ。", "text_en": "This is a wide stage mixing mazes and platforms."},
      {"at_seconds": 10, "speaker": "jajii", "text": "スパイク帯の上を足場で渡れ。急ぐな。", "text_en": "Cross the spike lanes on the platforms. Do not rush."},
      {"at_seconds": 22, "speaker": "fai", "text": "右端の旗に触れたらゴール！", "text_en": "Touch the flag on the far right to clear!"}
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-06-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン6（テスト）',
  'Survival: Code Run 6 (test)',
  '迷路・足場・スパイク帯を組み合わせた横長コードランの開発者向けテスト課題です。',
  'Developer test assignment for a wide CodeRun stage with mazes, platforms, and spike lanes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に右端の旗に触れてください。足場を使ってスパイク帯を越えます。',
  'Reach the flag on the far right before the time limit. Use platforms to cross spike lanes.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-06-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-06-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  116,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン6）',
  'Assignment (Code Run 6)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
