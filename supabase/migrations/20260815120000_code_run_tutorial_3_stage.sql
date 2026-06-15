-- Code Run stage 181: tutorial_3 map + developer test course lesson (no dialogue).
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'tutorial_3',
  'Tutorial 3',
  '{"source":"db","variant":"tutorial","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":150,"worldTilesHigh":11,"worldHeight":528,"groundRow":9,"spawn":{"c":2,"r":9},"pits":[],"solids":[{"kind":"ground","row":10,"c0":0,"c1":149},{"kind":"brick","c":143,"r":4},{"kind":"brick","row":5,"c0":142,"c1":143},{"kind":"brick","c":71,"r":6},{"kind":"brick","c":77,"r":6},{"kind":"brick","c":83,"r":6},{"kind":"brick","row":6,"c0":141,"c1":143},{"kind":"brick","c":49,"r":7},{"kind":"brick","row":7,"c0":66,"c1":86},{"kind":"brick","row":7,"c0":140,"c1":143},{"kind":"brick","c":39,"r":8},{"kind":"brick","row":8,"c0":48,"c1":50},{"kind":"brick","c":66,"r":8},{"kind":"brick","c":86,"r":8},{"kind":"brick","row":8,"c0":139,"c1":143},{"kind":"brick","c":11,"r":9},{"kind":"brick","row":9,"c0":20,"c1":21},{"kind":"brick","row":9,"c0":30,"c1":32},{"kind":"brick","row":9,"c0":38,"c1":40},{"kind":"brick","row":9,"c0":47,"c1":51},{"kind":"brick","c":66,"r":9},{"kind":"brick","c":86,"r":9},{"kind":"brick","row":9,"c0":94,"c1":96},{"kind":"brick","row":9,"c0":104,"c1":106},{"kind":"brick","row":9,"c0":116,"c1":118},{"kind":"brick","row":9,"c0":128,"c1":130},{"kind":"brick","row":9,"c0":138,"c1":143},{"kind":"platform","row":8,"c0":63,"c1":65}],"spikes":[],"enemies":[{"c":83,"r":10,"id":"slime-83-10"},{"c":71,"r":10,"id":"slime-71-10"},{"c":77,"r":10,"id":"slime-77-10"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":147,"r":10},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  181,
  'progression',
  'code_run',
  '開発: チュートリアル3',
  'Dev: Tutorial 3',
  'easy',
  '',
  'チュートリアル3',
  'Tutorial 3',
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
  'tutorial_3',
  120,
  NULL,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-tutorial-3-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: チュートリアル3（テスト）',
  'Survival: Tutorial 3 (test)',
  '段差のあるレンガと足場を渡り、スライム3体を避けて右端の旗を目指すコードラン。開発者向けテスト課題です。',
  'Developer test assignment for a horizontal CodeRun tutorial stage with brick steps, a platform, and three slimes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に右端の旗に触れてください。段差を使って進み、スライムを避けてゴールを目指します。',
  'Reach the flag on the right before the time limit. Use the elevated brick route and dodge the slimes.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-tutorial-3-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-tutorial-3-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  181,
  'basic',
  FALSE,
  NULL,
  '課題（チュートリアル3）',
  'Assignment (Tutorial 3)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
