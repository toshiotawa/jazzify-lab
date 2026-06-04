-- Code Run stage 121: dev_run_11 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_11',
  'Dev Run 11',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":64,"worldTilesHigh":20,"worldHeight":960,"groundRow":9,"spawn":{"c":18,"r":0},"pits":[],"solids":[{"kind":"platform","c":8,"r":2},{"kind":"platform","row":2,"c0":16,"c1":25},{"kind":"platform","c":8,"r":3},{"kind":"platform","c":25,"r":3},{"kind":"platform","c":8,"r":4},{"kind":"platform","row":4,"c0":25,"c1":27},{"kind":"platform","c":8,"r":5},{"kind":"platform","row":5,"c0":27,"c1":28},{"kind":"platform","c":8,"r":6},{"kind":"platform","row":6,"c0":28,"c1":29},{"kind":"platform","c":9,"r":7},{"kind":"platform","row":7,"c0":29,"c1":30},{"kind":"platform","row":8,"c0":9,"c1":10},{"kind":"platform","row":8,"c0":30,"c1":31},{"kind":"platform","c":10,"r":9},{"kind":"platform","row":9,"c0":30,"c1":31},{"kind":"platform","c":10,"r":10},{"kind":"platform","row":10,"c0":29,"c1":30},{"kind":"platform","c":10,"r":11},{"kind":"platform","row":11,"c0":27,"c1":29},{"kind":"platform","c":10,"r":12},{"kind":"platform","c":27,"r":12},{"kind":"platform","c":10,"r":13},{"kind":"platform","c":27,"r":13},{"kind":"platform","c":10,"r":14},{"kind":"platform","c":26,"r":14},{"kind":"platform","row":15,"c0":10,"c1":11},{"kind":"platform","row":15,"c0":14,"c1":17},{"kind":"platform","row":15,"c0":22,"c1":26},{"kind":"platform","row":16,"c0":11,"c1":14},{"kind":"platform","row":16,"c0":17,"c1":22}],"spikes":[],"enemies":[{"c":23,"r":6,"id":"slime-23-6"},{"c":24,"id":"slime-24-9"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":8,"r":1},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  121,
  'progression',
  'code_run',
  '開発: コードラン11',
  'Dev: Code Run 11',
  'easy',
  '',
  'コードラン11',
  'Code Run 11',
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
  'dev_run_11',
  150,
  '{"lines":[{"at_seconds":2,"speaker":"fai","text":"左右のちくわ足場をジグザグに渡るステージだよ。スライムに注意！","text_en":"Cross the chikuwa platforms in a zigzag. Watch the slimes!"},{"at_seconds":12,"speaker":"jajii","text":"右の足場を降りて下段を渡り、左の旗を目指せ。","text_en":"Descend the right-side platforms, cross the lower route, and head for the flag on the left."},{"at_seconds":24,"speaker":"fai","text":"左上の旗に触れたらゴール！","text_en":"Touch the flag in the upper left to clear!"}]}'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-11-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン11（テスト）',
  'Survival: Code Run 11 (test)',
  'ジグザグのちくわ足場を渡るコードラン。スライムありの開発者向けテスト課題です。',
  'Developer test assignment for a CodeRun stage with zigzag chikuwa platforms and slimes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に左上の旗に触れてください。右の足場を降りて下段を渡り、左へ戻ります。',
  'Reach the flag in the upper left before the time limit. Descend the right platforms, cross the lower route, and return left.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-11-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-11-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  121,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン11）',
  'Assignment (Code Run 11)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
