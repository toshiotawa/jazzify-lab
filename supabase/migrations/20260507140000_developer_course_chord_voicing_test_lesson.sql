-- 開発者用テストコース先頭に chord_voicing 耳コピ課題を追加。
-- 音源: node scripts/build-dev-chord-voicing-click-mp3.mjs で生成し、
--   audio_url と同じパスへ CDN/R2 にアップロードすること。
-- UUID は uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, '<name>') で固定。

BEGIN;

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS assignment_description_en text;

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-voicing-lsong');

DELETE FROM public.lessons
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-voicing-lesson');

DELETE FROM public.ear_training_phrase_demo_loops
WHERE phrase_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2')
);

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2')
);

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-stage');

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-stage');

-- ダミーレッスンを order 1 へ（新レッスンを先頭にする）
UPDATE public.lessons
SET order_index = 1
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-test-dummy-lesson')
  AND course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test');

INSERT INTO public.ear_training_stages (
  id,
  slug,
  title,
  title_en,
  description,
  description_en,
  bpm,
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
  mode
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-stage'),
  'dev-chord-voicing-bpm100-test',
  'コード演奏バトル（開発テスト）',
  'Chord voicing battle (dev test)',
  'BPM100・4小節×6ループのクリックのみ。フレーズ1: Dm7 G7 CM7 CM7。フレーズ2: Em7 A7 Dm7 G7。',
  'Click-only track at 100 BPM, 4 bars × 6 loops. Phrase 1: Dm7 G7 CM7 CM7. Phrase 2: Em7 A7 Dm7 G7.',
  100,
  4,
  4,
  4,
  6,
  4,
  180,
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
  'chord_voicing'
);

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
  note_count
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-stage'),
    0,
    'フレーズ1',
    'Phrase 1',
    null,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-voicing-phrase-01.mp3',
    9.6,
    57.6,
    0
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-stage'),
    1,
    'フレーズ2',
    'Phrase 2',
    null,
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-voicing-phrase-02.mp3',
    9.6,
    57.6,
    0
  );

-- フレーズ1: Dm7 G7 CM7 CM7（各1小節 = 4拍 = 2.4s @ BPM100）
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-c0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
    0,
    'Dm7',
    1,
    1,
    4,
    0,
    2.4,
    ARRAY['D3', 'F3', 'A3', 'C4']::text[],
    ARRAY[2, 2, 2, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-c1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
    1,
    'G7',
    2,
    1,
    4,
    2.4,
    4.8,
    ARRAY['G3', 'B3', 'D4', 'F4']::text[],
    ARRAY[2, 2, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-c2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
    2,
    'CM7',
    3,
    1,
    4,
    4.8,
    7.2,
    ARRAY['C3', 'E3', 'G3', 'B3']::text[],
    ARRAY[2, 2, 2, 2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p1-c3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'),
    3,
    'CM7',
    4,
    1,
    4,
    7.2,
    9.6,
    ARRAY['E3', 'G3', 'B3', 'D4']::text[],
    ARRAY[2, 2, 2, 1]::smallint[]
  );

-- フレーズ2: Em7 A7 Dm7 G7
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-c0'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'),
    0,
    'Em7',
    1,
    1,
    4,
    0,
    2.4,
    ARRAY['E3', 'G3', 'B3', 'D4']::text[],
    ARRAY[2, 2, 2, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-c1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'),
    1,
    'A7',
    2,
    1,
    4,
    2.4,
    4.8,
    ARRAY['A2', 'C#4', 'E4', 'G4']::text[],
    ARRAY[2, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-c2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'),
    2,
    'Dm7',
    3,
    1,
    4,
    4.8,
    7.2,
    ARRAY['D3', 'F3', 'A3', 'C4']::text[],
    ARRAY[2, 2, 2, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-p2-c3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'),
    3,
    'G7',
    4,
    1,
    4,
    7.2,
    9.6,
    ARRAY['G3', 'B3', 'D4', 'F4']::text[],
    ARRAY[2, 2, 1, 1]::smallint[]
  );

INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number)
VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1'), 5),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2'), 5);

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
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-voicing-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'コード演奏バトル（テスト）',
  'Chord voicing battle (test)',
  '開発用のコード演奏バトル（chord_voicing）ステージです。クリック6ループに合わせてコードを完成させてください。',
  'Developer test for chord_voicing ear training. Complete each chord in time with the six-loop click track.',
  false,
  0,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  'コード演奏バトルでランクB以上を1回クリアしてください。',
  'Clear the chord voicing battle once with rank B or better.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-voicing-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-voicing-lesson'),
  null,
  0,
  '{"count":1,"rank":"B"}'::jsonb,
  false,
  null,
  false,
  null,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-stage'),
  '課題（コード演奏バトル）',
  'Assignment (chord voicing battle)'
);

COMMIT;
