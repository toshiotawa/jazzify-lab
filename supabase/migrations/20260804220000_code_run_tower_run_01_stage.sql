-- Code Run stage 114: vertical tower map.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'tower_run_01',
  'Tower Run 01',
  '{
    "source": "db",
    "variant": "tower",
    "layoutVersion": 1,
    "viewWidth": 960,
    "viewHeight": 528,
    "tileSize": 48,
    "worldTilesWide": 32,
    "worldTilesHigh": 26,
    "worldHeight": 1248,
    "groundRow": 24,
    "spawn": {"c": 2, "r": 24},
    "goal": {"c": 27, "r": 3},
    "goalOffsetX": 8,
    "pits": [{"c0":7,"c1":10},{"c0":17,"c1":19}],
    "solids": [
      {"kind":"brick","row":23,"c0":0,"c1":5},
      {"kind":"brick","row":23,"c0":11,"c1":16},
      {"kind":"brick","row":23,"c0":20,"c1":31},
      {"kind":"platform","row":21,"c0":5,"c1":8},
      {"kind":"platform","row":20,"c0":12,"c1":15},
      {"kind":"platform","row":18,"c0":18,"c1":21},
      {"kind":"platform","row":17,"c0":24,"c1":27},
      {"kind":"platform","row":15,"c0":20,"c1":22},
      {"kind":"platform","row":14,"c0":14,"c1":17},
      {"kind":"platform","row":12,"c0":8,"c1":11},
      {"kind":"platform","row":11,"c0":3,"c1":6},
      {"kind":"platform","row":9,"c0":8,"c1":10},
      {"kind":"platform","row":8,"c0":14,"c1":17},
      {"kind":"platform","row":6,"c0":20,"c1":23},
      {"kind":"platform","row":5,"c0":25,"c1":28},
      {"kind":"brick","row":3,"c0":26,"c1":30},
      {"kind":"brick","col":0,"r0":18,"r1":24},
      {"kind":"brick","col":31,"r0":15,"r1":24},
      {"kind":"brick","col":1,"r0":8,"r1":12},
      {"kind":"brick","col":30,"r0":4,"r1":9},
      {"kind":"block","c":9,"r":16},
      {"kind":"block","c":16,"r":10},
      {"kind":"block","c":24,"r":4}
    ],
    "spikes": [
      {"c":13,"row":23},
      {"c":14,"row":23},
      {"c":21,"row":23},
      {"c":22,"row":23},
      {"c":15,"row":14},
      {"c":21,"row":6}
    ],
    "enemies": [
      {"c":13,"r":20},
      {"c":20,"r":18},
      {"c":25,"r":17},
      {"c":15,"r":14},
      {"c":9,"r":12},
      {"c":16,"r":8},
      {"c":27,"r":5}
    ],
    "assets": {
      "background": "/RUN/background.png",
      "player": [
        "/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png",
        "/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png",
        "/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png",
        "/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"
      ],
      "playerHurt": "/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png",
      "slime": [
        "/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png",
        "/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"
      ],
      "tiles": {
        "ground": "/RUN/tiles/graveyard/ground_fill.png",
        "groundTop": "/RUN/tiles/graveyard/ground_top.png",
        "groundTopLeft": "/RUN/tiles/graveyard/ground_top_left.png",
        "groundTopRight": "/RUN/tiles/graveyard/ground_top_right.png",
        "brick": "/RUN/tiles/graveyard/brick.png",
        "platform": "/RUN/tiles/graveyard/platform.png",
        "block": "/RUN/graveyardtilesetnew/png/Objects/Crate.png",
        "spike": "/RUN/tiles/graveyard/spike.png",
        "flag": "/RUN/tiles/graveyard/flag.png"
      }
    }
  }'::jsonb
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
  114,
  'progression',
  'code_run',
  '開発: コードラン4 タワー',
  'Dev: Code Run 4 Tower',
  'easy',
  '',
  'コードラン4',
  'Code Run 4',
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
  'tower_run_01',
  120,
  '{
    "lines": [
      {"at_seconds": 2, "speaker": "fai", "text": "今回は上へ登るビル型ステージだよ。", "text_en": "This one climbs upward like a tower."},
      {"at_seconds": 9, "speaker": "jajii", "text": "カメラは縦にも追う。落ち着いて足場を選べ。", "text_en": "The camera follows vertically too. Choose each platform calmly."},
      {"at_seconds": 24, "speaker": "fai", "text": "最上階の旗に触れたらゴール！", "text_en": "Touch the flag at the top to clear!"}
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-04-tower-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン4 タワー（テスト）',
  'Survival: Code Run 4 Tower (test)',
  '縦スクロールするビル型コードランの開発者向けテスト課題です。',
  'Developer test assignment for a vertically scrolling tower-style CodeRun stage.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '上へ登り、最上階の旗に触れてください。',
  'Climb upward and touch the flag at the top.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-04-tower-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-04-tower-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  114,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン4 タワー）',
  'Assignment (Code Run 4 Tower)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
