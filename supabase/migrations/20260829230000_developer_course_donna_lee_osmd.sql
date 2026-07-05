-- 開発者テストコース: Donna Lee コンピング OSMD リズムバトル
-- 精密モード（dev-donna-lee-comping-*）と同一資産を chord_osmd で検証する。
-- 資産:
--   MP3: public/sozai/Comping/Donna Lee_Comping.mp3
--   MusicXML: public/sozai/Comping/Donna Lee Comping precision_lyrics.musicxml
--     （譜面ベース判定 osmd_targets_from_score + 歌詞レーン）
-- R2: sozai/Comping/ 配下へ CDN 反映済み

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-osmd-stage'),
  'dev-donna-lee-comping-osmd',
  'Donna Lee コンピング（OSMD）',
  'Donna Lee Comping (OSMD)',
  'BPM 240・Ab メジャー・MusicXML 譜面ベース判定 + 表現記号セリフの歌詞オーバーレイ（開発テスト）。精密モードと同譜面・同音声。',
  '240 BPM Ab major OSMD rhythm battle dev test: score-based targets + expression lyric overlay. Same sheet and audio as precision mode.',
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
  1,
  1,
  1,
  0,
  0,
  0,
  0,
  'blue_club',
  true,
  'chord_osmd',
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
  time_limit_sec = EXCLUDED.time_limit_sec,
  player_hp = EXCLUDED.player_hp,
  enemy_hp = EXCLUDED.enemy_hp,
  per_correct_note_damage = EXCLUDED.per_correct_note_damage,
  good_completion_damage = EXCLUDED.good_completion_damage,
  great_completion_damage = EXCLUDED.great_completion_damage,
  perfect_completion_damage = EXCLUDED.perfect_completion_damage,
  miss_damage = EXCLUDED.miss_damage,
  fail_damage = EXCLUDED.fail_damage,
  mode = EXCLUDED.mode,
  practice_transpose = EXCLUDED.practice_transpose,
  show_keyboard_hints_in_battle = EXCLUDED.show_keyboard_hints_in_battle,
  osmd_targets_from_score = EXCLUDED.osmd_targets_from_score,
  updated_at = now();

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-osmd-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-osmd-stage'),
  0,
  'Donna Lee コンピング（カウントあり）',
  'Donna Lee Comping (with count-in)',
  'https://jazzify-cdn.com/sozai/Comping/Donna%20Lee%20Comping%20precision_lyrics.musicxml?v=202607032100',
  'https://jazzify-cdn.com/sozai/Comping/Donna%20Lee_Comping.mp3',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-osmd-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'Donna Lee コンピング（OSMD）',
  'Donna Lee Comping (OSMD)',
  'Donna Lee コンピング BPM240（カウントあり）。MusicXML 譜面ベース判定の OSMD リズムバトル。精密モードと同譜面・同音声で歌詞レーンとロングスクロールを確認。',
  'Donna Lee comping at 240 BPM with count-in. OSMD rhythm battle with score-based targets. Same sheet and audio as precision mode; verify lyric lanes and long scroll.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-osmd-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-osmd-lesson'),
  0,
  '{"count":1,"rank":"C"}'::jsonb,
  false,
  NULL,
  false,
  NULL,
  false,
  NULL,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-osmd-stage'),
  false,
  false,
  'Donna Lee コンピング（OSMD）',
  'Donna Lee Comping (OSMD)',
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
