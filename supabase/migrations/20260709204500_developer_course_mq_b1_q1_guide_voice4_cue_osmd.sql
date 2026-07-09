-- 開発者テストコース: MQ 1-1 voice 4 ガイド（休符修正）+ cue 豆譜版追加
-- 資産:
--   public/sozai/dev-mq-b1-q1-osmd-guide-voice4.musicxml（薄い色・休符込み）
--   public/sozai/dev-mq-b1-q1-osmd-guide-voice4-cue.musicxml（薄い色 + type size=cue）
-- 生成: node scripts/build-mq-b1-q1-guide-voice4-musicxml.mjs [--cue]
-- R2: node scripts/upload-sozai-main-quest-block1-r2.mjs

BEGIN;

-- 既存薄い色版: MusicXML URL を休符修正版へ更新
UPDATE public.ear_training_phrases
SET
  music_xml_url = 'https://jazzify-cdn.com/sozai/dev-mq-b1-q1-osmd-guide-voice4.musicxml?v=202607092045',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-osmd-ph0');

-- cue 豆譜版ステージ
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
  osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-cue-osmd-stage'),
  'dev-mq-b1-q1-guide-voice4-cue-osmd',
  'MQ 1-1 ガイド voice 4 cue（OSMD）',
  'MQ 1-1 guide voice 4 cue (OSMD)',
  'メインクエスト 1-1 譜面に voice 4 ガイド（type size=cue 豆譜 + 灰色半透明）を 1 小節前に追加した開発テスト。',
  'Dev test: MQ 1-1 sheet with voice 4 cue-size guide notes one measure ahead (dim gray + type size=cue).',
  100,
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
  'chord_osmd',
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
  mode = EXCLUDED.mode,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  updated_at = now();

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-cue-osmd-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-cue-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-cue-osmd-stage'),
  0,
  'Cブルース・ドとソ（ガイド voice 4 cue）',
  'C Blues Do/Sol (guide voice 4 cue)',
  'https://jazzify-cdn.com/sozai/dev-mq-b1-q1-osmd-guide-voice4-cue.musicxml?v=202607092045',
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-cue-osmd-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'MQ 1-1 ガイド voice 4 cue（OSMD）',
  'MQ 1-1 guide voice 4 cue (OSMD)',
  'メインクエスト 1-1 譜面に voice 4 ガイド（豆譜 size=cue + 灰色）を 1 小節前に追加。薄い色版との見た目比較用。',
  'MQ 1-1 sheet with voice 4 cue-size guide notes one measure ahead. Compare visually with the dim-only guide lesson.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-cue-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-cue-osmd-lesson'),
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  false,
  NULL,
  false,
  NULL,
  false,
  NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-cue-osmd-stage'),
  false,
  false,
  'MQ 1-1 ガイド voice 4 cue（OSMD）',
  'MQ 1-1 guide voice 4 cue (OSMD)',
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
