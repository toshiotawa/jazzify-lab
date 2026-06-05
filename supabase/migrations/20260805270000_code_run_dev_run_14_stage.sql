-- Code Run stage 177: dev_run_14 map + developer test course lesson.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_14',
  'Dev Run 14',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":281,"worldTilesHigh":24,"worldHeight":1152,"groundRow":9,"spawn":{"c":1,"r":21},"pits":[],"solids":[{"kind":"ground","row":9,"c0":30,"c1":33},{"kind":"ground","row":10,"c0":30,"c1":33},{"kind":"ground","row":11,"c0":30,"c1":33},{"kind":"ground","row":12,"c0":23,"c1":26},{"kind":"ground","row":12,"c0":30,"c1":33},{"kind":"ground","row":13,"c0":23,"c1":26},{"kind":"ground","row":13,"c0":30,"c1":33},{"kind":"ground","row":14,"c0":23,"c1":26},{"kind":"ground","row":14,"c0":30,"c1":33},{"kind":"ground","row":15,"c0":23,"c1":26},{"kind":"ground","row":15,"c0":30,"c1":33},{"kind":"ground","row":16,"c0":17,"c1":19},{"kind":"ground","row":16,"c0":23,"c1":26},{"kind":"ground","row":16,"c0":30,"c1":33},{"kind":"ground","row":17,"c0":17,"c1":19},{"kind":"ground","row":17,"c0":23,"c1":26},{"kind":"ground","row":17,"c0":30,"c1":33},{"kind":"ground","row":18,"c0":10,"c1":13},{"kind":"ground","row":18,"c0":17,"c1":19},{"kind":"ground","row":18,"c0":23,"c1":26},{"kind":"ground","row":18,"c0":30,"c1":33},{"kind":"ground","row":19,"c0":10,"c1":13},{"kind":"ground","row":19,"c0":17,"c1":19},{"kind":"ground","row":19,"c0":23,"c1":26},{"kind":"ground","row":19,"c0":30,"c1":33},{"kind":"ground","row":20,"c0":5,"c1":7},{"kind":"ground","row":20,"c0":10,"c1":13},{"kind":"ground","row":20,"c0":17,"c1":19},{"kind":"ground","row":20,"c0":23,"c1":26},{"kind":"ground","row":20,"c0":30,"c1":33},{"kind":"ground","row":21,"c0":5,"c1":7},{"kind":"ground","row":21,"c0":10,"c1":13},{"kind":"ground","row":21,"c0":17,"c1":19},{"kind":"ground","row":21,"c0":23,"c1":26},{"kind":"ground","row":21,"c0":30,"c1":33},{"kind":"ground","row":22,"c0":0,"c1":2},{"kind":"ground","row":22,"c0":5,"c1":7},{"kind":"ground","row":22,"c0":10,"c1":13},{"kind":"ground","row":22,"c0":17,"c1":19},{"kind":"ground","row":22,"c0":23,"c1":26},{"kind":"ground","row":22,"c0":30,"c1":33},{"kind":"ground","row":23,"c0":0,"c1":2},{"kind":"ground","row":23,"c0":5,"c1":7},{"kind":"ground","row":23,"c0":10,"c1":13},{"kind":"ground","row":23,"c0":17,"c1":19},{"kind":"ground","row":23,"c0":23,"c1":26},{"kind":"ground","row":23,"c0":30,"c1":33},{"kind":"platform","row":4,"c0":41,"c1":44},{"kind":"platform","row":4,"c0":49,"c1":52},{"kind":"platform","row":4,"c0":57,"c1":60},{"kind":"platform","row":4,"c0":65,"c1":68},{"kind":"platform","row":4,"c0":73,"c1":76},{"kind":"platform","row":4,"c0":93,"c1":96},{"kind":"platform","row":4,"c0":101,"c1":104},{"kind":"platform","row":4,"c0":109,"c1":112},{"kind":"platform","row":4,"c0":117,"c1":120},{"kind":"platform","row":4,"c0":125,"c1":128},{"kind":"platform","row":4,"c0":133,"c1":136},{"kind":"platform","row":4,"c0":141,"c1":144},{"kind":"platform","row":4,"c0":148,"c1":151},{"kind":"platform","row":4,"c0":155,"c1":158},{"kind":"platform","row":4,"c0":162,"c1":165},{"kind":"platform","row":4,"c0":170,"c1":173},{"kind":"platform","row":4,"c0":178,"c1":181},{"kind":"platform","row":4,"c0":214,"c1":216},{"kind":"platform","row":4,"c0":220,"c1":255},{"kind":"platform","row":5,"c0":90,"c1":91},{"kind":"platform","row":7,"c0":36,"c1":38},{"kind":"platform","row":7,"c0":45,"c1":48},{"kind":"platform","row":7,"c0":53,"c1":56},{"kind":"platform","row":7,"c0":61,"c1":64},{"kind":"platform","row":7,"c0":69,"c1":72},{"kind":"platform","row":7,"c0":77,"c1":80},{"kind":"platform","row":7,"c0":185,"c1":188},{"kind":"platform","row":7,"c0":214,"c1":216},{"kind":"platform","row":8,"c0":86,"c1":87},{"kind":"platform","row":8,"c0":226,"c1":228},{"kind":"platform","row":8,"c0":232,"c1":234},{"kind":"platform","row":8,"c0":238,"c1":240},{"kind":"platform","row":8,"c0":244,"c1":246},{"kind":"platform","row":8,"c0":250,"c1":252},{"kind":"platform","row":8,"c0":256,"c1":258},{"kind":"platform","row":10,"c0":190,"c1":193},{"kind":"platform","row":10,"c0":214,"c1":216},{"kind":"platform","row":10,"c0":229,"c1":231},{"kind":"platform","row":10,"c0":235,"c1":237},{"kind":"platform","row":10,"c0":241,"c1":243},{"kind":"platform","row":10,"c0":247,"c1":249},{"kind":"platform","row":10,"c0":253,"c1":255},{"kind":"platform","row":12,"c0":90,"c1":91},{"kind":"platform","row":13,"c0":195,"c1":198},{"kind":"platform","row":13,"c0":214,"c1":216},{"kind":"platform","row":13,"c0":258,"c1":261},{"kind":"platform","c":258,"r":14},{"kind":"platform","row":15,"c0":86,"c1":87},{"kind":"platform","c":258,"r":15},{"kind":"platform","row":16,"c0":201,"c1":204},{"kind":"platform","row":16,"c0":214,"c1":216},{"kind":"platform","row":16,"c0":226,"c1":258},{"kind":"platform","row":19,"c0":90,"c1":91},{"kind":"platform","row":19,"c0":207,"c1":216},{"kind":"platform","row":23,"c0":220,"c1":269},{"kind":"block","row":0,"c0":84,"c1":87},{"kind":"block","row":0,"c0":262,"c1":264},{"kind":"block","row":1,"c0":84,"c1":87},{"kind":"block","row":1,"c0":262,"c1":264},{"kind":"block","row":2,"c0":84,"c1":87},{"kind":"block","row":2,"c0":262,"c1":264},{"kind":"block","row":3,"c0":84,"c1":85},{"kind":"block","row":3,"c0":262,"c1":264},{"kind":"block","row":4,"c0":84,"c1":85},{"kind":"block","c":92,"r":4},{"kind":"block","row":4,"c0":217,"c1":219},{"kind":"block","row":4,"c0":262,"c1":264},{"kind":"block","row":5,"c0":84,"c1":85},{"kind":"block","c":92,"r":5},{"kind":"block","row":5,"c0":217,"c1":219},{"kind":"block","row":5,"c0":262,"c1":264},{"kind":"block","row":6,"c0":84,"c1":85},{"kind":"block","c":92,"r":6},{"kind":"block","row":6,"c0":217,"c1":219},{"kind":"block","row":6,"c0":262,"c1":264},{"kind":"block","row":7,"c0":42,"c1":44},{"kind":"block","row":7,"c0":49,"c1":52},{"kind":"block","row":7,"c0":57,"c1":60},{"kind":"block","row":7,"c0":65,"c1":68},{"kind":"block","row":7,"c0":73,"c1":76},{"kind":"block","row":7,"c0":84,"c1":85},{"kind":"block","c":92,"r":7},{"kind":"block","row":7,"c0":217,"c1":219},{"kind":"block","row":7,"c0":262,"c1":264},{"kind":"block","row":8,"c0":42,"c1":44},{"kind":"block","row":8,"c0":78,"c1":80},{"kind":"block","row":8,"c0":84,"c1":85},{"kind":"block","c":92,"r":8},{"kind":"block","row":8,"c0":217,"c1":219},{"kind":"block","row":8,"c0":262,"c1":264},{"kind":"block","row":9,"c0":42,"c1":44},{"kind":"block","row":9,"c0":78,"c1":80},{"kind":"block","row":9,"c0":84,"c1":85},{"kind":"block","c":92,"r":9},{"kind":"block","row":9,"c0":217,"c1":219},{"kind":"block","row":9,"c0":262,"c1":264},{"kind":"block","row":10,"c0":42,"c1":44},{"kind":"block","row":10,"c0":78,"c1":80},{"kind":"block","row":10,"c0":84,"c1":85},{"kind":"block","c":92,"r":10},{"kind":"block","row":10,"c0":217,"c1":219},{"kind":"block","row":10,"c0":262,"c1":264},{"kind":"block","row":11,"c0":42,"c1":44},{"kind":"block","row":11,"c0":78,"c1":80},{"kind":"block","row":11,"c0":84,"c1":85},{"kind":"block","c":92,"r":11},{"kind":"block","row":11,"c0":217,"c1":219},{"kind":"block","row":11,"c0":226,"c1":231},{"kind":"block","row":11,"c0":262,"c1":264},{"kind":"block","row":12,"c0":34,"c1":44},{"kind":"block","row":12,"c0":78,"c1":80},{"kind":"block","row":12,"c0":84,"c1":85},{"kind":"block","c":92,"r":12},{"kind":"block","row":12,"c0":217,"c1":219},{"kind":"block","row":12,"c0":226,"c1":228},{"kind":"block","row":12,"c0":262,"c1":264},{"kind":"block","row":13,"c0":78,"c1":80},{"kind":"block","row":13,"c0":84,"c1":85},{"kind":"block","c":92,"r":13},{"kind":"block","row":13,"c0":217,"c1":219},{"kind":"block","row":13,"c0":226,"c1":228},{"kind":"block","row":13,"c0":262,"c1":264},{"kind":"block","row":14,"c0":78,"c1":80},{"kind":"block","row":14,"c0":84,"c1":85},{"kind":"block","c":92,"r":14},{"kind":"block","row":14,"c0":217,"c1":219},{"kind":"block","row":14,"c0":226,"c1":228},{"kind":"block","row":14,"c0":259,"c1":264},{"kind":"block","row":15,"c0":48,"c1":52},{"kind":"block","row":15,"c0":56,"c1":58},{"kind":"block","row":15,"c0":61,"c1":63},{"kind":"block","row":15,"c0":66,"c1":68},{"kind":"block","row":15,"c0":71,"c1":73},{"kind":"block","row":15,"c0":78,"c1":80},{"kind":"block","row":15,"c0":84,"c1":85},{"kind":"block","c":92,"r":15},{"kind":"block","row":15,"c0":217,"c1":219},{"kind":"block","row":15,"c0":226,"c1":228},{"kind":"block","row":15,"c0":259,"c1":264},{"kind":"block","row":16,"c0":48,"c1":49},{"kind":"block","row":16,"c0":71,"c1":73},{"kind":"block","row":16,"c0":84,"c1":85},{"kind":"block","c":92,"r":16},{"kind":"block","row":16,"c0":217,"c1":219},{"kind":"block","row":16,"c0":259,"c1":264},{"kind":"block","row":17,"c0":48,"c1":49},{"kind":"block","row":17,"c0":71,"c1":73},{"kind":"block","row":17,"c0":84,"c1":85},{"kind":"block","c":92,"r":17},{"kind":"block","row":17,"c0":217,"c1":219},{"kind":"block","row":18,"c0":45,"c1":85},{"kind":"block","c":92,"r":18},{"kind":"block","row":18,"c0":217,"c1":219},{"kind":"block","c":92,"r":19},{"kind":"block","row":19,"c0":217,"c1":219},{"kind":"block","c":92,"r":20},{"kind":"block","row":20,"c0":217,"c1":219},{"kind":"block","c":92,"r":21},{"kind":"block","row":21,"c0":217,"c1":219},{"kind":"block","c":92,"r":22},{"kind":"block","row":22,"c0":217,"c1":219},{"kind":"block","row":23,"c0":37,"c1":92},{"kind":"block","row":23,"c0":217,"c1":219}],"spikes":[{"c":45,"row":7},{"c":46,"row":7},{"c":47,"row":7},{"c":48,"row":7},{"c":53,"row":7},{"c":54,"row":7},{"c":55,"row":7},{"c":56,"row":7},{"c":61,"row":7},{"c":62,"row":7},{"c":63,"row":7},{"c":64,"row":7},{"c":69,"row":7},{"c":70,"row":7},{"c":71,"row":7},{"c":72,"row":7},{"c":77,"row":7},{"c":78,"row":7},{"c":79,"row":7},{"c":80,"row":7},{"c":34,"row":12},{"c":35,"row":12},{"c":36,"row":12},{"c":37,"row":12},{"c":38,"row":12},{"c":39,"row":12},{"c":40,"row":12},{"c":41,"row":12},{"c":229,"row":16},{"c":230,"row":16},{"c":231,"row":16},{"c":232,"row":16},{"c":233,"row":16},{"c":234,"row":16},{"c":235,"row":16},{"c":236,"row":16},{"c":237,"row":16},{"c":238,"row":16},{"c":239,"row":16},{"c":240,"row":16},{"c":241,"row":16},{"c":242,"row":16},{"c":243,"row":16},{"c":244,"row":16},{"c":245,"row":16},{"c":246,"row":16},{"c":247,"row":16},{"c":248,"row":16},{"c":249,"row":16},{"c":250,"row":16},{"c":251,"row":16},{"c":252,"row":16},{"c":253,"row":16},{"c":254,"row":16},{"c":255,"row":16},{"c":256,"row":16},{"c":257,"row":16},{"c":258,"row":16},{"c":50,"row":18},{"c":51,"row":18},{"c":52,"row":18},{"c":53,"row":18},{"c":54,"row":18},{"c":55,"row":18},{"c":56,"row":18},{"c":57,"row":18},{"c":58,"row":18},{"c":59,"row":18},{"c":60,"row":18},{"c":61,"row":18},{"c":62,"row":18},{"c":63,"row":18},{"c":64,"row":18},{"c":65,"row":18},{"c":66,"row":18},{"c":67,"row":18},{"c":68,"row":18},{"c":69,"row":18},{"c":70,"row":18}],"enemies":[{"c":232,"r":23,"id":"slime-232-23"},{"c":238,"r":23,"id":"slime-238-23"},{"c":246,"r":23,"id":"slime-246-23"},{"c":256,"r":23,"id":"slime-256-23"},{"c":265,"r":23,"id":"slime-265-23"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":269,"r":23},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/graveyardtilesetnew/png/Tiles/chikuwa_ashiba.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  177,
  'progression',
  'code_run',
  '開発: コードラン14',
  'Dev: Code Run 14',
  'easy',
  '',
  'コードラン14',
  'Code Run 14',
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
  'dev_run_14',
  150,
  '{"lines":[{"at_seconds":2,"speaker":"fai","text":"超横長ステージだよ！上段の足場を渡りながら右の旗を目指して。","text_en":"It is a super-wide stage! Cross the upper platforms and head for the flag on the right."},{"at_seconds":12,"speaker":"jajii","text":"スパイク付き足場とブロック迷路を抜け、下段のスライムを避けて右端へ進め。","text_en":"Get through the spiked platforms and block maze, dodge the lower slimes, and push to the far right."},{"at_seconds":24,"speaker":"fai","text":"右端の旗に触れたらゴール！","text_en":"Touch the flag on the far right to clear!"}]}'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-14-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン14（テスト）',
  'Survival: Code Run 14 (test)',
  '超横長の足場とブロック迷路を渡り、右端の旗を目指すコードラン。スパイクとスライムありの開発者向けテスト課題です。',
  'Developer test assignment for a super-wide CodeRun stage with platforms, a block maze, spikes, and slimes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に右端の旗に触れてください。上段の足場とブロック迷路を進み、下段のスライムに注意してください。',
  'Reach the flag on the far right before the time limit. Cross the upper platforms and block maze. Watch out for slimes on the lower route.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-14-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-14-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  177,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン14）',
  'Assignment (Code Run 14)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
