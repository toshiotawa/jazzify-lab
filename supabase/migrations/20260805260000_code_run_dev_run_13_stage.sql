-- Code Run stage 176: dev_run_13 map + developer test course lesson.
-- Note: stage 123 is used by chord-run beginner; dev_run_13 uses the next free basic slot.
BEGIN;

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'dev_run_13',
  'Dev Run 13',
  '{"source":"db","variant":"dev_custom","layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":130,"worldTilesHigh":22,"worldHeight":1056,"groundRow":9,"spawn":{"c":0,"r":19},"pits":[],"solids":[{"kind":"brick","c":34,"r":0},{"kind":"brick","row":0,"c0":63,"c1":64},{"kind":"brick","c":118,"r":0},{"kind":"brick","c":34,"r":1},{"kind":"brick","c":42,"r":1},{"kind":"brick","c":50,"r":1},{"kind":"brick","row":1,"c0":63,"c1":64},{"kind":"brick","c":118,"r":1},{"kind":"brick","c":34,"r":2},{"kind":"brick","row":2,"c0":38,"c1":58},{"kind":"brick","row":2,"c0":63,"c1":64},{"kind":"brick","c":118,"r":2},{"kind":"brick","row":3,"c0":27,"c1":30},{"kind":"brick","c":34,"r":3},{"kind":"brick","c":58,"r":3},{"kind":"brick","row":3,"c0":63,"c1":64},{"kind":"brick","c":118,"r":3},{"kind":"brick","row":3,"c0":126,"c1":129},{"kind":"brick","c":27,"r":4},{"kind":"brick","c":34,"r":4},{"kind":"brick","c":58,"r":4},{"kind":"brick","row":4,"c0":63,"c1":64},{"kind":"brick","row":4,"c0":74,"c1":112},{"kind":"brick","c":118,"r":4},{"kind":"brick","row":4,"c0":126,"c1":129},{"kind":"brick","row":5,"c0":24,"c1":27},{"kind":"brick","c":34,"r":5},{"kind":"brick","c":58,"r":5},{"kind":"brick","row":5,"c0":62,"c1":64},{"kind":"brick","row":5,"c0":91,"c1":94},{"kind":"brick","row":5,"c0":107,"c1":112},{"kind":"brick","c":118,"r":5},{"kind":"brick","row":5,"c0":126,"c1":129},{"kind":"brick","c":24,"r":6},{"kind":"brick","c":34,"r":6},{"kind":"brick","row":6,"c0":39,"c1":40},{"kind":"brick","row":6,"c0":44,"c1":46},{"kind":"brick","c":58,"r":6},{"kind":"brick","row":6,"c0":62,"c1":64},{"kind":"brick","row":6,"c0":91,"c1":94},{"kind":"brick","row":6,"c0":107,"c1":108},{"kind":"brick","c":118,"r":6},{"kind":"brick","row":6,"c0":126,"c1":129},{"kind":"brick","row":7,"c0":21,"c1":24},{"kind":"brick","row":7,"c0":34,"c1":54},{"kind":"brick","c":58,"r":7},{"kind":"brick","row":7,"c0":62,"c1":64},{"kind":"brick","row":7,"c0":91,"c1":94},{"kind":"brick","row":7,"c0":107,"c1":108},{"kind":"brick","c":118,"r":7},{"kind":"brick","row":7,"c0":126,"c1":129},{"kind":"brick","c":21,"r":8},{"kind":"brick","row":8,"c0":29,"c1":30},{"kind":"brick","c":34,"r":8},{"kind":"brick","c":58,"r":8},{"kind":"brick","row":8,"c0":62,"c1":64},{"kind":"brick","row":8,"c0":91,"c1":94},{"kind":"brick","row":8,"c0":98,"c1":100},{"kind":"brick","row":8,"c0":107,"c1":108},{"kind":"brick","c":118,"r":8},{"kind":"brick","row":8,"c0":126,"c1":129},{"kind":"brick","row":9,"c0":18,"c1":21},{"kind":"brick","row":9,"c0":29,"c1":34},{"kind":"brick","c":58,"r":9},{"kind":"brick","row":9,"c0":62,"c1":64},{"kind":"brick","row":9,"c0":91,"c1":94},{"kind":"brick","row":9,"c0":98,"c1":100},{"kind":"brick","row":9,"c0":107,"c1":108},{"kind":"brick","row":9,"c0":113,"c1":118},{"kind":"brick","row":9,"c0":126,"c1":129},{"kind":"brick","c":18,"r":10},{"kind":"brick","row":10,"c0":26,"c1":34},{"kind":"brick","row":10,"c0":57,"c1":58},{"kind":"brick","row":10,"c0":62,"c1":64},{"kind":"brick","row":10,"c0":98,"c1":100},{"kind":"brick","row":10,"c0":107,"c1":108},{"kind":"brick","c":118,"r":10},{"kind":"brick","row":10,"c0":126,"c1":129},{"kind":"brick","row":11,"c0":15,"c1":18},{"kind":"brick","row":11,"c0":26,"c1":34},{"kind":"brick","row":11,"c0":56,"c1":58},{"kind":"brick","row":11,"c0":62,"c1":64},{"kind":"brick","row":11,"c0":98,"c1":100},{"kind":"brick","row":11,"c0":107,"c1":108},{"kind":"brick","c":118,"r":11},{"kind":"brick","row":11,"c0":126,"c1":129},{"kind":"brick","c":15,"r":12},{"kind":"brick","row":12,"c0":24,"c1":26},{"kind":"brick","c":56,"r":12},{"kind":"brick","row":12,"c0":62,"c1":64},{"kind":"brick","row":12,"c0":98,"c1":100},{"kind":"brick","row":12,"c0":107,"c1":108},{"kind":"brick","c":118,"r":12},{"kind":"brick","row":12,"c0":126,"c1":129},{"kind":"brick","row":13,"c0":12,"c1":15},{"kind":"brick","row":13,"c0":24,"c1":26},{"kind":"brick","row":13,"c0":39,"c1":40},{"kind":"brick","row":13,"c0":45,"c1":46},{"kind":"brick","row":13,"c0":50,"c1":51},{"kind":"brick","c":56,"r":13},{"kind":"brick","row":13,"c0":62,"c1":64},{"kind":"brick","row":13,"c0":98,"c1":100},{"kind":"brick","row":13,"c0":107,"c1":108},{"kind":"brick","c":118,"r":13},{"kind":"brick","row":13,"c0":126,"c1":129},{"kind":"brick","c":12,"r":14},{"kind":"brick","row":14,"c0":20,"c1":24},{"kind":"brick","row":14,"c0":39,"c1":40},{"kind":"brick","row":14,"c0":45,"c1":46},{"kind":"brick","row":14,"c0":50,"c1":51},{"kind":"brick","c":56,"r":14},{"kind":"brick","row":14,"c0":62,"c1":64},{"kind":"brick","row":14,"c0":98,"c1":100},{"kind":"brick","row":14,"c0":107,"c1":113},{"kind":"brick","c":118,"r":14},{"kind":"brick","row":14,"c0":126,"c1":129},{"kind":"brick","row":15,"c0":9,"c1":12},{"kind":"brick","row":15,"c0":20,"c1":24},{"kind":"brick","row":15,"c0":32,"c1":56},{"kind":"brick","row":15,"c0":62,"c1":64},{"kind":"brick","row":15,"c0":98,"c1":100},{"kind":"brick","row":15,"c0":107,"c1":108},{"kind":"brick","c":118,"r":15},{"kind":"brick","row":15,"c0":126,"c1":129},{"kind":"brick","row":16,"c0":9,"c1":12},{"kind":"brick","row":16,"c0":18,"c1":20},{"kind":"brick","row":16,"c0":32,"c1":34},{"kind":"brick","row":16,"c0":59,"c1":64},{"kind":"brick","row":16,"c0":107,"c1":108},{"kind":"brick","c":118,"r":16},{"kind":"brick","row":16,"c0":126,"c1":129},{"kind":"brick","row":17,"c0":6,"c1":12},{"kind":"brick","row":17,"c0":17,"c1":18},{"kind":"brick","row":17,"c0":32,"c1":34},{"kind":"brick","c":44,"r":17},{"kind":"brick","c":50,"r":17},{"kind":"brick","c":54,"r":17},{"kind":"brick","c":59,"r":17},{"kind":"brick","row":17,"c0":107,"c1":108},{"kind":"brick","row":17,"c0":115,"c1":118},{"kind":"brick","row":17,"c0":126,"c1":129},{"kind":"brick","row":18,"c0":6,"c1":12},{"kind":"brick","row":18,"c0":16,"c1":17},{"kind":"brick","row":18,"c0":27,"c1":28},{"kind":"brick","row":18,"c0":32,"c1":34},{"kind":"brick","row":18,"c0":40,"c1":59},{"kind":"brick","row":18,"c0":107,"c1":108},{"kind":"brick","row":18,"c0":115,"c1":118},{"kind":"brick","row":18,"c0":126,"c1":129},{"kind":"brick","row":19,"c0":3,"c1":12},{"kind":"brick","row":19,"c0":27,"c1":28},{"kind":"brick","row":19,"c0":32,"c1":34},{"kind":"brick","row":19,"c0":107,"c1":108},{"kind":"brick","row":19,"c0":126,"c1":129},{"kind":"brick","row":20,"c0":3,"c1":12},{"kind":"brick","row":20,"c0":27,"c1":28},{"kind":"brick","row":20,"c0":32,"c1":34},{"kind":"brick","c":44,"r":20},{"kind":"brick","c":50,"r":20},{"kind":"brick","c":54,"r":20},{"kind":"brick","row":20,"c0":107,"c1":108},{"kind":"brick","row":20,"c0":126,"c1":129},{"kind":"brick","row":21,"c0":0,"c1":67},{"kind":"brick","row":21,"c0":107,"c1":129},{"kind":"platform","c":119,"r":2},{"kind":"platform","c":125,"r":5},{"kind":"platform","row":7,"c0":65,"c1":68},{"kind":"platform","c":122,"r":7},{"kind":"platform","c":119,"r":8},{"kind":"platform","row":9,"c0":104,"c1":106},{"kind":"platform","row":10,"c0":70,"c1":72},{"kind":"platform","row":10,"c0":82,"c1":84},{"kind":"platform","c":122,"r":10},{"kind":"platform","c":125,"r":11},{"kind":"platform","row":12,"c0":87,"c1":89},{"kind":"platform","row":12,"c0":101,"c1":103},{"kind":"platform","row":13,"c0":75,"c1":78},{"kind":"platform","c":122,"r":13},{"kind":"platform","c":119,"r":14},{"kind":"platform","row":15,"c0":92,"c1":97},{"kind":"platform","row":16,"c0":104,"c1":106},{"kind":"platform","c":122,"r":16},{"kind":"platform","c":125,"r":17},{"kind":"platform","row":19,"c0":104,"c1":106},{"kind":"platform","row":21,"c0":73,"c1":75},{"kind":"platform","row":21,"c0":81,"c1":83},{"kind":"platform","row":21,"c0":90,"c1":92},{"kind":"platform","row":21,"c0":98,"c1":100},{"kind":"platform","row":21,"c0":104,"c1":106}],"spikes":[{"c":41,"row":15},{"c":42,"row":15},{"c":43,"row":15},{"c":44,"row":15},{"c":47,"row":15},{"c":48,"row":15},{"c":49,"row":15},{"c":29,"row":21},{"c":30,"row":21},{"c":31,"row":21}],"enemies":[{"c":50,"r":7,"id":"slime-50-7"},{"c":78,"r":4,"id":"slime-78-4"},{"c":84,"r":4,"id":"slime-84-4"},{"c":91,"r":4,"id":"slime-91-4"},{"c":97,"r":4,"id":"slime-97-4"},{"c":104,"r":4,"id":"slime-104-4"}],"goalOffsetX":18,"manualGround":true,"goal":{"c":127,"r":3},"assets":{"background":"/RUN/background.png","player":["/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_01.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_02.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_03.png","/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_04.png"],"playerHurt":"/RUN/%E3%83%A1%E3%82%A4%E3%83%B3%E3%82%AD%E3%83%A3%E3%83%A9%E3%82%AF%E3%82%BF%E3%83%BC/sprite_11.png","slime":["/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_a.png","/RUN/kenney_new-platformer-pack-1/Sprites/Enemies/Default/slime_normal_walk_b.png"],"tiles":{"ground":"/RUN/tiles/graveyard/ground_fill.png","groundTop":"/RUN/tiles/graveyard/ground_top.png","groundTopLeft":"/RUN/tiles/graveyard/ground_top_left.png","groundTopRight":"/RUN/tiles/graveyard/ground_top_right.png","brick":"/RUN/tiles/graveyard/brick.png","platform":"/RUN/tiles/graveyard/platform.png","block":"/RUN/graveyardtilesetnew/png/Objects/Crate.png","spike":"/RUN/tiles/graveyard/spike.png","flag":"/RUN/tiles/graveyard/flag.png"}}}'::jsonb
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
  176,
  'progression',
  'code_run',
  '開発: コードラン13',
  'Dev: Code Run 13',
  'easy',
  '',
  'コードラン13',
  'Code Run 13',
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
  'dev_run_13',
  150,
  '{"lines":[{"at_seconds":2,"speaker":"fai","text":"左下から右上へ登るレンガ迷路だよ。右の足場ルートとスパイクに注意！","text_en":"Climb the brick maze from the lower left to the upper right. Watch the right-side platforms and spikes!"},{"at_seconds":12,"speaker":"jajii","text":"迷路を登り、右側の足場を渡って旗へ向かえ。上段のスライムも避けろ。","text_en":"Climb the maze, cross the platforms on the right, and head for the flag. Dodge the slimes on the upper route too."},{"at_seconds":24,"speaker":"fai","text":"右上の旗に触れたらゴール！","text_en":"Touch the flag in the upper right to clear!"}]}'::jsonb,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-13-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'サバイバル: コードラン13（テスト）',
  'Survival: Code Run 13 (test)',
  'レンガ迷路を登り、右側の足場ルートで右上の旗を目指すコードラン。スパイクとスライムありの開発者向けテスト課題です。',
  'Developer test assignment for a CodeRun stage with a climbing brick maze, a right-side platform route, spikes, and slimes.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '制限時間以内に右上の旗に触れてください。左下から迷路を登り、右の足場を渡って進みます。スパイクとスライムに注意してください。',
  'Reach the flag in the upper right before the time limit. Climb the maze from the lower left and cross the platforms on the right. Watch out for spikes and slimes.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-13-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-survival-code-run-13-lesson'),
  NULL,
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  FALSE,
  NULL,
  TRUE,
  176,
  'basic',
  FALSE,
  NULL,
  '課題（コードラン13）',
  'Assignment (Code Run 13)'
)
ON CONFLICT (id) DO UPDATE SET
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  survival_map_category = EXCLUDED.survival_map_category,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
