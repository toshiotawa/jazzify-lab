-- 開発者用コースのレッスン5として、lesson4 と独立した chord_osmd（II-V 50・160BPM）を追加。
-- ステージ／フレーズ／コード行は現行「OSMD開発テスト」から複製（同一 CDN URL）。
-- UUID は uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, '<name>') で固定。
--
-- 依存: courses is_developer_only、開発者 chord_osmd 関連（ソースの dev-ear-osmd120-ph1 が存在すること）。

BEGIN;

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-lsong');

DELETE FROM public.lessons
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-lesson');

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-ph1');

DELETE FROM public.ear_training_phrases
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-ph1');

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-stage');

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
  is_demo,
  chord_voicing_self_paced,
  quiz_duration_seconds,
  quiz_question_order,
  quiz_show_notation_in_battle,
  quiz_required_correct_count
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-stage'),
  'developer-course-lesson5-chord-osmd-ii-v50',
  'OSMD II-V（レッスン5バトル）',
  'OSMD II-V (Lesson 5 battle)',
  '開発者用・別ステージ複製。160BPM・40小節（II-V 50）。開発コース標準の chord_osmd テストに加えるロングラン課題（lesson4 OSMD テストと独立）。',
  'Separate developer clone: 160 BPM, 40-bar II-V 50 phrase. Long-run chord_osmd homework independent of Lesson 4 OSMD test.',
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
  is_demo,
  chord_voicing_self_paced,
  quiz_duration_seconds,
  quiz_question_order,
  quiz_show_notation_in_battle,
  quiz_required_correct_count
FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-stage');

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
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-stage'),
  0,
  title,
  title_en,
  music_xml_url,
  audio_url,
  loop_duration_sec,
  audio_duration_sec,
  note_count,
  key_fifths
FROM public.ear_training_phrases
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1');

INSERT INTO public.ear_training_phrase_chords (
  id,
  phrase_id,
  order_index,
  chord_name,
  measure_number,
  beat_offset,
  duration_beats,
  start_time_sec,
  end_time_sec,
  voicing,
  voicing_staves
)
SELECT
  uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'developer-course-lesson5-p1-ch-' || LPAD(order_index::text, 4, '0')
  ),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-ph1'),
  order_index,
  chord_name,
  measure_number,
  beat_offset,
  duration_beats,
  start_time_sec,
  end_time_sec,
  voicing,
  voicing_staves
FROM public.ear_training_phrase_chords
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'OSMD II-V 50（レッスン5）',
  'OSMD II-V 50 (Lesson 5)',
  '開発者用の別 chord_osmd 課題。160BPM・約60秒・40小節（II-V 50）。OSMD の MeasureList とロングスクロールを確認します（レッスン4 と同一譜でもステージ別）。',
  'Separate chord_osmd developer assignment: ~60s II-V phrase at 160 BPM. Validates OSMD scrolling and timings (cloned stage apart from Lesson 4).',
  false,
  4,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  'OSMD リズムバトル II-V（chord_osmd）でランクB以上を1回クリアしてください。',
  'Clear the OSMD II-V rhythm battle (chord_osmd) once with rank B or better.'
);

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
  is_ear_training,
  ear_training_stage_id,
  title,
  title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-lesson'),
  null,
  0,
  '{"count":1,"rank":"B"}'::jsonb,
  false,
  null,
  false,
  null,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-lesson5-chord-osmd-ii-stage'),
  '課題（OSMD II-V 50）',
  'Assignment (OSMD II-V 50)'
);

COMMIT;
