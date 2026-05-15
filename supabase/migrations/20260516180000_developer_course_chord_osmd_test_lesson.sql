-- 開発者テストコースに chord_osmd（OSMD リズムバトル）のステージ・フレーズ2・レッスン・課題を追加。
-- 依存: 20260516170000_add_ear_training_chord_osmd_mode.sql（mode に chord_osmd）
--
-- 資産:
--   node scripts/build-dev-chord-osmd-120-click-mp3.mjs
--   MusicXML: public/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-0[12].musicxml
-- R2: node scripts/upload-dev-chord-osmd-120-assets-to-r2.mjs（要 wrangler / .env.r2）
--
-- UUID は uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, '<name>') で固定。

BEGIN;

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-lsong');

DELETE FROM public.lessons
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-lesson');

DELETE FROM public.ear_training_phrase_demo_loops
WHERE phrase_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2')
);

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2')
);

DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-stage');

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-stage');

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
  mode
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-stage'),
  'dev-chord-osmd-120-c-major-turnaround',
  'OSMD リズムバトル（開発テスト）',
  'OSMD rhythm battle (dev test)',
  'BPM120・4/4・クリック8秒×1ループ。Cメジャー。フレーズ1: Dm7|G7|CM7|A7。フレーズ2: CM7|A7|Dm7|G7。各拍はルートの四分音符を左右で1オクターブ交互。',
  '120 BPM, 4/4, 8s click (one 4-bar loop). C major. Phrase 1: Dm7|G7|CM7|A7. Phrase 2: CM7|A7|Dm7|G7. Quarter-note roots, alternating hands by octave.',
  120,
  0,
  4,
  4,
  4,
  6,
  4,
  180,
  100,
  80,
  0,
  12,
  18,
  24,
  3,
  10,
  0,
  2,
  'blue_club',
  true,
  'chord_osmd'
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-stage'),
    0,
    'フレーズ1',
    'Phrase 1',
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01.musicxml',
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-01.mp3',
    8,
    8,
    16
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-stage'),
    1,
    'フレーズ2',
    'Phrase 2',
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-02.musicxml',
    'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-02.mp3',
    8,
    8,
    16
  );

-- フレーズ1: Dm7 G7 CM7 A7（ルート四分×4 / 小節、staff 2,1,2,1）
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-00'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    0,
    'Dm7',
    1,
    1,
    1,
    0,
    0.5,
    ARRAY['D3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-01'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    1,
    'Dm7',
    1,
    2,
    1,
    0.5,
    1,
    ARRAY['D4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-02'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    2,
    'Dm7',
    1,
    3,
    1,
    1,
    1.5,
    ARRAY['D3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-03'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    3,
    'Dm7',
    1,
    4,
    1,
    1.5,
    2,
    ARRAY['D4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-04'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    4,
    'G7',
    2,
    1,
    1,
    2,
    2.5,
    ARRAY['G3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-05'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    5,
    'G7',
    2,
    2,
    1,
    2.5,
    3,
    ARRAY['G4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-06'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    6,
    'G7',
    2,
    3,
    1,
    3,
    3.5,
    ARRAY['G3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-07'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    7,
    'G7',
    2,
    4,
    1,
    3.5,
    4,
    ARRAY['G4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-08'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    8,
    'CM7',
    3,
    1,
    1,
    4,
    4.5,
    ARRAY['C3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-09'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    9,
    'CM7',
    3,
    2,
    1,
    4.5,
    5,
    ARRAY['C4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-10'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    10,
    'CM7',
    3,
    3,
    1,
    5,
    5.5,
    ARRAY['C3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-11'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    11,
    'CM7',
    3,
    4,
    1,
    5.5,
    6,
    ARRAY['C4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-12'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    12,
    'A7',
    4,
    1,
    1,
    6,
    6.5,
    ARRAY['A2']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-13'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    13,
    'A7',
    4,
    2,
    1,
    6.5,
    7,
    ARRAY['A3']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-14'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    14,
    'A7',
    4,
    3,
    1,
    7,
    7.5,
    ARRAY['A2']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p1-15'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'),
    15,
    'A7',
    4,
    4,
    1,
    7.5,
    8,
    ARRAY['A3']::text[],
    ARRAY[1]::smallint[]
  );

-- フレーズ2: CM7 A7 Dm7 G7
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
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-00'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    0,
    'CM7',
    1,
    1,
    1,
    0,
    0.5,
    ARRAY['C3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-01'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    1,
    'CM7',
    1,
    2,
    1,
    0.5,
    1,
    ARRAY['C4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-02'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    2,
    'CM7',
    1,
    3,
    1,
    1,
    1.5,
    ARRAY['C3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-03'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    3,
    'CM7',
    1,
    4,
    1,
    1.5,
    2,
    ARRAY['C4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-04'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    4,
    'A7',
    2,
    1,
    1,
    2,
    2.5,
    ARRAY['A2']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-05'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    5,
    'A7',
    2,
    2,
    1,
    2.5,
    3,
    ARRAY['A3']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-06'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    6,
    'A7',
    2,
    3,
    1,
    3,
    3.5,
    ARRAY['A2']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-07'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    7,
    'A7',
    2,
    4,
    1,
    3.5,
    4,
    ARRAY['A3']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-08'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    8,
    'Dm7',
    3,
    1,
    1,
    4,
    4.5,
    ARRAY['D3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-09'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    9,
    'Dm7',
    3,
    2,
    1,
    4.5,
    5,
    ARRAY['D4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-10'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    10,
    'Dm7',
    3,
    3,
    1,
    5,
    5.5,
    ARRAY['D3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-11'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    11,
    'Dm7',
    3,
    4,
    1,
    5.5,
    6,
    ARRAY['D4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-12'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    12,
    'G7',
    4,
    1,
    1,
    6,
    6.5,
    ARRAY['G3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-13'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    13,
    'G7',
    4,
    2,
    1,
    6.5,
    7,
    ARRAY['G4']::text[],
    ARRAY[1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-14'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    14,
    'G7',
    4,
    3,
    1,
    7,
    7.5,
    ARRAY['G3']::text[],
    ARRAY[2]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-p2-15'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'),
    15,
    'G7',
    4,
    4,
    1,
    7.5,
    8,
    ARRAY['G4']::text[],
    ARRAY[1]::smallint[]
  );

INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number)
VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph1'), 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-ph2'), 1);

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'OSMD リズムバトル（テスト）',
  'OSMD rhythm battle (test)',
  '開発用 chord_osmd。120BPM・クリックのみ・4小節×2フレーズ。MusicXML とルート四分のリズム判定を確認します。',
  'Developer chord_osmd stage: 120 BPM click, two 4-bar phrases. Verifies MusicXML and quarter-root rhythm targets.',
  false,
  COALESCE(mx.max_o, 0) + 1,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  'OSMD リズムバトル（chord_osmd）でランクB以上を1回クリアしてください。',
  'Clear the OSMD rhythm battle (chord_osmd) once with rank B or better.'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-lesson'),
  null,
  0,
  '{"count":1,"rank":"B"}'::jsonb,
  false,
  null,
  false,
  null,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-osmd120-stage'),
  '課題（OSMD リズムバトル）',
  'Assignment (OSMD rhythm battle)'
);

COMMIT;
