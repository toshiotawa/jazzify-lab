-- Add a tutorial ear-training test lesson using static MP3 assets.

BEGIN;

ALTER TABLE public.lesson_songs
  DROP CONSTRAINT IF EXISTS lesson_songs_check_content_type;

ALTER TABLE public.lesson_songs
  VALIDATE CONSTRAINT lesson_songs_content_check;

DELETE FROM public.lesson_songs
WHERE ear_training_stage_id = '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc001'::uuid
  AND id <> '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc301'::uuid;

DELETE FROM public.lesson_songs
WHERE lesson_id = '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc201'::uuid
  AND id <> '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc301'::uuid;

DELETE FROM public.lesson_songs
WHERE ear_training_stage_id IN (
    SELECT id
    FROM public.ear_training_stages
    WHERE slug = 'tutorial-earcopy-test'
      AND id <> '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc001'::uuid
  );

DELETE FROM public.ear_training_stages
WHERE slug = 'tutorial-earcopy-test'
  AND id <> '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc001'::uuid;

DELETE FROM public.ear_training_phrase_demo_loops
WHERE phrase_id IN (
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid,
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid
);

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id IN (
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid,
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid
);

DELETE FROM public.ear_training_phrase_notes
WHERE phrase_id IN (
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid,
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid
);

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
  is_active
) VALUES (
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc001'::uuid,
  'tutorial-earcopy-test',
  'テスト、耳コピモード。',
  'Test: ear-copy mode',
  '耳コピバトルモードの動作確認用ステージです。4小節のコード進行を6ループする短いメロディを聞いて答えます。',
  'A test stage for ear-copy battle mode. Listen to a short melody over a four-measure progression repeated six times.',
  120,
  4,
  4,
  4,
  6,
  4,
  120,
  100,
  40,
  2,
  10,
  15,
  20,
  3,
  10,
  0,
  2,
  'blue_club',
  true
)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  bpm = EXCLUDED.bpm,
  beats_per_measure = EXCLUDED.beats_per_measure,
  beat_type = EXCLUDED.beat_type,
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
  perfect_max_misses = EXCLUDED.perfect_max_misses,
  great_max_misses = EXCLUDED.great_max_misses,
  background_theme = EXCLUDED.background_theme,
  is_active = EXCLUDED.is_active;

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
    '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid,
    '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc001'::uuid,
    0,
    'ドレミ',
    'Do Re Mi',
    null,
    '/ear-training/tutorial-earcopy-test/phrase-001.mp3',
    8,
    48,
    3
  ),
  (
    '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid,
    '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc001'::uuid,
    1,
    'ソファミレド',
    'So Fa Mi Re Do',
    null,
    '/ear-training/tutorial-earcopy-test/phrase-002.mp3',
    8,
    48,
    5
  )
ON CONFLICT (id) DO UPDATE SET
  stage_id = EXCLUDED.stage_id,
  order_index = EXCLUDED.order_index,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  music_xml_url = EXCLUDED.music_xml_url,
  audio_url = EXCLUDED.audio_url,
  loop_duration_sec = EXCLUDED.loop_duration_sec,
  audio_duration_sec = EXCLUDED.audio_duration_sec,
  note_count = EXCLUDED.note_count;

INSERT INTO public.ear_training_phrase_notes (
  phrase_id,
  note_index,
  pitch_midi,
  pitch_class,
  note_name,
  octave,
  measure_number,
  beat_offset
) VALUES
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 0, 60, 0, 'C4', 4, 1, 0),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 1, 62, 2, 'D4', 4, 1, 2),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 2, 64, 4, 'E4', 4, 2, 0),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 0, 67, 7, 'G4', 4, 1, 0),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 1, 65, 5, 'F4', 4, 1, 1.5),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 2, 64, 4, 'E4', 4, 1, 3),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 3, 62, 2, 'D4', 4, 2, 0.5),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 4, 60, 0, 'C4', 4, 2, 2);

INSERT INTO public.ear_training_phrase_chords (
  phrase_id,
  order_index,
  chord_name,
  measure_number,
  beat_offset,
  duration_beats,
  start_time_sec,
  end_time_sec
) VALUES
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 0, 'Dm7', 1, 0, 4, 0, 2),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 1, 'G7', 2, 0, 4, 2, 4),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 2, 'CM7', 3, 0, 4, 4, 6),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 3, 'A7', 4, 0, 4, 6, 8),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 0, 'Dm7', 1, 0, 4, 0, 2),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 1, 'G7', 2, 0, 4, 2, 4),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 2, 'CM7', 3, 0, 4, 4, 6),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 3, 'A7', 4, 0, 4, 6, 8);

INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number)
VALUES
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 1),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 3),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc101'::uuid, 5),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 1),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 3),
  ('0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc102'::uuid, 5);

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
  assignment_description
) VALUES (
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc201'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'テスト、耳コピモード。',
  'Test: ear-copy mode',
  '耳コピバトルモードのテスト用レッスンです。短いメロディを聞いて、同じ音を順番に入力してください。',
  'A test lesson for ear-copy battle mode. Listen to the short melody, then enter the same notes in order.',
  false,
  (
    SELECT COALESCE(MAX(order_index) + 1, 0)
    FROM public.lessons
    WHERE course_id = 'a0000000-0000-0000-0000-000000000001'::uuid
      AND id <> '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc201'::uuid
  ),
  1,
  'チュートリアル',
  'Tutorial',
  '[]'::jsonb,
  '耳コピバトルのテストステージでBランク以上を目指してください。'
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  nav_links = EXCLUDED.nav_links,
  assignment_description = EXCLUDED.assignment_description;

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
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc301'::uuid,
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc201'::uuid,
  null,
  0,
  '{"count":1,"rank":"B"}'::jsonb,
  false,
  null,
  false,
  null,
  true,
  '0f4a2b9c-5d61-4fe2-a9c3-0e2e348cc001'::uuid,
  '課題ステージ（耳コピモード）',
  'Assignment stage (ear-copy mode)'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  song_id = EXCLUDED.song_id,
  order_index = EXCLUDED.order_index,
  clear_conditions = EXCLUDED.clear_conditions,
  is_fantasy = EXCLUDED.is_fantasy,
  fantasy_stage_id = EXCLUDED.fantasy_stage_id,
  is_survival = EXCLUDED.is_survival,
  survival_stage_number = EXCLUDED.survival_stage_number,
  is_ear_training = EXCLUDED.is_ear_training,
  ear_training_stage_id = EXCLUDED.ear_training_stage_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
