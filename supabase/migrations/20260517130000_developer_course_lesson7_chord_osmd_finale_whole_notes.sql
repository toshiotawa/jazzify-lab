-- 開発者コース追加レッスン7: Finale 製・1 voice / 全音符 4 小節（Dm7-G7-CM7-A7）。
-- normalizer は staff 情報がない note を unsupported として skip するため、
-- この MusicXML は生のまま OSMD に渡る（multi-staff 系の挙動と切り分けるためのラボ）。
--
-- CDN へ要アップロード: public/demo lesson7.musicxml を
--   https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-lesson7-whole.musicxml
-- として配置（ユーザー作業）。
-- 音声は既存の `phrase-01.mp3`（同じ進行・同テンポ・8 秒）を一時的に流用する。
--
-- UUID: uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, '<name>')

BEGIN;

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-lsong');

DELETE FROM public.lessons
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-lesson');

DELETE FROM public.ear_training_phrase_demo_loops
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-ph1');

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-ph1');

DELETE FROM public.ear_training_phrases
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-ph1');

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-stage'),
  'developer-course-osmd-finale-whole-notes-lab',
  'OSMD 開発・Finale 全音符（4小節）',
  'OSMD dev: Finale-authored whole notes (4 bars)',
  '実験用。Finale で書き出した 1 voice の全音符 4 小節 MusicXML を読み込み、OSMD の単純構造での描画挙動を確認する。BPM 120、Dm7-G7-CM7-A7。',
  'Lab: load a 4-bar, single-voice whole-note MusicXML authored in Finale to verify OSMD rendering on a minimal structure. 120 BPM, Dm7-G7-CM7-A7.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-stage'),
  0,
  'Finale 全音符 Dm7-G7-CM7-A7',
  'Finale whole notes Dm7-G7-CM7-A7',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-lesson7-whole.musicxml',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01.mp3',
  8,
  8,
  4,
  0
);

-- 各小節 1 つの全音符（duration 4 拍, 2 秒）
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-p1-00'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-ph1'),
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-p1-01'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-ph1'),
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-p1-02'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-ph1'),
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-p1-03'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-ph1'),
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
VALUES (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-ph1'), 1);

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'OSMD 開発・Finale 全音符（レッスン7）',
  'OSMD dev: Finale whole notes (Lesson 7)',
  'Finale で作成した 1 voice / 全音符 4 小節 MusicXML（Dm7-G7-CM7-A7、120 BPM）。multi-staff の正規化を回避した最小構成で OSMD 描画を確認するためのラボ。',
  'Lab: Finale-authored 1-voice whole-note MusicXML (Dm7-G7-CM7-A7, 120 BPM). Minimal structure that bypasses the multi-staff normalizer, used to verify OSMD rendering.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '開発用「Finale 全音符」レッスンで一度プレイし、OSMD の譜面描画（特に 1 小節目）が正しく表示されるか確認してください（クリア不要・練習可）。',
  'Play the Finale whole-notes lab once and verify that the OSMD score (especially measure 1) renders correctly (practice OK; clearing not required).'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-lesson'),
  null,
  0,
  jsonb_build_object('count', 1, 'rank', 'C'),
  false,
  null,
  false,
  null,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-osmd-l7-whole-stage'),
  '課題（Finale 全音符 OSMD）',
  'Assignment (Finale whole-note OSMD)'
);

COMMIT;
