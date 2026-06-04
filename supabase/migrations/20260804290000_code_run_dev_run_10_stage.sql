-- Code Run stage 120: dev_run_10 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_10',
  'Dev Run 10',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":100,"worldTilesHigh":40,"worldHeight":528,"groundRow":9,"spawn":{"c":2,"r":35},"pits":[],"solids":[{"kind":"ground","row":5,"c0":56,"c1":57},{"kind":"ground","row":6,"c0":56,"c1":57},{"kind":"ground","row":7,"c0":56,"c1":57},{"kind":"ground","row":8,"c0":56,"c1":57},{"kind":"ground","row":9,"c0":56,"c1":57},{"kind":"ground","row":10,"c0":56,"c1":57},{"kind":"ground","row":11,"c0":56,"c1":57},{"kind":"ground","row":12,"c0":56,"c1":57},{"kind":"ground","row":13,"c0":56,"c1":57},{"kind":"ground","row":14,"c0":56,"c1":57},{"kind":"ground","row":15,"c0":56,"c1":57},{"kind":"ground","row":16,"c0":56,"c1":57},{"kind":"ground","row":17,"c0":56,"c1":57},{"kind":"ground","row":18,"c0":56,"c1":57},{"kind":"ground","row":19,"c0":56,"c1":57},{"kind":"ground","row":20,"c0":56,"c1":57},{"kind":"ground","row":21,"c0":56,"c1":57},{"kind":"ground","row":22,"c0":56,"c1":57},{"kind":"ground","row":23,"c0":56,"c1":57},{"kind":"ground","row":24,"c0":56,"c1":57},{"kind":"ground","row":25,"c0":56,"c1":57},{"kind":"ground","row":26,"c0":56,"c1":57},{"kind":"ground","row":27,"c0":56,"c1":57},{"kind":"ground","row":28,"c0":56,"c1":57},{"kind":"ground","row":29,"c0":56,"c1":57},{"kind":"ground","row":30,"c0":56,"c1":57},{"kind":"ground","row":31,"c0":56,"c1":57},{"kind":"ground","row":32,"c0":56,"c1":57},{"kind":"ground","row":33,"c0":56,"c1":57},{"kind":"ground","row":34,"c0":56,"c1":57},{"kind":"ground","row":35,"c0":56,"c1":57},{"kind":"ground","row":36,"c0":56,"c1":57},{"kind":"ground","row":37,"c0":56,"c1":57},{"kind":"ground","row":38,"c0":0,"c1":17},{"kind":"ground","row":38,"c0":21,"c1":23},{"kind":"ground","row":38,"c0":27,"c1":30},{"kind":"ground","row":38,"c0":34,"c1":37},{"kind":"ground","row":38,"c0":41,"c1":44},{"kind":"ground","row":38,"c0":49,"c1":52},{"kind":"ground","row":38,"c0":56,"c1":57},{"kind":"ground","row":38,"c0":62,"c1":71},{"kind":"ground","row":38,"c0":76,"c1":79},{"kind":"ground","row":38,"c0":82,"c1":92},{"kind":"ground","row":38,"c0":96,"c1":99},{"kind":"ground","row":39,"c0":0,"c1":17},{"kind":"ground","row":39,"c0":21,"c1":23},{"kind":"ground","row":39,"c0":27,"c1":30},{"kind":"ground","row":39,"c0":34,"c1":37},{"kind":"ground","row":39,"c0":41,"c1":44},{"kind":"ground","row":39,"c0":49,"c1":52},{"kind":"ground","row":39,"c0":56,"c1":57},{"kind":"ground","row":39,"c0":62,"c1":71},{"kind":"ground","row":39,"c0":76,"c1":79},{"kind":"ground","row":39,"c0":82,"c1":92},{"kind":"ground","row":39,"c0":96,"c1":99},{"kind":"platform","row":4,"c0":49,"c1":52},{"kind":"platform","row":4,"c0":96,"c1":99},{"kind":"platform","row":7,"c0":37,"c1":40},{"kind":"platform","row":7,"c0":43,"c1":46},{"kind":"platform","row":7,"c0":62,"c1":64},{"kind":"platform","row":7,"c0":96,"c1":99},{"kind":"platform","row":9,"c0":30,"c1":33},{"kind":"platform","row":10,"c0":96,"c1":99},{"kind":"platform","row":11,"c0":59,"c1":61},{"kind":"platform","row":12,"c0":25,"c1":28},{"kind":"platform","row":13,"c0":96,"c1":99},{"kind":"platform","row":15,"c0":30,"c1":33},{"kind":"platform","row":15,"c0":37,"c1":40},{"kind":"platform","row":15,"c0":43,"c1":46},{"kind":"platform","row":15,"c0":49,"c1":52},{"kind":"platform","row":15,"c0":62,"c1":64},{"kind":"platform","row":18,"c0":49,"c1":52},{"kind":"platform","row":19,"c0":59,"c1":61},{"kind":"platform","row":22,"c0":49,"c1":52},{"kind":"platform","row":22,"c0":93,"c1":94},{"kind":"platform","row":23,"c0":62,"c1":64},{"kind":"platform","row":26,"c0":49,"c1":52},{"kind":"platform","row":27,"c0":59,"c1":61},{"kind":"platform","row":28,"c0":69,"c1":72},{"kind":"platform","row":30,"c0":49,"c1":52},{"kind":"platform","row":32,"c0":62,"c1":64},{"kind":"platform","row":34,"c0":49,"c1":52},{"kind":"platform","row":34,"c0":96,"c1":99},{"kind":"platform","row":36,"c0":59,"c1":61},{"kind":"block","c":74,"r":0},{"kind":"block","c":74,"r":1},{"kind":"block","c":74,"r":2},{"kind":"block","c":74,"r":3},{"kind":"block","c":74,"r":4},{"kind":"block","c":74,"r":5},{"kind":"block","c":74,"r":6},{"kind":"block","row":7,"c0":65,"c1":74},{"kind":"block","c":65,"r":8},{"kind":"block","c":74,"r":8},{"kind":"block","c":65,"r":9},{"kind":"block","c":74,"r":9},{"kind":"block","c":65,"r":10},{"kind":"block","c":74,"r":10},{"kind":"block","c":65,"r":11},{"kind":"block","c":74,"r":11},{"kind":"block","c":65,"r":12},{"kind":"block","c":74,"r":12},{"kind":"block","c":65,"r":13},{"kind":"block","c":74,"r":13},{"kind":"block","c":65,"r":14},{"kind":"block","c":74,"r":14},{"kind":"block","row":15,"c0":65,"c1":74},{"kind":"block","c":68,"r":16},{"kind":"block","c":72,"r":16},{"kind":"block","c":68,"r":17},{"kind":"block","c":72,"r":17},{"kind":"block","c":68,"r":18},{"kind":"block","c":72,"r":18},{"kind":"block","row":18,"c0":86,"c1":99},{"kind":"block","row":19,"c0":68,"c1":72},{"kind":"block","row":19,"c0":77,"c1":86},{"kind":"block","c":68,"r":20},{"kind":"block","c":68,"r":21},{"kind":"block","row":21,"c0":89,"c1":92},{"kind":"block","row":22,"c0":68,"c1":92},{"kind":"block","row":23,"c0":68,"c1":92},{"kind":"block","c":68,"r":24},{"kind":"block","c":68,"r":25},{"kind":"block","c":68,"r":26},{"kind":"block","row":26,"c0":73,"c1":99},{"kind":"block","c":68,"r":27},{"kind":"block","c":68,"r":28},{"kind":"block","c":68,"r":29},{"kind":"block","c":68,"r":30},{"kind":"block","row":31,"c0":68,"c1":95}],"spikes":[],"enemies":[{"c":6,"r":38,"id":"slime-6-38"},{"c":11,"r":38,"id":"slime-11-38"},{"c":22,"r":38,"id":"slime-22-38"},{"c":28,"r":38,"id":"slime-28-38"},{"c":36,"r":38,"id":"slime-36-38"},{"c":42,"r":38,"id":"slime-42-38"},{"c":50,"r":38,"id":"slime-50-38"},{"c":69,"r":38,"id":"slime-69-38"},{"c":50,"r":15,"id":"slime-50-15"},{"c":44,"r":15,"id":"slime-44-15"},{"c":38,"r":15,"id":"slime-38-15"},{"c":31,"r":15,"id":"slime-31-15"},{"c":31,"id":"slime-31-9"},{"c":38,"r":7,"id":"slime-38-7"},{"c":44,"r":7,"id":"slime-44-7"},{"c":50,"r":4,"id":"slime-50-4"},{"c":68,"r":14,"id":"slime-68-14"},{"c":71,"r":14,"id":"slime-71-14"},{"c":80,"r":19,"id":"slime-80-19"},{"c":86,"r":18,"id":"slime-86-18"},{"c":93,"r":18,"id":"slime-93-18"},{"c":97,"r":17,"id":"slime-97-17"},{"c":80,"r":31,"id":"slime-80-31"},{"c":89,"r":31,"id":"slime-89-31"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":98,"r":3},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  120,
  'progression',
  'code_run',
  '開発: コードラン10',
  'Dev: Code Run 10',
  'easy',
  '',
  'コードラン10',
  'Code Run 10',
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
  'dev_run_10',
  150,
  '{"lines":[{"at_seconds":2,"speaker":"fai","text":"ちくわ足場と縦の壁、下の床の隙間を飛び越えるステージだよ。スライムに注意！","text_en":"This stage mixes chikuwa platforms, vertical walls, and gaps in the lower floor. Watch the slimes!"},{"at_seconds":12,"speaker":"jajii","text":"足場を登って中央の迷路を抜け、右上の旗を目指せ。","text_en":"Climb the platforms, cross the central maze, and head for the flag in the upper right."},{"at_seconds":24,"speaker":"fai","text":"旗に触れたらゴール！","text_en":"Touch the flag to clear!"}]}'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-10-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン10（テスト）',
  'Survival: Code Run 10 (test)',
  'ちくわ足場・縦壁・下段ギャップのコードラン。スライムありの開発者向けテスト課題です。',
  'Developer test assignment for a CodeRun stage with chikuwa platforms, vertical walls, lower-floor gaps, and slimes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に右上の旗に触れてください。足場を登り迷路を抜けて進みます。',
  'Reach the flag in the upper right before the time limit. Climb platforms and cross the maze.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-10-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-10-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  120,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン10）',
  'Assignment (Code Run 10)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
