-- 開発者コース追加レッスン8: Finale 製・2 staff / 2 voice・全音符 4 小節（Dm7-G7-CM7-A7）。
-- lesson7（1 staff）との対比用。multi-staff・voice の MusicXML が OSMD / normalizer でどう扱われるか確認するラボ。
--
-- CDN へ要アップロード: public/demo_lesson 8.musicxml を
--   https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-lesson8-two-staves.musicxml
-- として配置（ユーザー作業）。
-- 音声は既存の `phrase-01.mp3`（同じ進行・同テンポ・8 秒）を一時的に流用する。
--
-- UUID: uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, '<name>')

BEGIN;

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-lsong');

DELETE FROM public.lessons
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-lesson');

DELETE FROM public.ear_training_phrase_demo_loops
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-ph1');

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-ph1');

DELETE FROM public.ear_training_phrases
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-ph1');

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-stage'),
  'developer-course-osmd-finale-two-staves-whole-lab',
  'OSMD 開発・Finale 2譜表・全音符（4小節）',
  'OSMD dev: Finale 2-staff whole notes (4 bars)',
  '実験用。Finale で書き出した treble+bass の 2 staff・全音符 4 小節 MusicXML を読み込み、multi-staff 構成での OSMD 描画・正規化挙動を確認する。BPM 120、Dm7-G7-CM7-A7。',
  'Lab: load a 4-bar whole-note MusicXML with two staves (treble+bass) from Finale to verify OSMD rendering and multi-staff normalization. 120 BPM, Dm7-G7-CM7-A7.',
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
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-stage'),
  0,
  'Finale 2譜表・全音符 Dm7-G7-CM7-A7',
  'Finale two-staff whole notes Dm7-G7-CM7-A7',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-lesson8-two-staves.musicxml',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01.mp3',
  8,
  8,
  4,
  0
);

-- 各小節 1 つの全音符（duration 4 拍, 2 秒）— lesson7 と同一タイミング
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
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-p1-00'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-ph1'),
    0,
    'Dm7',
    1,
    1,
    4,
    0,
    2,
    ARRAY['D4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-p1-01'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-ph1'),
    1,
    'G7',
    2,
    1,
    4,
    2,
    4,
    ARRAY['G4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-p1-02'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-ph1'),
    2,
    'CM7',
    3,
    1,
    4,
    4,
    6,
    ARRAY['C4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-p1-03'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-ph1'),
    3,
    'A7',
    4,
    1,
    4,
    6,
    8,
    ARRAY['A4']::text[],
    ARRAY[1]::smallint[]
  );

INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number)
VALUES (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-ph1'), 1);

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'OSMD 開発・Finale 2譜表・全音符（レッスン8）',
  'OSMD dev: Finale two-staff whole notes (Lesson 8)',
  'Finale で作成した 2 staff（treble+bass）/ 全音符 4 小節 MusicXML（Dm7-G7-CM7-A7、120 BPM）。lesson7 の 1 staff 構成と対比し、multi-staff での OSMD 描画を確認するラボ。',
  'Lab: Finale-authored two-staff whole-note MusicXML (Dm7-G7-CM7-A7, 120 BPM). Contrast with Lesson 7 single-staff export; verify OSMD rendering with multiple staves.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '開発用「Finale 2譜表・全音符」レッスンで一度プレイし、OSMD の譜面描画（特に 2 譜表・和声重なり）が正しく表示されるか確認してください（クリア不要・練習可）。',
  'Play the Finale two-staff whole-notes lab once and verify OSMD score rendering (especially two staves / chord overlap) is correct (practice OK; clearing not required).'
FROM (
  SELECT MAX(order_index) AS max_o
  FROM public.lessons
  WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')
) mx;

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-lesson'),
  null,
  0,
  jsonb_build_object('count', 1, 'rank', 'C'),
  false,
  null,
  false,
  null,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l8-2staff-stage'),
  '課題（Finale 2譜表・全音符 OSMD）',
  'Assignment (Finale two-staff whole-note OSMD)'
);

COMMIT;
