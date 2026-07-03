-- 開発者テストコース: Donna Lee コンピング精密モード（BPM240・カウントあり）
-- 資産:
--   MP3: public/sozai/Comping/Donna Lee_Comping.mp3
--   MIDI: public/sozai/Comping/Donna_Lee_Comping.mid（落下ノーツ生成）
--   MusicXML: node scripts/inject-comping-direction-lyrics.mjs
--     → public/sozai/Comping/Donna Lee Comping precision_lyrics.musicxml
-- R2: sozai/Comping/ 配下へ CDN 反映

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
  practice_transpose,
  show_keyboard_hints_in_battle,
  osmd_targets_from_score
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-comping-stage'),
  'dev-donna-lee-comping-precision',
  'Donna Lee コンピング（精密）',
  'Donna Lee Comping (Precision)',
  'BPM 240・Ab メジャー・MIDI 落下ノーツ + 表現記号セリフの歌詞オーバーレイ（開発テスト）。',
  '240 BPM Ab major precision comping dev test: MIDI falling notes + expression lyric overlay.',
  240,
  -4,
  4,
  4,
  33,
  1,
  0,
  120,
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
  key_fifths = EXCLUDED.key_fifths,
  loop_measures = EXCLUDED.loop_measures,
  max_loops_per_phrase = EXCLUDED.max_loops_per_phrase,
  count_in_beats = EXCLUDED.count_in_beats,
  mode = EXCLUDED.mode,
  practice_transpose = EXCLUDED.practice_transpose,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  updated_at = now();

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-comping-stage');

INSERT INTO public.ear_training_phrases (
  id,
  stage_id,
  order_index,
  title,
  title_en,
  music_xml_url,
  audio_url,
  midi_url,
  loop_duration_sec,
  audio_duration_sec,
  note_count,
  key_fifths
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-comping-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-comping-stage'),
  0,
  'Donna Lee コンピング（カウントあり）',
  'Donna Lee Comping (with count-in)',
  'https://jazzify-cdn.com/sozai/Comping/Donna%20Lee%20Comping%20precision_lyrics.musicxml?v=202607031650',
  'https://jazzify-cdn.com/sozai/Comping/Donna%20Lee_Comping.mp3',
  'https://jazzify-cdn.com/sozai/Comping/Donna_Lee_Comping.mid',
  33,
  33,
  0,
  -4
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-comping-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'Donna Lee コンピング（精密）',
  'Donna Lee Comping (Precision)',
  'Donna Lee コンピング BPM240（カウントあり）。MIDI から落下ノーツ、表現記号セリフを歌詞テキストボックスに表示。',
  'Donna Lee comping at 240 BPM with count-in. Falling notes from MIDI; expression dialogue in lyric overlay.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-comping-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-comping-lesson'),
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  false,
  NULL,
  false,
  NULL,
  false,
  NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-comping-stage'),
  false,
  false,
  'Donna Lee コンピング',
  'Donna Lee Comping',
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
