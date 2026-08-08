-- 開発者テストコース: アドリブコール&レスポンス（ドミファ）動作テスト課題
-- 元ネタ: MQ B2「ド・ミ♭・ファでアドリブ」+ OSMD mq-b2-domifa-guide-voice4-cue
-- 生成: node scripts/build-dev-adlib-call-response-domifa-musicxml.mjs
-- R2: node scripts/upload-sozai-main-quest-block2-r2.mjs --s3 --no-retry

BEGIN;

INSERT INTO public.ear_training_stages (
  id,
  slug,
  title,
  title_en,
  description,
  description_en,
  bpm,
  key_fifths,
  beats_per_measure,
  beat_type,
  loop_measures,
  max_loops_per_phrase,
  count_in_beats,
  time_limit_sec,
  player_hp,
  enemy_hp,
  per_correct_note_damage,
  good_completion_damage,
  great_completion_damage,
  perfect_completion_damage,
  miss_damage,
  fail_damage,
  perfect_max_misses,
  great_max_misses,
  background_theme,
  is_active,
  is_demo,
  mode,
  is_swing,
  show_keyboard_hints_in_battle
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-adlib-call-response-domifa-stage'),
  'dev-adlib-call-response-domifa',
  'アドリブコール&レスポンス（ドミファ）',
  'Ad lib call & response (C Eb F)',
  'MQ B2 ドミファ OSMD 譜面を流用。voice1 ターゲットはすべて C/Eb/F 和音塊。譜面非表示・オクターブ等価・1音正解。',
  'Dev test using MQ B2 domifa OSMD sheet. All voice1 targets are C/Eb/F clusters. Hidden score, octave-equivalent single-note hits.',
  120,
  0,
  4,
  4,
  24,
  2,
  0,
  600,
  100,
  10000,
  10,
  30,
  30,
  30,
  0,
  0,
  0,
  0,
  'blue_club',
  true,
  true,
  'adlib_call_response',
  true,
  true
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  time_limit_sec = EXCLUDED.time_limit_sec,
  player_hp = EXCLUDED.player_hp,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  mode = EXCLUDED.mode,
  is_swing = EXCLUDED.is_swing,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  updated_at = now();

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-adlib-call-response-domifa-stage');

INSERT INTO public.ear_training_phrases (
  id,
  stage_id,
  order_index,
  title,
  title_en,
  music_xml_url,
  audio_url,
  loop_duration_sec,
  audio_duration_sec,
  note_count,
  key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-adlib-call-response-domifa-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-adlib-call-response-domifa-stage'),
  0,
  'Cブルース・ドミファ（C&R）',
  'C blues C Eb F (call & response)',
  'https://jazzify-cdn.com/sozai/dev-adlib-call-response-domifa.musicxml?v=202607301445',
  'https://jazzify-cdn.com/sozai/mq-b2-domifa_count-in.mp3',
  50,
  50,
  0,
  0
);

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
VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-adlib-call-response-domifa-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'アドリブコール&レスポンス（ドミファ）',
  'Ad lib call & response (C Eb F)',
  'MQ B2 ドミファ OSMD を流用した adlib_call_response 動作テスト。コール小節は聴くだけ、レスポンスは C/Eb/F のいずれか1音で正解。',
  'Dev test for adlib_call_response using MQ B2 domifa OSMD. Call measures are listen-only; answer with any one of C, Eb, or F.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  '正解率40%以上（ランクC以上）で敵HPを0にしてクリアしてください。',
  'Clear by reducing enemy HP to 0 with 40% or higher accuracy (rank C or better).'
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  assignment_description = EXCLUDED.assignment_description,
  assignment_description_en = EXCLUDED.assignment_description_en,
  premium_only = EXCLUDED.premium_only,
  updated_at = now();

INSERT INTO public.lesson_songs (
  id,
  lesson_id,
  order_index,
  clear_conditions,
  is_fantasy,
  fantasy_stage_id,
  is_survival,
  survival_stage_number,
  is_balloon_rush,
  balloon_rush_stage_id,
  is_ear_training,
  ear_training_stage_id,
  is_survival_tutorial,
  is_ear_training_tutorial,
  title,
  title_en,
  is_clear_required
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-adlib-call-response-domifa-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-adlib-call-response-domifa-lesson'),
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  false,
  NULL,
  false,
  NULL,
  false,
  NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-adlib-call-response-domifa-stage'),
  false,
  false,
  'アドリブコール&レスポンス（ドミファ）',
  'Ad lib call & response (C Eb F)',
  true
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_clear_required = EXCLUDED.is_clear_required,
  order_index = EXCLUDED.order_index;

COMMIT;
