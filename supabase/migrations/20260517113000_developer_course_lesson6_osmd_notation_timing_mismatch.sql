-- 開発者コース追加レッスン: 「楽譜≠判定データ」実験用。
--
-- • 譜面・音声: chord_osmd 開発用のフレーズ2（120 BPM・8 秒、`phrase-02-v2.musicxml` + `phrase-02.mp3`）
-- • `ear_training_phrase_chords`: **フレーズ1** （`dev-ear-osmd120-ph1`）の行を複製（リズムは揃うがルート並び・音が譜と一致しない）
-- • II-V50 とは別 CDN 資産。ズレ許容での挙動確認用。
--
-- UUID: uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, '<name>')
--
-- 依存: `dev-ear-osmd120-stage` / `dev-ear-osmd120-ph1` とそのコード行、`course-developer-test`

BEGIN;

DELETE FROM public.lesson_songs
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-lsong');

DELETE FROM public.lessons
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-lesson');

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-ph1');

DELETE FROM public.ear_training_phrases
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-ph1');

DELETE FROM public.ear_training_stages
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-stage');

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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-stage'),
  'developer-course-osmd-score-vs-timing-mismatch-lab',
  'OSMD 開発・楽譜/判定ずれ確認',
  'OSMD lab: score vs timing mismatch',
  '実験用。譜・クリックは「フレーズ2」の 120 BPM 8 秒、判定行はフレーズ1から複製。リズムは合うが音程ハイライトは譜と食い違う想定。',
  'Lab: visuals/audio use Phrase‑2 sheet (120 BPM, 8s); judgment chords cloned from Phrase‑1 timing rows. Rhythm aligns but expected notes disagree with the notation.',
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-ph1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-stage'),
  0,
  'フレーズ2譜 × ズレさせたタイミング行',
  'Phrase‑2 notation, intentionally skewed timings',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-02-v2.musicxml',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-dev-chord-osmd-120-phrase-02.mp3',
  8,
  8,
  16,
  0
);

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
    'developer-course-l6-mm-ch-' || LPAD(order_index::text, 4, '0')
  ),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-ph1'),
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
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'OSMD 開発・楽譜と判定データのずれ確認',
  'OSMD dev: score vs judgment mismatch check',
  'II‑V50 と別。この課題は古い開発用 chord_osmd（フレーズ2の楽譜＋クリック）を読み込み判定はフレーズ1由来の複製につながれています（意図的な不整合調査）。',
  'Separate from II‑V 50 lab. Uses legacy dev chord_osmd phrase‑2 sheet/click audio while cloning timing rows from phrase‑1 (intentional mismatch for QA).',
  false,
  5,
  1,
  'テスト',
  'Test',
  '[]'::jsonb,
  '開発用「楽譜/判定ずれ」ステージで一度プレイし、スクロール・ハンマー・表示の異常やログを確認してください（クリア不要・練習可）。',
  'Play once on the score vs timing mismatch sandbox; note scrolling/hammer/visual quirks (practice OK; clearing not required).'
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
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-lesson'),
  null,
  0,
  jsonb_build_object('count', 1, 'rank', 'C'),
  false,
  null,
  false,
  null,
  true,
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-course-l6-osmd-mismatch-stage'),
  '課題（OSMD 楽譜/判定ずれ）',
  'Assignment (OSMD score-timing skew)'
);

COMMIT;
