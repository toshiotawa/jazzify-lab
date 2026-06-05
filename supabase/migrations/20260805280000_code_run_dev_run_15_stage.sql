-- Code Run stage 178: dev_run_15 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_15',
  'Dev Run 15',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":270,"worldTilesHigh":24,"worldHeight":1152,"groundRow":3,"spawn":{"c":1,"r":22},"pits":[],"solids":[{"kind":"ground","row":22,"c0":0,"c1":269},{"kind":"ground","row":23,"c0":0,"c1":269},{"kind":"brick","c":97,"r":4},{"kind":"brick","row":5,"c0":97,"c1":99},{"kind":"brick","c":97,"r":6},{"kind":"brick","c":99,"r":6},{"kind":"brick","row":6,"c0":105,"c1":112},{"kind":"brick","c":119,"r":6},{"kind":"brick","row":6,"c0":126,"c1":132},{"kind":"brick","row":6,"c0":136,"c1":142},{"kind":"brick","row":6,"c0":147,"c1":150},{"kind":"brick","row":6,"c0":155,"c1":158},{"kind":"brick","row":6,"c0":163,"c1":166},{"kind":"brick","row":6,"c0":250,"c1":267},{"kind":"brick","c":50,"r":7},{"kind":"brick","row":7,"c0":96,"c1":97},{"kind":"brick","c":110,"r":7},{"kind":"brick","c":119,"r":7},{"kind":"brick","c":131,"r":7},{"kind":"brick","c":141,"r":7},{"kind":"brick","c":167,"r":7},{"kind":"brick","c":193,"r":7},{"kind":"brick","row":7,"c0":250,"c1":267},{"kind":"brick","c":50,"r":8},{"kind":"brick","row":8,"c0":96,"c1":97},{"kind":"brick","c":110,"r":8},{"kind":"brick","c":118,"r":8},{"kind":"brick","c":120,"r":8},{"kind":"brick","c":130,"r":8},{"kind":"brick","c":140,"r":8},{"kind":"brick","c":167,"r":8},{"kind":"brick","c":194,"r":8},{"kind":"brick","c":207,"r":8},{"kind":"brick","c":219,"r":8},{"kind":"brick","row":8,"c0":237,"c1":238},{"kind":"brick","row":8,"c0":243,"c1":244},{"kind":"brick","row":8,"c0":250,"c1":252},{"kind":"brick","row":8,"c0":254,"c1":255},{"kind":"brick","row":8,"c0":257,"c1":258},{"kind":"brick","c":263,"r":8},{"kind":"brick","c":50,"r":9},{"kind":"brick","c":55,"r":9},{"kind":"brick","row":9,"c0":59,"c1":62},{"kind":"brick","row":9,"c0":64,"c1":67},{"kind":"brick","c":70,"r":9},{"kind":"brick","row":9,"c0":73,"c1":76},{"kind":"brick","c":78,"r":9},{"kind":"brick","c":82,"r":9},{"kind":"brick","row":9,"c0":87,"c1":91},{"kind":"brick","c":110,"r":9},{"kind":"brick","c":118,"r":9},{"kind":"brick","c":120,"r":9},{"kind":"brick","c":129,"r":9},{"kind":"brick","c":139,"r":9},{"kind":"brick","c":167,"r":9},{"kind":"brick","c":195,"r":9},{"kind":"brick","row":9,"c0":207,"c1":208},{"kind":"brick","row":9,"c0":219,"c1":220},{"kind":"brick","row":9,"c0":232,"c1":233},{"kind":"brick","row":9,"c0":237,"c1":238},{"kind":"brick","row":9,"c0":243,"c1":244},{"kind":"brick","row":9,"c0":250,"c1":252},{"kind":"brick","row":9,"c0":254,"c1":255},{"kind":"brick","row":9,"c0":257,"c1":260},{"kind":"brick","row":9,"c0":262,"c1":265},{"kind":"brick","c":267,"r":9},{"kind":"brick","c":50,"r":10},{"kind":"brick","c":55,"r":10},{"kind":"brick","c":61,"r":10},{"kind":"brick","c":66,"r":10},{"kind":"brick","c":70,"r":10},{"kind":"brick","c":73,"r":10},{"kind":"brick","c":79,"r":10},{"kind":"brick","c":81,"r":10},{"kind":"brick","c":87,"r":10},{"kind":"brick","c":91,"r":10},{"kind":"brick","c":106,"r":10},{"kind":"brick","c":110,"r":10},{"kind":"brick","c":118,"r":10},{"kind":"brick","c":120,"r":10},{"kind":"brick","c":128,"r":10},{"kind":"brick","c":138,"r":10},{"kind":"brick","c":167,"r":10},{"kind":"brick","row":10,"c0":187,"c1":196},{"kind":"brick","row":10,"c0":201,"c1":209},{"kind":"brick","row":10,"c0":214,"c1":221},{"kind":"brick","row":10,"c0":232,"c1":233},{"kind":"brick","row":10,"c0":237,"c1":238},{"kind":"brick","row":10,"c0":243,"c1":244},{"kind":"brick","c":250,"r":10},{"kind":"brick","c":252,"r":10},{"kind":"brick","row":10,"c0":254,"c1":255},{"kind":"brick","row":10,"c0":257,"c1":259},{"kind":"brick","row":10,"c0":261,"c1":264},{"kind":"brick","row":10,"c0":266,"c1":267},{"kind":"brick","c":46,"r":11},{"kind":"brick","c":50,"r":11},{"kind":"brick","c":54,"r":11},{"kind":"brick","c":56,"r":11},{"kind":"brick","c":60,"r":11},{"kind":"brick","c":65,"r":11},{"kind":"brick","c":70,"r":11},{"kind":"brick","row":11,"c0":73,"c1":75},{"kind":"brick","c":80,"r":11},{"kind":"brick","c":87,"r":11},{"kind":"brick","c":91,"r":11},{"kind":"brick","row":11,"c0":106,"c1":107},{"kind":"brick","row":11,"c0":109,"c1":110},{"kind":"brick","row":11,"c0":117,"c1":121},{"kind":"brick","c":127,"r":11},{"kind":"brick","c":137,"r":11},{"kind":"brick","row":11,"c0":167,"c1":178},{"kind":"brick","c":195,"r":11},{"kind":"brick","row":11,"c0":207,"c1":208},{"kind":"brick","row":11,"c0":219,"c1":220},{"kind":"brick","row":11,"c0":232,"c1":233},{"kind":"brick","row":11,"c0":237,"c1":238},{"kind":"brick","row":11,"c0":243,"c1":244},{"kind":"brick","c":250,"r":11},{"kind":"brick","c":254,"r":11},{"kind":"brick","c":256,"r":11},{"kind":"brick","c":258,"r":11},{"kind":"brick","c":263,"r":11},{"kind":"brick","row":12,"c0":46,"c1":47},{"kind":"brick","row":12,"c0":49,"c1":50},{"kind":"brick","row":12,"c0":54,"c1":56},{"kind":"brick","c":59,"r":12},{"kind":"brick","c":64,"r":12},{"kind":"brick","c":70,"r":12},{"kind":"brick","c":73,"r":12},{"kind":"brick","c":80,"r":12},{"kind":"brick","row":12,"c0":86,"c1":87},{"kind":"brick","row":12,"c0":90,"c1":91},{"kind":"brick","row":12,"c0":107,"c1":109},{"kind":"brick","c":116,"r":12},{"kind":"brick","c":122,"r":12},{"kind":"brick","row":12,"c0":126,"c1":132},{"kind":"brick","row":12,"c0":136,"c1":142},{"kind":"brick","c":178,"r":12},{"kind":"brick","c":194,"r":12},{"kind":"brick","c":207,"r":12},{"kind":"brick","c":219,"r":12},{"kind":"brick","row":12,"c0":225,"c1":267},{"kind":"brick","row":13,"c0":37,"c1":39},{"kind":"brick","row":13,"c0":47,"c1":49},{"kind":"brick","c":53,"r":13},{"kind":"brick","c":57,"r":13},{"kind":"brick","row":13,"c0":59,"c1":62},{"kind":"brick","row":13,"c0":64,"c1":67},{"kind":"brick","c":70,"r":13},{"kind":"brick","c":73,"r":13},{"kind":"brick","c":80,"r":13},{"kind":"brick","row":13,"c0":86,"c1":87},{"kind":"brick","row":13,"c0":90,"c1":91},{"kind":"brick","row":13,"c0":178,"c1":180},{"kind":"brick","c":193,"r":13},{"kind":"brick","c":181,"r":14},{"kind":"brick","c":182,"r":15},{"kind":"brick","c":183,"r":16},{"kind":"brick","row":17,"c0":10,"c1":12},{"kind":"brick","c":184,"r":17},{"kind":"platform","row":13,"c0":25,"c1":27},{"kind":"platform","row":13,"c0":31,"c1":33},{"kind":"platform","row":17,"c0":25,"c1":27}],"spikes":[{"c":234,"row":12},{"c":235,"row":12},{"c":236,"row":12},{"c":239,"row":12},{"c":240,"row":12},{"c":241,"row":12},{"c":242,"row":12},{"c":245,"row":12},{"c":246,"row":12},{"c":247,"row":12},{"c":248,"row":12},{"c":249,"row":12}],"enemies":[{"c":8,"r":22,"id":"slime-8-22"},{"c":14,"r":22,"id":"slime-14-22"},{"c":20,"r":22,"id":"slime-20-22"},{"c":26,"r":22,"id":"slime-26-22"},{"c":34,"r":22,"id":"slime-34-22"},{"c":41,"r":22,"id":"slime-41-22"},{"c":47,"r":22,"id":"slime-47-22"},{"c":53,"r":22,"id":"slime-53-22"},{"c":59,"r":22,"id":"slime-59-22"},{"c":63,"r":22,"id":"slime-63-22"},{"c":66,"r":22,"id":"slime-66-22"},{"c":71,"r":22,"id":"slime-71-22"},{"c":77,"r":22,"id":"slime-77-22"},{"c":82,"r":22,"id":"slime-82-22"},{"c":88,"r":22,"id":"slime-88-22"},{"c":94,"r":22,"id":"slime-94-22"},{"c":100,"r":22,"id":"slime-100-22"},{"c":106,"r":22,"id":"slime-106-22"},{"c":111,"r":22,"id":"slime-111-22"},{"c":115,"r":22,"id":"slime-115-22"},{"c":117,"r":22,"id":"slime-117-22"},{"c":122,"r":22,"id":"slime-122-22"},{"c":129,"r":22,"id":"slime-129-22"},{"c":135,"r":22,"id":"slime-135-22"},{"c":140,"r":22,"id":"slime-140-22"},{"c":144,"r":22,"id":"slime-144-22"},{"c":149,"r":22,"id":"slime-149-22"},{"c":153,"r":22,"id":"slime-153-22"},{"c":157,"r":22,"id":"slime-157-22"},{"c":162,"r":22,"id":"slime-162-22"},{"c":168,"r":22,"id":"slime-168-22"},{"c":173,"r":22,"id":"slime-173-22"},{"c":179,"r":22,"id":"slime-179-22"},{"c":191,"r":22,"id":"slime-191-22"},{"c":196,"r":22,"id":"slime-196-22"},{"c":203,"r":22,"id":"slime-203-22"},{"c":211,"r":22,"id":"slime-211-22"},{"c":217,"r":22,"id":"slime-217-22"},{"c":222,"r":22,"id":"slime-222-22"},{"c":225,"r":22,"id":"slime-225-22"},{"c":230,"r":22,"id":"slime-230-22"},{"c":236,"r":22,"id":"slime-236-22"},{"c":242,"r":22,"id":"slime-242-22"},{"c":248,"r":22,"id":"slime-248-22"},{"c":253,"r":22,"id":"slime-253-22"},{"c":256,"r":22,"id":"slime-256-22"},{"c":258,"r":22,"id":"slime-258-22"},{"c":263,"r":22,"id":"slime-263-22"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":269,"r":22},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  178,
  'progression',
  'code_run',
  '開発: コードラン15',
  'Dev: Code Run 15',
  'easy',
  '',
  'コードラン15',
  'Code Run 15',
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
  'dev_run_15',
  150,
  '{"lines":[{"at_seconds":2,"speaker":"fai","text":"超横長ステージだよ！上段のブロック迷路を抜けて右の旗を目指して。","text_en":"It is a super-wide stage! Get through the upper block maze and head for the flag on the right."},{"at_seconds":12,"speaker":"jajii","text":"足場とスパイクに注意。下段にはスライムがたくさんいるから、地面を進むなら慎重に。","text_en":"Watch the platforms and spikes. Many slimes patrol the lower route, so stay careful on the ground."},{"at_seconds":24,"speaker":"fai","text":"右端の旗に触れたらゴール！","text_en":"Touch the flag on the far right to clear!"}]}'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-15-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン15（テスト）',
  'Survival: Code Run 15 (test)',
  '超横長のブロック迷路と足場を渡り、右端の旗を目指すコードラン。スパイクと大量スライムありの開発者向けテスト課題です。',
  'Developer test assignment for a super-wide CodeRun stage with a block maze, platforms, spikes, and many slimes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に右端の旗に触れてください。上段のブロック迷路と足場を進み、下段のスライムに注意してください。',
  'Reach the flag on the far right before the time limit. Cross the upper block maze and platforms. Watch out for slimes on the lower route.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-15-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-15-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  178,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン15）',
  'Assignment (Code Run 15)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
