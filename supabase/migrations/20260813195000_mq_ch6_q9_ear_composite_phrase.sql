-- クエスト9 9-6 を OSMD から耳コピ複合フレーズバトルへ差し替え。
-- ソース: 課題1–5。敵 HP 150。BGM: ドラムループ 100BPM。

DELETE FROM public.ear_training_composite_phrase_sources
WHERE config_id IN (
  SELECT id FROM public.ear_training_composite_phrase_config
  WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage')
);
DELETE FROM public.ear_training_composite_phrase_config
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage');
DELETE FROM public.ear_training_phrase_chord_quotes
WHERE phrase_chord_id IN (
  SELECT c.id FROM public.ear_training_phrase_chords c
  JOIN public.ear_training_phrases p ON p.id = c.phrase_id
  WHERE p.stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage')
);
DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.ear_training_phrases
  WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage')
);
DELETE FROM public.ear_training_phrase_notes
WHERE phrase_id IN (
  SELECT id FROM public.ear_training_phrases
  WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage')
);
DELETE FROM public.ear_training_phrases
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage');

UPDATE public.ear_training_stages
SET
  slug = 'mq-b5-6-9-composite',
  title = '複合フレーズ',
  title_en = 'Composite phrases',
  description = '課題1–5の5フレーズを耳コピ複合フレーズで通す。',
  description_en = 'Play phrases I–V as an ear-training composite phrase battle.',
  bpm = 100,
  key_fifths = -1,
  beats_per_measure = 4,
  beat_type = 4,
  loop_measures = 1,
  max_loops_per_phrase = 16,
  count_in_beats = 0,
  time_limit_sec = 600,
  player_hp = 100,
  enemy_hp = 150,
  per_correct_note_damage = 50,
  good_completion_damage = 0,
  great_completion_damage = 0,
  perfect_completion_damage = 0,
  miss_damage = 8,
  fail_damage = 12,
  mode = 'chord_voicing',
  chord_voicing_self_paced = true,
  chord_voicing_composite_phrase = true,
  show_keyboard_hints_in_battle = true,
  hide_chord_names_in_battle = true,
  osmd_targets_from_score = false,
  is_swing = false,
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage');

INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en,
  music_xml_url, audio_url, loop_duration_sec, audio_duration_sec, note_count, key_fifths
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage'),
    0, 'フレーズ I', 'Phrase I',
    NULL, 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3', 2.4, 2.4, 10, -1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage'),
    1, 'フレーズ II', 'Phrase II',
    NULL, 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3', 2.4, 2.4, 7, -1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage'),
    2, 'フレーズ III', 'Phrase III',
    NULL, 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3', 2.4, 2.4, 6, -1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-4'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage'),
    3, 'フレーズ IV', 'Phrase IV',
    NULL, 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3', 2.4, 2.4, 8, -1
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-5'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage'),
    4, 'フレーズ V', 'Phrase V',
    NULL, 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3', 2.4, 2.4, 6, -1
  );

INSERT INTO public.ear_training_phrase_chords (
  id, phrase_id, order_index, chord_name,
  measure_number, beat_offset, duration_beats,
  start_time_sec, end_time_sec, voicing, voicing_staves
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-c-1'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-1'),
    0, '', 1, 1, 4, 0, 2.4,
    ARRAY['B4', 'C5', 'F5', 'Eb5', 'C5', 'B4', 'Bb4', 'Ab4', 'F4', 'Eb4']::text[],
    ARRAY[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-c-2'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-2'),
    0, '', 1, 1, 4, 0, 2.4,
    ARRAY['Ab4', 'D5', 'Bb4', 'Ab4', 'F4', 'Ab4', 'D5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-c-3'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-3'),
    0, '', 1, 1, 4, 0, 2.4,
    ARRAY['F4', 'Bb4', 'D5', 'B4', 'Bb4', 'D5']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-c-4'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-4'),
    0, '', 1, 1, 4, 0, 2.4,
    ARRAY['C5', 'F5', 'Eb5', 'C5', 'B4', 'Bb4', 'Ab4', 'F4']::text[],
    ARRAY[1, 1, 1, 1, 1, 1, 1, 1]::smallint[]
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-c-5'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-5'),
    0, '', 1, 1, 4, 0, 2.4,
    ARRAY['B4', 'C5', 'B4', 'Bb4', 'Ab4', 'F4']::text[],
    ARRAY[1, 1, 1, 1, 1, 1]::smallint[]
  );

INSERT INTO public.ear_training_composite_phrase_config (stage_id, bgm_url, key_fifths)
VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage'),
  'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_Drum.mp3',
  -1
);

INSERT INTO public.ear_training_composite_phrase_sources (config_id, source_phrase_id, sort_order)
SELECT c.id, s.pid, s.ord
FROM public.ear_training_composite_phrase_config c
CROSS JOIN (VALUES
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-1'), 0),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-2'), 1),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-3'), 2),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-4'), 3),
  (uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-ph-5'), 4)
) AS s(pid, ord)
WHERE c.stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-6-9-stage');

UPDATE public.lesson_songs
SET
  title = '9-6. 複合フレーズ',
  title_en = '9-6. Composite phrases'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-6-lsong');

UPDATE public.lessons
SET
  description = '5つの1小節フレーズを覚え、最後は複合フレーズバトル。',
  description_en = 'Five one-bar phrases, then a composite phrase battle.',
  assignment_description = 'フレーズを覚え、複合フレーズバトルで仕上げましょう。',
  assignment_description_en = 'Learn the phrases, then finish with the composite phrase battle.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q9-lesson');
