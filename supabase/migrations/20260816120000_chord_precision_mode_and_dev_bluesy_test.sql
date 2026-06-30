-- chord_precision モード追加 + 開発者テストコースに Bluesy Licks フレーズ1 Slow 精密課題
-- 資産:
--   MP3: public/sozai/bluesy-licks/bluesy-licks-01-120_slow_loop4_ci.mp3（既存）
--   MusicXML: public/sozai/bluesy-licks/bluesy-licks-01-120_slow_precision_lyrics.musicxml（歌詞テスト用）
--   node scripts/inject-bluesy-precision-test-lyrics.mjs
-- R2: node scripts/upload-bluesy-licks-r2.mjs（新 MusicXML を CDN 反映）

BEGIN;

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_mode_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_mode_check
  CHECK (mode IN (
    'phrase',
    'chord_voicing',
    'chord_quiz',
    'chord_osmd',
    'chord_precision',
    'adlib',
    'phrase_pair_adlib'
  ));

COMMENT ON COLUMN public.ear_training_stages.mode IS
  'バトル種別: phrase / chord_voicing / chord_quiz / chord_osmd / chord_precision / adlib / phrase_pair_adlib';

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
  practice_transpose,
  show_keyboard_hints_in_battle,
  osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-bluesy-precision-stage'),
  'dev-bluesy-01-slow-precision',
  'Bluesy Licks 1（Slow・精密）',
  'Bluesy Licks 1 (Slow · Precision)',
  'BPM 120・F メジャー・Synthesia 風精密モード（開発テスト）。歌詞表示あり。',
  '120 BPM F major precision mode dev test with lyric overlay.',
  120,
  -1,
  4,
  4,
  8,
  4,
  0,
  600,
  100,
  1,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  'blue_club',
  true,
  'chord_precision',
  true,
  false,
  true
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  mode = EXCLUDED.mode,
  practice_transpose = EXCLUDED.practice_transpose,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  updated_at = now();

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-bluesy-precision-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-bluesy-precision-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-bluesy-precision-stage'),
  0,
  'フレーズ 1（Slow・精密）',
  'Phrase 1 (Slow · Precision)',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-01-120_slow_precision_lyrics.musicxml',
  'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-01-120_slow_loop4_ci.mp3',
  66,
  66,
  0,
  -1
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-bluesy-precision-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'Bluesy Licks 精密（Slow）',
  'Bluesy Licks Precision (Slow)',
  'Bluesy Licks フレーズ1 Slow の精密モード（落下ノーツ）開発テスト。歌詞テキストボックスの表示確認用。',
  'Developer test for Bluesy Licks phrase 1 slow in precision (falling notes) mode, including lyric overlay.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  'GOOD率70%以上（ランクC以上）でクリアしてください。',
  'Clear with 70% or more GOOD notes (rank C or better).'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-bluesy-precision-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-bluesy-precision-lesson'),
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  false,
  NULL,
  false,
  NULL,
  false,
  NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-bluesy-precision-stage'),
  false,
  false,
  'Bluesy Licks 1 Slow 精密',
  'Bluesy Licks 1 Slow Precision',
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
