-- Code Run stage 117: dev_run_07 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_07',
  'Dev Run 07',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":135,"worldTilesHigh":11,"worldHeight":528,"groundRow":9,"spawn":{"c":2,"r":8},"pits":[],"solids":[{"kind":"ground","row":9,"c0":0,"c1":134},{"kind":"ground","row":10,"c0":0,"c1":134},{"kind":"block","c":32,"r":4},{"kind":"block","c":11,"r":5},{"kind":"block","c":29,"r":5},{"kind":"block","c":32,"r":5},{"kind":"block","c":35,"r":5},{"kind":"block","c":56,"r":5},{"kind":"block","c":61,"r":5},{"kind":"block","c":66,"r":5},{"kind":"block","c":71,"r":5},{"kind":"block","c":76,"r":5},{"kind":"block","c":82,"r":5},{"kind":"block","c":89,"r":5},{"kind":"block","c":94,"r":5},{"kind":"block","c":100,"r":5},{"kind":"block","c":106,"r":5},{"kind":"block","c":113,"r":5},{"kind":"block","c":119,"r":5},{"kind":"block","c":125,"r":5},{"kind":"block","c":130,"r":5},{"kind":"block","c":8,"r":6},{"kind":"block","c":11,"r":6},{"kind":"block","c":14,"r":6},{"kind":"block","c":26,"r":6},{"kind":"block","c":29,"r":6},{"kind":"block","c":32,"r":6},{"kind":"block","c":35,"r":6},{"kind":"block","c":38,"r":6},{"kind":"block","c":53,"r":6},{"kind":"block","c":56,"r":6},{"kind":"block","c":61,"r":6},{"kind":"block","c":66,"r":6},{"kind":"block","c":71,"r":6},{"kind":"block","c":76,"r":6},{"kind":"block","c":82,"r":6},{"kind":"block","c":89,"r":6},{"kind":"block","c":94,"r":6},{"kind":"block","c":100,"r":6},{"kind":"block","c":106,"r":6},{"kind":"block","c":113,"r":6},{"kind":"block","c":119,"r":6},{"kind":"block","c":125,"r":6},{"kind":"block","c":130,"r":6},{"kind":"block","c":5,"r":7},{"kind":"block","c":8,"r":7},{"kind":"block","c":11,"r":7},{"kind":"block","c":14,"r":7},{"kind":"block","c":17,"r":7},{"kind":"block","c":23,"r":7},{"kind":"block","c":26,"r":7},{"kind":"block","c":29,"r":7},{"kind":"block","c":32,"r":7},{"kind":"block","c":35,"r":7},{"kind":"block","c":38,"r":7},{"kind":"block","c":41,"r":7},{"kind":"block","c":47,"r":7},{"kind":"block","c":53,"r":7},{"kind":"block","c":56,"r":7},{"kind":"block","c":61,"r":7},{"kind":"block","c":66,"r":7},{"kind":"block","c":71,"r":7},{"kind":"block","c":76,"r":7},{"kind":"block","c":82,"r":7},{"kind":"block","c":89,"r":7},{"kind":"block","c":94,"r":7},{"kind":"block","c":100,"r":7},{"kind":"block","c":106,"r":7},{"kind":"block","c":113,"r":7},{"kind":"block","c":119,"r":7},{"kind":"block","c":125,"r":7},{"kind":"block","c":130,"r":7},{"kind":"block","c":5,"r":8},{"kind":"block","c":8,"r":8},{"kind":"block","c":11,"r":8},{"kind":"block","c":14,"r":8},{"kind":"block","c":17,"r":8},{"kind":"block","c":20,"r":8},{"kind":"block","c":23,"r":8},{"kind":"block","c":26,"r":8},{"kind":"block","c":29,"r":8},{"kind":"block","c":32,"r":8},{"kind":"block","c":35,"r":8},{"kind":"block","c":38,"r":8},{"kind":"block","c":41,"r":8},{"kind":"block","c":44,"r":8},{"kind":"block","c":47,"r":8},{"kind":"block","c":50,"r":8},{"kind":"block","c":53,"r":8},{"kind":"block","c":56,"r":8},{"kind":"block","c":61,"r":8},{"kind":"block","c":66,"r":8},{"kind":"block","c":71,"r":8},{"kind":"block","c":76,"r":8},{"kind":"block","c":82,"r":8},{"kind":"block","c":89,"r":8},{"kind":"block","c":94,"r":8},{"kind":"block","c":100,"r":8},{"kind":"block","c":106,"r":8},{"kind":"block","c":113,"r":8},{"kind":"block","c":119,"r":8},{"kind":"block","c":125,"r":8},{"kind":"block","c":130,"r":8}],"spikes":[],"enemies":[],"goalOffsetX":18,"manualGround":true,"goal":{"c":133,"r":9},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/tiles/graveyard/platform.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  117,
  'progression',
  'code_run',
  '開発: コードラン7',
  'Dev: Code Run 7',
  'easy',
  '',
  'コードラン7',
  'Code Run 7',
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
  'dev_run_07',
  140,
  '{
    "lines": [
      {"at_seconds": 2, "speaker": "fai", "text": "段差の箱を伝う横長ステージだよ。敵もスパイクもないよ。", "text_en": "This is a wide stage of crate steps. No enemies or spikes."},
      {"at_seconds": 10, "speaker": "jajii", "text": "段差のリズムを読んで進め。飛びすぎるな。", "text_en": "Read the rhythm of the steps. Do not over-jump."},
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-07-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン7（テスト）',
  'Survival: Code Run 7 (test)',
  '段差の箱を伝う横長コードラン。敵・スパイクなしの開発者向けテスト課題です。',
  'Developer test assignment for a wide CodeRun stage with crate steps and no enemies or spikes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に右端の旗に触れてください。段差の箱を伝って進みます。',
  'Reach the flag on the far right before the time limit. Cross the crate steps.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-07-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-07-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  117,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン7）',
  'Assignment (Code Run 7)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
