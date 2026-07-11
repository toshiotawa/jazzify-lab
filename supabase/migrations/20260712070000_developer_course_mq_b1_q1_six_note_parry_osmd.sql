-- 開発者テストコース: MQ 1-1 OSMD を 6 音同時押し化し、パリィ円内の音名表示を確認する
-- 資産:
--   MusicXML: public/sozai/dev-mq-b1-q1-osmd-six-note-parry.musicxml
--     （1-1_count-in.musicxml の各 pitch を C4–A4 の 6 音コードへ展開）
--   生成: node scripts/build-mq-b1-q1-six-note-parry-musicxml.mjs
--   R2: node scripts/upload-sozai-main-quest-block1-r2.mjs --s3

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
  mode,
  show_keyboard_hints_in_battle,
  osmd_targets_from_score,
  is_swing
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-stage'),
  'dev-mq-b1-q1-six-note-parry-osmd',
  'MQ 1-1 6音同時押し（パリィ音名）',
  'MQ 1-1 six-note parry labels',
  'メインクエスト 1-1 譜面の各発音を C–A の 6 音同時押しに変更。パリィ円内の音名ラベル（横並び）表示確認用の通常バトル。',
  'MQ 1-1 sheet with each attack turned into a six-note C–A chord. Normal battle stage to verify horizontal note-name labels inside parry circles.',
  100,
  0,
  4,
  4,
  25,
  2,
  0,
  600,
  100,
  80,
  2,
  12,
  18,
  24,
  3,
  10,
  0,
  2,
  'blue_club',
  true,
  'chord_osmd',
  true,
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
  time_limit_sec = EXCLUDED.time_limit_sec,
  player_hp = EXCLUDED.player_hp,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  perfect_max_misses = EXCLUDED.perfect_max_misses,
  great_max_misses = EXCLUDED.great_max_misses,
  mode = EXCLUDED.mode,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  is_swing = EXCLUDED.is_swing,
  updated_at = now();

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-stage'),
  0,
  'Cブルース・6音同時押し',
  'C Blues six-note chords',
  'https://jazzify-cdn.com/sozai/dev-mq-b1-q1-osmd-six-note-parry.musicxml?v=202607120700',
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3?v=20260623',
  60,
  60,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'MQ 1-1 6音同時押し（パリィ音名）',
  'MQ 1-1 six-note parry labels',
  'メインクエスト 1-1 OSMD を 6 音同時押し化した通常バトル。パリィ円の音名（C D E F G A・横並び）と与ダメージ／被ダメージを確認する。',
  'Normal MQ 1-1 OSMD battle with six-note simultaneous attacks. Verify horizontal note-name labels (C D E F G A) and deal/take damage.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-lesson'),
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  false,
  NULL,
  false,
  NULL,
  false,
  NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-six-note-parry-osmd-stage'),
  false,
  false,
  'MQ 1-1 6音同時押し（パリィ音名）',
  'MQ 1-1 six-note parry labels',
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
