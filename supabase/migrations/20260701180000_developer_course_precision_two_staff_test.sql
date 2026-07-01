-- 開発者テストコース: 2段譜・精密モード（譜面帯高さ/ズーム UI 確認用）
-- 既存 CDN 資産を流用:
--   MusicXML: ear-training-dev-chord-osmd-120-lesson8-two-staves.musicxml（Finale 2譜表・全音符 4小節）
--   MP3:      ear-training-dev-chord-osmd-120-phrase-01.mp3（8秒・BPM120）
-- UUID: uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, '<name>')

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-precision-2staff-stage'),
  'dev-precision-two-staff-lab',
  '精密・2譜表ラボ（Finale 全音符）',
  'Precision · 2-staff lab (Finale whole notes)',
  'Finale 製 treble+bass 2段譜 MusicXML を精密モードで表示する開発テスト。譜面帯の高さドラッグと虫眼鏡 +/- の確認用。Dm7-G7-CM7-A7・4小節・BPM120。',
  'Developer test for precision mode with a Finale two-staff (treble+bass) MusicXML. Use to verify score band height drag and zoom controls. Dm7-G7-CM7-A7, 4 bars, 120 BPM.',
  120,
  0,
  4,
  4,
  4,
  4,
  4,
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
  count_in_beats = EXCLUDED.count_in_beats,
  mode = EXCLUDED.mode,
  practice_transpose = EXCLUDED.practice_transpose,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  updated_at = now();

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-precision-2staff-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-precision-2staff-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-precision-2staff-stage'),
  0,
  'Finale 2譜表・全音符 Dm7-G7-CM7-A7',
  'Finale two-staff whole notes Dm7-G7-CM7-A7',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-lesson8-two-staves.musicxml',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01.mp3',
  8,
  8,
  8,
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-precision-2staff-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  '精密・2譜表ラボ',
  'Precision · 2-staff lab',
  '2段譜 MusicXML を精密モード（落下ノーツ）でプレイする開発テスト。譜面帯の高さツマミと虫眼鏡 +/- の動作確認用。',
  'Developer test for precision mode with two-staff MusicXML. Verify score band height drag handle and magnifier zoom controls.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  'GOOD率70%以上（ランクC以上）でクリアしてください。開発確認のためクリア必須ではありません。',
  'Clear with 70% or more GOOD notes (rank C or better). Clear is not required for this dev check.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-precision-2staff-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-precision-2staff-lesson'),
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  false,
  NULL,
  false,
  NULL,
  false,
  NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-precision-2staff-stage'),
  false,
  false,
  '2譜表・精密モード',
  'Two-staff precision mode',
  false
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
