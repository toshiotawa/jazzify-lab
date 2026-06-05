-- 音符の読み方コース: 3音→5音化パッチ（32レッスン）
BEGIN;

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q3');
DELETE FROM public.lessons WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b2-q3');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q3');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q4');
DELETE FROM public.lessons WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b2-q4');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q4');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q3');
DELETE FROM public.lessons WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b3-q3');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q3');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q4');
DELETE FROM public.lessons WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b3-q4');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q4');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q3');
DELETE FROM public.lessons WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q3');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q3');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q4');
DELETE FROM public.lessons WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q4');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q4');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q3');
DELETE FROM public.lessons WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q3');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q3');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q4');
DELETE FROM public.lessons WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q4');
DELETE FROM public.ear_training_stages WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q4');

UPDATE public.lessons SET
  title = 'ミファソラシ',
  title_en = 'E F G A B',
  description = 'ト音記号・五線の中。ミからシまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Treble clef, notes on the staff: E through B.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 0,
  block_number = 1,
  block_name = '五線の中の音符（ト音記号）',
  block_name_en = 'Treble clef: notes on the staff',
  block_description = 'ト音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn treble-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ミファソラシ',
  title_en = 'Sight-reading quiz: E F G A B',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q1'),
  0, 1, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q1'),
  1, 2, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q1'),
  2, 3, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q1'),
  3, 4, 1, 4,
  'A4',
  ARRAY['A4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q1'),
  4, 5, 1, 4,
  'B4',
  ARRAY['B4']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'ファソラシド',
  title_en = 'F G A B C',
  description = 'ト音記号・五線の中。ファからドまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Treble clef, notes on the staff: F through C.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 1,
  block_number = 1,
  block_name = '五線の中の音符（ト音記号）',
  block_name_en = 'Treble clef: notes on the staff',
  block_description = 'ト音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn treble-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q2');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q2')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ファソラシド',
  title_en = 'Sight-reading quiz: F G A B C',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q2');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q2');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q2'),
  0, 1, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q2'),
  1, 2, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q2'),
  2, 3, 1, 4,
  'A4',
  ARRAY['A4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q2'),
  3, 4, 1, 4,
  'B4',
  ARRAY['B4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q2'),
  4, 5, 1, 4,
  'C5',
  ARRAY['C5']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'ソラシドレ',
  title_en = 'G A B C D',
  description = 'ト音記号・五線の中。ソからレまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Treble clef, notes on the staff: G through D.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 2,
  block_number = 1,
  block_name = '五線の中の音符（ト音記号）',
  block_name_en = 'Treble clef: notes on the staff',
  block_description = 'ト音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn treble-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q3');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0},{"name":"D5","voicing":[74],"voicing_names":["D5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q3')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ソラシドレ',
  title_en = 'Sight-reading quiz: G A B C D',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q3');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q3');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q3-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q3'),
  0, 1, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q3-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q3'),
  1, 2, 1, 4,
  'A4',
  ARRAY['A4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q3-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q3'),
  2, 3, 1, 4,
  'B4',
  ARRAY['B4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q3-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q3'),
  3, 4, 1, 4,
  'C5',
  ARRAY['C5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q3-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q3'),
  4, 5, 1, 4,
  'D5',
  ARRAY['D5']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'ラシドレミ',
  title_en = 'A B C D E',
  description = 'ト音記号・五線の中。ラからミまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Treble clef, notes on the staff: A through E.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 3,
  block_number = 1,
  block_name = '五線の中の音符（ト音記号）',
  block_name_en = 'Treble clef: notes on the staff',
  block_description = 'ト音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn treble-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q4');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0},{"name":"D5","voicing":[74],"voicing_names":["D5"],"voicing_staves":[1],"key_fifths":0},{"name":"E5","voicing":[76],"voicing_names":["E5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q4')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ラシドレミ',
  title_en = 'Sight-reading quiz: A B C D E',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q4');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q4');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q4-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q4'),
  0, 1, 1, 4,
  'A4',
  ARRAY['A4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q4-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q4'),
  1, 2, 1, 4,
  'B4',
  ARRAY['B4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q4-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q4'),
  2, 3, 1, 4,
  'C5',
  ARRAY['C5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q4-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q4'),
  3, 4, 1, 4,
  'D5',
  ARRAY['D5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q4-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q4'),
  4, 5, 1, 4,
  'E5',
  ARRAY['E5']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'まとめ（全て）',
  title_en = 'Review (all)',
  description = 'ト音記号・五線の中の音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all treble-clef notes within the staff.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 4,
  block_number = 1,
  block_name = '五線の中の音符（ト音記号）',
  block_name_en = 'Treble clef: notes on the staff',
  block_description = 'ト音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn treble-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q5');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0},{"name":"D5","voicing":[74],"voicing_names":["D5"],"voicing_staves":[1],"key_fifths":0},{"name":"E5","voicing":[76],"voicing_names":["E5"],"voicing_staves":[1],"key_fifths":0},{"name":"F5","voicing":[77],"voicing_names":["F5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b1-q5')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: まとめ（全て）',
  title_en = 'Sight-reading quiz: Review (all)',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q5-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5'),
  0, 1, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q5-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5'),
  1, 2, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q5-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5'),
  2, 3, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q5-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5'),
  3, 4, 1, 4,
  'A4',
  ARRAY['A4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q5-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5'),
  4, 5, 1, 4,
  'B4',
  ARRAY['B4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q5-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5'),
  5, 6, 1, 4,
  'C5',
  ARRAY['C5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q5-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5'),
  6, 7, 1, 4,
  'D5',
  ARRAY['D5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q5-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5'),
  7, 8, 1, 4,
  'E5',
  ARRAY['E5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b1-q5-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b1-q5'),
  8, 9, 1, 4,
  'F5',
  ARRAY['F5']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'ソラシドレ',
  title_en = 'G A B C D',
  description = 'ト音記号・上加線。ソからレまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Treble clef, upper ledger lines: G through D.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 5,
  block_number = 2,
  block_name = '五線の上加線（ト音記号）',
  block_name_en = 'Treble clef: upper ledger lines',
  block_description = '五線の上にある加線の音符を読みましょう。',
  block_description_en = 'Read notes on upper ledger lines above the treble staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b2-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"G5","voicing":[79],"voicing_names":["G5"],"voicing_staves":[1],"key_fifths":0},{"name":"A5","voicing":[81],"voicing_names":["A5"],"voicing_staves":[1],"key_fifths":0},{"name":"B5","voicing":[83],"voicing_names":["B5"],"voicing_staves":[1],"key_fifths":0},{"name":"C6","voicing":[84],"voicing_names":["C6"],"voicing_staves":[1],"key_fifths":0},{"name":"D6","voicing":[86],"voicing_names":["D6"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b2-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ソラシドレ',
  title_en = 'Sight-reading quiz: G A B C D',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q1'),
  0, 1, 1, 4,
  'G5',
  ARRAY['G5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q1'),
  1, 2, 1, 4,
  'A5',
  ARRAY['A5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q1'),
  2, 3, 1, 4,
  'B5',
  ARRAY['B5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q1'),
  3, 4, 1, 4,
  'C6',
  ARRAY['C6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q1'),
  4, 5, 1, 4,
  'D6',
  ARRAY['D6']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'ラシドレミ',
  title_en = 'A B C D E',
  description = 'ト音記号・上加線。ラからミまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Treble clef, upper ledger lines: A through E.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 6,
  block_number = 2,
  block_name = '五線の上加線（ト音記号）',
  block_name_en = 'Treble clef: upper ledger lines',
  block_description = '五線の上にある加線の音符を読みましょう。',
  block_description_en = 'Read notes on upper ledger lines above the treble staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b2-q2');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"A5","voicing":[81],"voicing_names":["A5"],"voicing_staves":[1],"key_fifths":0},{"name":"B5","voicing":[83],"voicing_names":["B5"],"voicing_staves":[1],"key_fifths":0},{"name":"C6","voicing":[84],"voicing_names":["C6"],"voicing_staves":[1],"key_fifths":0},{"name":"D6","voicing":[86],"voicing_names":["D6"],"voicing_staves":[1],"key_fifths":0},{"name":"E6","voicing":[88],"voicing_names":["E6"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b2-q2')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ラシドレミ',
  title_en = 'Sight-reading quiz: A B C D E',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q2');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q2');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q2'),
  0, 1, 1, 4,
  'A5',
  ARRAY['A5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q2'),
  1, 2, 1, 4,
  'B5',
  ARRAY['B5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q2'),
  2, 3, 1, 4,
  'C6',
  ARRAY['C6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q2'),
  3, 4, 1, 4,
  'D6',
  ARRAY['D6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q2'),
  4, 5, 1, 4,
  'E6',
  ARRAY['E6']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'まとめ（全て）',
  title_en = 'Review (all)',
  description = 'ト音記号・上加線の音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all treble-clef upper-ledger notes.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 7,
  block_number = 2,
  block_name = '五線の上加線（ト音記号）',
  block_name_en = 'Treble clef: upper ledger lines',
  block_description = '五線の上にある加線の音符を読みましょう。',
  block_description_en = 'Read notes on upper ledger lines above the treble staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b2-q5');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"G5","voicing":[79],"voicing_names":["G5"],"voicing_staves":[1],"key_fifths":0},{"name":"A5","voicing":[81],"voicing_names":["A5"],"voicing_staves":[1],"key_fifths":0},{"name":"B5","voicing":[83],"voicing_names":["B5"],"voicing_staves":[1],"key_fifths":0},{"name":"C6","voicing":[84],"voicing_names":["C6"],"voicing_staves":[1],"key_fifths":0},{"name":"D6","voicing":[86],"voicing_names":["D6"],"voicing_staves":[1],"key_fifths":0},{"name":"E6","voicing":[88],"voicing_names":["E6"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b2-q5')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: まとめ（全て）',
  title_en = 'Sight-reading quiz: Review (all)',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q5');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q5');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q5-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q5'),
  0, 1, 1, 4,
  'G5',
  ARRAY['G5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q5-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q5'),
  1, 2, 1, 4,
  'A5',
  ARRAY['A5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q5-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q5'),
  2, 3, 1, 4,
  'B5',
  ARRAY['B5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q5-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q5'),
  3, 4, 1, 4,
  'C6',
  ARRAY['C6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q5-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q5'),
  4, 5, 1, 4,
  'D6',
  ARRAY['D6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b2-q5-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b2-q5'),
  5, 6, 1, 4,
  'E6',
  ARRAY['E6']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'ファソラシド',
  title_en = 'F G A B C',
  description = 'ト音記号・下加線。ファからドまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Treble clef, lower ledger lines: F through C.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 8,
  block_number = 3,
  block_name = '五線の下加線（ト音記号）',
  block_name_en = 'Treble clef: lower ledger lines',
  block_description = '五線の下にある加線の音符を読みましょう。',
  block_description_en = 'Read notes on lower ledger lines below the treble staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b3-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[1],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[1],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[1],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[1],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b3-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ファソラシド',
  title_en = 'Sight-reading quiz: F G A B C',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q1'),
  0, 1, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q1'),
  1, 2, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q1'),
  2, 3, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q1'),
  3, 4, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q1'),
  4, 5, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'ソラシドレ',
  title_en = 'G A B C D',
  description = 'ト音記号・下加線。ソからレまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Treble clef, lower ledger lines: G through D.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 9,
  block_number = 3,
  block_name = '五線の下加線（ト音記号）',
  block_name_en = 'Treble clef: lower ledger lines',
  block_description = '五線の下にある加線の音符を読みましょう。',
  block_description_en = 'Read notes on lower ledger lines below the treble staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b3-q2');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[1],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[1],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[1],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b3-q2')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ソラシドレ',
  title_en = 'Sight-reading quiz: G A B C D',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q2');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q2');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q2'),
  0, 1, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q2'),
  1, 2, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q2'),
  2, 3, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q2'),
  3, 4, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q2'),
  4, 5, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'まとめ（全て）',
  title_en = 'Review (all)',
  description = 'ト音記号・下加線の音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all treble-clef lower-ledger notes.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 10,
  block_number = 3,
  block_name = '五線の下加線（ト音記号）',
  block_name_en = 'Treble clef: lower ledger lines',
  block_description = '五線の下にある加線の音符を読みましょう。',
  block_description_en = 'Read notes on lower ledger lines below the treble staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b3-q5');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[1],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[1],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[1],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[1],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b3-q5')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: まとめ（全て）',
  title_en = 'Sight-reading quiz: Review (all)',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q5');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q5');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q5-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q5'),
  0, 1, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q5-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q5'),
  1, 2, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q5-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q5'),
  2, 3, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q5-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q5'),
  3, 4, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q5-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q5'),
  4, 5, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b3-q5-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b3-q5'),
  5, 6, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'ト音記号 総合まとめ',
  title_en = 'Treble clef review',
  description = '五線の中・上加線・下加線のト音記号音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all treble-clef notes: staff, upper ledger, and lower ledger.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 11,
  block_number = 4,
  block_name = 'ト音記号 総合まとめ',
  block_name_en = 'Treble clef review',
  block_description = 'ト音記号の五線・上加線・下加線を総復習します。',
  block_description_en = 'Review all treble-clef staff and ledger-line notes.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b4-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0},{"name":"D5","voicing":[74],"voicing_names":["D5"],"voicing_staves":[1],"key_fifths":0},{"name":"E5","voicing":[76],"voicing_names":["E5"],"voicing_staves":[1],"key_fifths":0},{"name":"G5","voicing":[79],"voicing_names":["G5"],"voicing_staves":[1],"key_fifths":0},{"name":"A5","voicing":[81],"voicing_names":["A5"],"voicing_staves":[1],"key_fifths":0},{"name":"B5","voicing":[83],"voicing_names":["B5"],"voicing_staves":[1],"key_fifths":0},{"name":"C6","voicing":[84],"voicing_names":["C6"],"voicing_staves":[1],"key_fifths":0},{"name":"D6","voicing":[86],"voicing_names":["D6"],"voicing_staves":[1],"key_fifths":0},{"name":"E6","voicing":[88],"voicing_names":["E6"],"voicing_staves":[1],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[1],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[1],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[1],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[1],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b4-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ト音記号 総合まとめ',
  title_en = 'Sight-reading quiz: Treble clef review',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  0, 1, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  1, 2, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  2, 3, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  3, 4, 1, 4,
  'A4',
  ARRAY['A4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  4, 5, 1, 4,
  'B4',
  ARRAY['B4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  5, 6, 1, 4,
  'C5',
  ARRAY['C5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  6, 7, 1, 4,
  'D5',
  ARRAY['D5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  7, 8, 1, 4,
  'E5',
  ARRAY['E5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  8, 9, 1, 4,
  'G5',
  ARRAY['G5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  9, 10, 1, 4,
  'A5',
  ARRAY['A5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  10, 11, 1, 4,
  'B5',
  ARRAY['B5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  11, 12, 1, 4,
  'C6',
  ARRAY['C6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  12, 13, 1, 4,
  'D6',
  ARRAY['D6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  13, 14, 1, 4,
  'E6',
  ARRAY['E6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  14, 15, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  15, 16, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  16, 17, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  17, 18, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  18, 19, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b4-q1-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b4-q1'),
  19, 20, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = 'ソラシドレ',
  title_en = 'G A B C D',
  description = 'ヘ音記号・五線の中。ソからレまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Bass clef, notes on the staff: G through D.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 12,
  block_number = 5,
  block_name = '五線の中の音符（ヘ音記号）',
  block_name_en = 'Bass clef: notes on the staff',
  block_description = 'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn bass-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ソラシドレ',
  title_en = 'Sight-reading quiz: G A B C D',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  0, 1, 1, 4,
  'G2',
  ARRAY['G2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  1, 2, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  2, 3, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  3, 4, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q1'),
  4, 5, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'ラシドレミ',
  title_en = 'A B C D E',
  description = 'ヘ音記号・五線の中。ラからミまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Bass clef, notes on the staff: A through E.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 13,
  block_number = 5,
  block_name = '五線の中の音符（ヘ音記号）',
  block_name_en = 'Bass clef: notes on the staff',
  block_description = 'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn bass-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q2');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q2')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ラシドレミ',
  title_en = 'Sight-reading quiz: A B C D E',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  0, 1, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  1, 2, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  2, 3, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  3, 4, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q2'),
  4, 5, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'シドレミファ',
  title_en = 'B C D E F',
  description = 'ヘ音記号・五線の中。シからファまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Bass clef, notes on the staff: B through F.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 14,
  block_number = 5,
  block_name = '五線の中の音符（ヘ音記号）',
  block_name_en = 'Bass clef: notes on the staff',
  block_description = 'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn bass-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q3');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q3')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: シドレミファ',
  title_en = 'Sight-reading quiz: B C D E F',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  0, 1, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  1, 2, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  2, 3, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  3, 4, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q3-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q3'),
  4, 5, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'ドレミファソ',
  title_en = 'C D E F G',
  description = 'ヘ音記号・五線の中。ドからソまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Bass clef, notes on the staff: C through G.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 15,
  block_number = 5,
  block_name = '五線の中の音符（ヘ音記号）',
  block_name_en = 'Bass clef: notes on the staff',
  block_description = 'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn bass-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q4');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q4')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ドレミファソ',
  title_en = 'Sight-reading quiz: C D E F G',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  0, 1, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  1, 2, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  2, 3, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  3, 4, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q4-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q4'),
  4, 5, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'まとめ（全て）',
  title_en = 'Review (all)',
  description = 'ヘ音記号・五線の中の音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all bass-clef notes within the staff.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 16,
  block_number = 5,
  block_name = '五線の中の音符（ヘ音記号）',
  block_name_en = 'Bass clef: notes on the staff',
  block_description = 'ヘ音記号の五線の中の音符を、5音ずつ覚えていきます。',
  block_description_en = 'Learn bass-clef notes on the staff, five at a time.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q5');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b5-q5')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: まとめ（全て）',
  title_en = 'Sight-reading quiz: Review (all)',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  0, 1, 1, 4,
  'G2',
  ARRAY['G2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  1, 2, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  2, 3, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  3, 4, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  4, 5, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  5, 6, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  6, 7, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  7, 8, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b5-q5-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b5-q5'),
  8, 9, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'ラシドレミ',
  title_en = 'A B C D E',
  description = 'ヘ音記号・下加線。ラからミまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Bass clef, lower ledger lines: A through E.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 17,
  block_number = 6,
  block_name = '五線の下加線（ヘ音記号）',
  block_name_en = 'Bass clef: lower ledger lines',
  block_description = 'ヘ音記号・五線の下の加線音符を読みましょう。',
  block_description_en = 'Read notes on lower ledger lines below the bass staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ラシドレミ',
  title_en = 'Sight-reading quiz: A B C D E',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  0, 1, 1, 4,
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  1, 2, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  2, 3, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  3, 4, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q1'),
  4, 5, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'シドレミファ',
  title_en = 'B C D E F',
  description = 'ヘ音記号・下加線。シからファまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Bass clef, lower ledger lines: B through F.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 18,
  block_number = 6,
  block_name = '五線の下加線（ヘ音記号）',
  block_name_en = 'Bass clef: lower ledger lines',
  block_description = 'ヘ音記号・五線の下の加線音符を読みましょう。',
  block_description_en = 'Read notes on lower ledger lines below the bass staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q2');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q2')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: シドレミファ',
  title_en = 'Sight-reading quiz: B C D E F',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  0, 1, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  1, 2, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  2, 3, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  3, 4, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q2'),
  4, 5, 1, 4,
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'まとめ（全て）',
  title_en = 'Review (all)',
  description = 'ヘ音記号・下加線の音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all bass-clef lower-ledger notes.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 19,
  block_number = 6,
  block_name = '五線の下加線（ヘ音記号）',
  block_name_en = 'Bass clef: lower ledger lines',
  block_description = 'ヘ音記号・五線の下の加線音符を読みましょう。',
  block_description_en = 'Read notes on lower ledger lines below the bass staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q5');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b6-q5')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: まとめ（全て）',
  title_en = 'Sight-reading quiz: Review (all)',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  0, 1, 1, 4,
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  1, 2, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  2, 3, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  3, 4, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  4, 5, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b6-q5-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b6-q5'),
  5, 6, 1, 4,
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'シドレミファ',
  title_en = 'B C D E F',
  description = 'ヘ音記号・上加線。シからファまでの5音です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Bass clef, upper ledger lines: B through F.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 20,
  block_number = 7,
  block_name = '五線の上加線（ヘ音記号）',
  block_name_en = 'Bass clef: upper ledger lines',
  block_description = 'ヘ音記号・五線の上の加線音符を読みましょう。',
  block_description_en = 'Read notes on upper ledger lines above the bass staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: シドレミファ',
  title_en = 'Sight-reading quiz: B C D E F',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  0, 1, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  1, 2, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  2, 3, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  3, 4, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q1'),
  4, 5, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'ドレミファソ',
  title_en = 'C D E F G',
  description = 'ヘ音記号・上加線。ドからソまで読みましょう。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Bass clef, upper ledger lines: C through G.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 21,
  block_number = 7,
  block_name = '五線の上加線（ヘ音記号）',
  block_name_en = 'Bass clef: upper ledger lines',
  block_description = 'ヘ音記号・五線の上の加線音符を読みましょう。',
  block_description_en = 'Read notes on upper ledger lines above the bass staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q2');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q2')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ドレミファソ',
  title_en = 'Sight-reading quiz: C D E F G',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  0, 1, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  1, 2, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  2, 3, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  3, 4, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q2'),
  4, 5, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'まとめ（全て）',
  title_en = 'Review (all)',
  description = 'ヘ音記号・上加線の音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all bass-clef upper-ledger notes.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 22,
  block_number = 7,
  block_name = '五線の上加線（ヘ音記号）',
  block_name_en = 'Bass clef: upper ledger lines',
  block_description = 'ヘ音記号・五線の上の加線音符を読みましょう。',
  block_description_en = 'Read notes on upper ledger lines above the bass staff.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q5');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b7-q5')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: まとめ（全て）',
  title_en = 'Sight-reading quiz: Review (all)',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  0, 1, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  1, 2, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  2, 3, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  3, 4, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  4, 5, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b7-q5-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b7-q5'),
  5, 6, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'ヘ音記号 総合まとめ',
  title_en = 'Bass clef review',
  description = '五線の中・下加線・上加線のヘ音記号音符をすべて復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all bass-clef notes: staff, lower ledger, and upper ledger.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 23,
  block_number = 8,
  block_name = 'ヘ音記号 総合まとめ',
  block_name_en = 'Bass clef review',
  block_description = 'ヘ音記号の五線・下加線・上加線を総復習します。',
  block_description_en = 'Review all bass-clef staff and ledger-line notes.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b8-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b8-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: ヘ音記号 総合まとめ',
  title_en = 'Sight-reading quiz: Bass clef review',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  0, 1, 1, 4,
  'G2',
  ARRAY['G2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  1, 2, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  2, 3, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  3, 4, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  4, 5, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  5, 6, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  6, 7, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  7, 8, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  8, 9, 1, 4,
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  9, 10, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  10, 11, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  11, 12, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  12, 13, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  13, 14, 1, 4,
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  14, 15, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  15, 16, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  16, 17, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  17, 18, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  18, 19, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b8-q1-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b8-q1'),
  19, 20, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = '大譜表まとめ',
  title_en = 'Grand staff review',
  description = '中央のドを中心に、ト音記号とヘ音記号がランダムに出題されます。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Random mix of treble and bass clef notes centered on middle C.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 24,
  block_number = 9,
  block_name = '大譜表まとめ',
  block_name_en = 'Grand staff review',
  block_description = '中央のドを中心にト音とヘ音が混ざって出題されます。',
  block_description_en = 'Mixed treble and bass clef notes centered on middle C.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b9-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b9-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: 大譜表まとめ',
  title_en = 'Sight-reading quiz: Grand staff review',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  0, 1, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  1, 2, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  2, 3, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  3, 4, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  4, 5, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  5, 6, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  6, 7, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b9-q1-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b9-q1'),
  7, 8, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = '五線の中（ト音）＋♯',
  title_en = 'Treble staff + sharps',
  description = 'ト音記号・五線の中のシャープ（♯）付き音符です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Sharps on the treble staff within the five lines.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 25,
  block_number = 10,
  block_name = '臨時記号（シャープ ♯）',
  block_name_en = 'Accidentals: sharps',
  block_description = '五線の中のシャープ（♯）付き音符を読みましょう。',
  block_description_en = 'Read sharps on the treble and bass staves.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"A#4","voicing":[70],"voicing_names":["A#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: 五線の中（ト音）＋♯',
  title_en = 'Sight-reading quiz: Treble staff + sharps',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  0, 1, 1, 4,
  'F#4',
  ARRAY['F#4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  1, 2, 1, 4,
  'G#4',
  ARRAY['G#4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  2, 3, 1, 4,
  'A#4',
  ARRAY['A#4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  3, 4, 1, 4,
  'C#5',
  ARRAY['C#5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q1'),
  4, 5, 1, 4,
  'D#5',
  ARRAY['D#5']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = '五線の中（ヘ音）＋♯',
  title_en = 'Bass staff + sharps',
  description = 'ヘ音記号・五線の中のシャープ（♯）付き音符です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Sharps on the bass staff within the five lines.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 26,
  block_number = 10,
  block_name = '臨時記号（シャープ ♯）',
  block_name_en = 'Accidentals: sharps',
  block_description = '五線の中のシャープ（♯）付き音符を読みましょう。',
  block_description_en = 'Read sharps on the treble and bass staves.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q2');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"A#2","voicing":[46],"voicing_names":["A#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q2')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: 五線の中（ヘ音）＋♯',
  title_en = 'Sight-reading quiz: Bass staff + sharps',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  0, 1, 1, 4,
  'F#2',
  ARRAY['F#2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  1, 2, 1, 4,
  'G#2',
  ARRAY['G#2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  2, 3, 1, 4,
  'A#2',
  ARRAY['A#2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  3, 4, 1, 4,
  'C#3',
  ARRAY['C#3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q2'),
  4, 5, 1, 4,
  'D#3',
  ARRAY['D#3']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'まとめ（全て＋♯）',
  title_en = 'Review (all + sharps)',
  description = 'ト音・ヘ音の五線内シャープ音符を復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all treble and bass sharps within the staff.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 27,
  block_number = 10,
  block_name = '臨時記号（シャープ ♯）',
  block_name_en = 'Accidentals: sharps',
  block_description = '五線の中のシャープ（♯）付き音符を読みましょう。',
  block_description_en = 'Read sharps on the treble and bass staves.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q3');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"A#4","voicing":[70],"voicing_names":["A#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"A#2","voicing":[46],"voicing_names":["A#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b10-q3')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: まとめ（全て＋♯）',
  title_en = 'Sight-reading quiz: Review (all + sharps)',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  0, 1, 1, 4,
  'F#4',
  ARRAY['F#4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  1, 2, 1, 4,
  'G#4',
  ARRAY['G#4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  2, 3, 1, 4,
  'A#4',
  ARRAY['A#4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  3, 4, 1, 4,
  'C#5',
  ARRAY['C#5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  4, 5, 1, 4,
  'D#5',
  ARRAY['D#5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  5, 6, 1, 4,
  'F#2',
  ARRAY['F#2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  6, 7, 1, 4,
  'G#2',
  ARRAY['G#2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  7, 8, 1, 4,
  'A#2',
  ARRAY['A#2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  8, 9, 1, 4,
  'C#3',
  ARRAY['C#3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b10-q3-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b10-q3'),
  9, 10, 1, 4,
  'D#3',
  ARRAY['D#3']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = '五線の中（ト音）＋♭',
  title_en = 'Treble staff + flats',
  description = 'ト音記号・五線の中のフラット（♭）付き音符です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Flats on the treble staff within the five lines.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 28,
  block_number = 11,
  block_name = '臨時記号（フラット ♭）',
  block_name_en = 'Accidentals: flats',
  block_description = '五線の中のフラット（♭）付き音符を読みましょう。',
  block_description_en = 'Read flats on the treble and bass staves.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Gb4","voicing":[66],"voicing_names":["Gb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: 五線の中（ト音）＋♭',
  title_en = 'Sight-reading quiz: Treble staff + flats',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  0, 1, 1, 4,
  'Bb4',
  ARRAY['Bb4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  1, 2, 1, 4,
  'Eb4',
  ARRAY['Eb4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  2, 3, 1, 4,
  'Ab4',
  ARRAY['Ab4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  3, 4, 1, 4,
  'Gb4',
  ARRAY['Gb4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q1'),
  4, 5, 1, 4,
  'Db5',
  ARRAY['Db5']::text[],
  ARRAY[1]::smallint[]
);

UPDATE public.lessons SET
  title = '五線の中（ヘ音）＋♭',
  title_en = 'Bass staff + flats',
  description = 'ヘ音記号・五線の中のフラット（♭）付き音符です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Flats on the bass staff within the five lines.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 29,
  block_number = 11,
  block_name = '臨時記号（フラット ♭）',
  block_name_en = 'Accidentals: flats',
  block_description = '五線の中のフラット（♭）付き音符を読みましょう。',
  block_description_en = 'Read flats on the treble and bass staves.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q2');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Gb2","voicing":[42],"voicing_names":["Gb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q2')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: 五線の中（ヘ音）＋♭',
  title_en = 'Sight-reading quiz: Bass staff + flats',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  0, 1, 1, 4,
  'Bb2',
  ARRAY['Bb2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  1, 2, 1, 4,
  'Eb3',
  ARRAY['Eb3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  2, 3, 1, 4,
  'Ab2',
  ARRAY['Ab2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  3, 4, 1, 4,
  'Gb2',
  ARRAY['Gb2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q2-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q2'),
  4, 5, 1, 4,
  'Db3',
  ARRAY['Db3']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = 'まとめ（全て＋♭）',
  title_en = 'Review (all + flats)',
  description = 'ト音・ヘ音の五線内フラット音符を復習します。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Review all treble and bass flats within the staff.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 30,
  block_number = 11,
  block_name = '臨時記号（フラット ♭）',
  block_name_en = 'Accidentals: flats',
  block_description = '五線の中のフラット（♭）付き音符を読みましょう。',
  block_description_en = 'Read flats on the treble and bass staves.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q3');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Gb4","voicing":[66],"voicing_names":["Gb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Gb2","voicing":[42],"voicing_names":["Gb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b11-q3')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: まとめ（全て＋♭）',
  title_en = 'Sight-reading quiz: Review (all + flats)',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  0, 1, 1, 4,
  'Bb4',
  ARRAY['Bb4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  1, 2, 1, 4,
  'Eb4',
  ARRAY['Eb4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  2, 3, 1, 4,
  'Ab4',
  ARRAY['Ab4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  3, 4, 1, 4,
  'Gb4',
  ARRAY['Gb4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  4, 5, 1, 4,
  'Db5',
  ARRAY['Db5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  5, 6, 1, 4,
  'Bb2',
  ARRAY['Bb2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  6, 7, 1, 4,
  'Eb3',
  ARRAY['Eb3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  7, 8, 1, 4,
  'Ab2',
  ARRAY['Ab2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  8, 9, 1, 4,
  'Gb2',
  ARRAY['Gb2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b11-q3-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b11-q3'),
  9, 10, 1, 4,
  'Db3',
  ARRAY['Db3']::text[],
  ARRAY[2]::smallint[]
);

UPDATE public.lessons SET
  title = '総仕上げ（ファイナル）',
  title_en = 'Final review',
  description = 'ト音・ヘ音・上下加線・臨時記号すべてのランダム総復習です。

このクエストでは、①風船ラッシュ → ②サバイバル → ③バトルモードの順に挑戦します。',
  description_en = 'Final random review: treble, bass, ledger lines, and accidentals.

In this quest: ① Balloon Rush → ② Survival → ③ Battle mode.',
  order_index = 31,
  block_number = 12,
  block_name = '総仕上げ（ファイナル）',
  block_name_en = 'Final review',
  block_description = 'これまで学んだすべての音符をランダムに総復習します。',
  block_description_en = 'Final random review of every note you have learned.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b12-q1');

UPDATE public.lesson_songs SET
  survival_random_chords = '[{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[1],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[1],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[1],"key_fifths":0},{"name":"A4","voicing":[69],"voicing_names":["A4"],"voicing_staves":[1],"key_fifths":0},{"name":"B4","voicing":[71],"voicing_names":["B4"],"voicing_staves":[1],"key_fifths":0},{"name":"C5","voicing":[72],"voicing_names":["C5"],"voicing_staves":[1],"key_fifths":0},{"name":"D5","voicing":[74],"voicing_names":["D5"],"voicing_staves":[1],"key_fifths":0},{"name":"E5","voicing":[76],"voicing_names":["E5"],"voicing_staves":[1],"key_fifths":0},{"name":"G5","voicing":[79],"voicing_names":["G5"],"voicing_staves":[1],"key_fifths":0},{"name":"A5","voicing":[81],"voicing_names":["A5"],"voicing_staves":[1],"key_fifths":0},{"name":"B5","voicing":[83],"voicing_names":["B5"],"voicing_staves":[1],"key_fifths":0},{"name":"C6","voicing":[84],"voicing_names":["C6"],"voicing_staves":[1],"key_fifths":0},{"name":"D6","voicing":[86],"voicing_names":["D6"],"voicing_staves":[1],"key_fifths":0},{"name":"E6","voicing":[88],"voicing_names":["E6"],"voicing_staves":[1],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[1],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[1],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[1],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[1],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[1],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[1],"key_fifths":0},{"name":"G2","voicing":[43],"voicing_names":["G2"],"voicing_staves":[2],"key_fifths":0},{"name":"A2","voicing":[45],"voicing_names":["A2"],"voicing_staves":[2],"key_fifths":0},{"name":"B2","voicing":[47],"voicing_names":["B2"],"voicing_staves":[2],"key_fifths":0},{"name":"C3","voicing":[48],"voicing_names":["C3"],"voicing_staves":[2],"key_fifths":0},{"name":"D3","voicing":[50],"voicing_names":["D3"],"voicing_staves":[2],"key_fifths":0},{"name":"E3","voicing":[52],"voicing_names":["E3"],"voicing_staves":[2],"key_fifths":0},{"name":"F3","voicing":[53],"voicing_names":["F3"],"voicing_staves":[2],"key_fifths":0},{"name":"G3","voicing":[55],"voicing_names":["G3"],"voicing_staves":[2],"key_fifths":0},{"name":"A1","voicing":[33],"voicing_names":["A1"],"voicing_staves":[2],"key_fifths":0},{"name":"B1","voicing":[35],"voicing_names":["B1"],"voicing_staves":[2],"key_fifths":0},{"name":"C2","voicing":[36],"voicing_names":["C2"],"voicing_staves":[2],"key_fifths":0},{"name":"D2","voicing":[38],"voicing_names":["D2"],"voicing_staves":[2],"key_fifths":0},{"name":"E2","voicing":[40],"voicing_names":["E2"],"voicing_staves":[2],"key_fifths":0},{"name":"F2","voicing":[41],"voicing_names":["F2"],"voicing_staves":[2],"key_fifths":0},{"name":"B3","voicing":[59],"voicing_names":["B3"],"voicing_staves":[2],"key_fifths":0},{"name":"C4","voicing":[60],"voicing_names":["C4"],"voicing_staves":[2],"key_fifths":0},{"name":"D4","voicing":[62],"voicing_names":["D4"],"voicing_staves":[2],"key_fifths":0},{"name":"E4","voicing":[64],"voicing_names":["E4"],"voicing_staves":[2],"key_fifths":0},{"name":"F4","voicing":[65],"voicing_names":["F4"],"voicing_staves":[2],"key_fifths":0},{"name":"G4","voicing":[67],"voicing_names":["G4"],"voicing_staves":[2],"key_fifths":0},{"name":"A3","voicing":[57],"voicing_names":["A3"],"voicing_staves":[2],"key_fifths":0},{"name":"F#4","voicing":[66],"voicing_names":["F#4"],"voicing_staves":[1],"key_fifths":0},{"name":"G#4","voicing":[68],"voicing_names":["G#4"],"voicing_staves":[1],"key_fifths":0},{"name":"A#4","voicing":[70],"voicing_names":["A#4"],"voicing_staves":[1],"key_fifths":0},{"name":"C#5","voicing":[73],"voicing_names":["C#5"],"voicing_staves":[1],"key_fifths":0},{"name":"D#5","voicing":[75],"voicing_names":["D#5"],"voicing_staves":[1],"key_fifths":0},{"name":"F#2","voicing":[42],"voicing_names":["F#2"],"voicing_staves":[2],"key_fifths":0},{"name":"G#2","voicing":[44],"voicing_names":["G#2"],"voicing_staves":[2],"key_fifths":0},{"name":"A#2","voicing":[46],"voicing_names":["A#2"],"voicing_staves":[2],"key_fifths":0},{"name":"C#3","voicing":[49],"voicing_names":["C#3"],"voicing_staves":[2],"key_fifths":0},{"name":"D#3","voicing":[51],"voicing_names":["D#3"],"voicing_staves":[2],"key_fifths":0},{"name":"Bb4","voicing":[70],"voicing_names":["Bb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Eb4","voicing":[63],"voicing_names":["Eb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Ab4","voicing":[68],"voicing_names":["Ab4"],"voicing_staves":[1],"key_fifths":0},{"name":"Gb4","voicing":[66],"voicing_names":["Gb4"],"voicing_staves":[1],"key_fifths":0},{"name":"Db5","voicing":[73],"voicing_names":["Db5"],"voicing_staves":[1],"key_fifths":0},{"name":"Bb2","voicing":[46],"voicing_names":["Bb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Eb3","voicing":[51],"voicing_names":["Eb3"],"voicing_staves":[2],"key_fifths":0},{"name":"Ab2","voicing":[44],"voicing_names":["Ab2"],"voicing_staves":[2],"key_fifths":0},{"name":"Gb2","voicing":[42],"voicing_names":["Gb2"],"voicing_staves":[2],"key_fifths":0},{"name":"Db3","voicing":[49],"voicing_names":["Db3"],"voicing_staves":[2],"key_fifths":0}]'::jsonb
WHERE lesson_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-lesson-b12-q1')
  AND (is_balloon_rush = true OR is_survival = true);

UPDATE public.ear_training_stages SET
  title = '譜読みクイズ: 総仕上げ（ファイナル）',
  title_en = 'Sight-reading quiz: Final review',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1');

DELETE FROM public.ear_training_chord_quiz_items WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1');
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  0, 1, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-1'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  1, 2, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-2'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  2, 3, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-3'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  3, 4, 1, 4,
  'A4',
  ARRAY['A4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-4'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  4, 5, 1, 4,
  'B4',
  ARRAY['B4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-5'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  5, 6, 1, 4,
  'C5',
  ARRAY['C5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-6'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  6, 7, 1, 4,
  'D5',
  ARRAY['D5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-7'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  7, 8, 1, 4,
  'E5',
  ARRAY['E5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-8'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  8, 9, 1, 4,
  'G5',
  ARRAY['G5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-9'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  9, 10, 1, 4,
  'A5',
  ARRAY['A5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-10'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  10, 11, 1, 4,
  'B5',
  ARRAY['B5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-11'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  11, 12, 1, 4,
  'C6',
  ARRAY['C6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-12'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  12, 13, 1, 4,
  'D6',
  ARRAY['D6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-13'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  13, 14, 1, 4,
  'E6',
  ARRAY['E6']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-14'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  14, 15, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-15'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  15, 16, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-16'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  16, 17, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-17'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  17, 18, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-18'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  18, 19, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-19'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  19, 20, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-20'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  20, 21, 1, 4,
  'G2',
  ARRAY['G2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-21'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  21, 22, 1, 4,
  'A2',
  ARRAY['A2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-22'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  22, 23, 1, 4,
  'B2',
  ARRAY['B2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-23'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  23, 24, 1, 4,
  'C3',
  ARRAY['C3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-24'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  24, 25, 1, 4,
  'D3',
  ARRAY['D3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-25'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  25, 26, 1, 4,
  'E3',
  ARRAY['E3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-26'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  26, 27, 1, 4,
  'F3',
  ARRAY['F3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-27'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  27, 28, 1, 4,
  'G3',
  ARRAY['G3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-28'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  28, 29, 1, 4,
  'A1',
  ARRAY['A1']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-29'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  29, 30, 1, 4,
  'B1',
  ARRAY['B1']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-30'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  30, 31, 1, 4,
  'C2',
  ARRAY['C2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-31'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  31, 32, 1, 4,
  'D2',
  ARRAY['D2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-32'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  32, 33, 1, 4,
  'E2',
  ARRAY['E2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-33'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  33, 34, 1, 4,
  'F2',
  ARRAY['F2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-34'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  34, 35, 1, 4,
  'B3',
  ARRAY['B3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-35'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  35, 36, 1, 4,
  'C4',
  ARRAY['C4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-36'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  36, 37, 1, 4,
  'D4',
  ARRAY['D4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-37'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  37, 38, 1, 4,
  'E4',
  ARRAY['E4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-38'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  38, 39, 1, 4,
  'F4',
  ARRAY['F4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-39'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  39, 40, 1, 4,
  'G4',
  ARRAY['G4']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-40'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  40, 41, 1, 4,
  'A3',
  ARRAY['A3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-41'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  41, 42, 1, 4,
  'F#4',
  ARRAY['F#4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-42'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  42, 43, 1, 4,
  'G#4',
  ARRAY['G#4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-43'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  43, 44, 1, 4,
  'A#4',
  ARRAY['A#4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-44'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  44, 45, 1, 4,
  'C#5',
  ARRAY['C#5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-45'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  45, 46, 1, 4,
  'D#5',
  ARRAY['D#5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-46'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  46, 47, 1, 4,
  'F#2',
  ARRAY['F#2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-47'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  47, 48, 1, 4,
  'G#2',
  ARRAY['G#2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-48'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  48, 49, 1, 4,
  'A#2',
  ARRAY['A#2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-49'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  49, 50, 1, 4,
  'C#3',
  ARRAY['C#3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-50'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  50, 51, 1, 4,
  'D#3',
  ARRAY['D#3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-51'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  51, 52, 1, 4,
  'Bb4',
  ARRAY['Bb4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-52'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  52, 53, 1, 4,
  'Eb4',
  ARRAY['Eb4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-53'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  53, 54, 1, 4,
  'Ab4',
  ARRAY['Ab4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-54'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  54, 55, 1, 4,
  'Gb4',
  ARRAY['Gb4']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-55'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  55, 56, 1, 4,
  'Db5',
  ARRAY['Db5']::text[],
  ARRAY[1]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-56'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  56, 57, 1, 4,
  'Bb2',
  ARRAY['Bb2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-57'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  57, 58, 1, 4,
  'Eb3',
  ARRAY['Eb3']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-58'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  58, 59, 1, 4,
  'Ab2',
  ARRAY['Ab2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-59'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  59, 60, 1, 4,
  'Gb2',
  ARRAY['Gb2']::text[],
  ARRAY[2]::smallint[]
);
INSERT INTO public.ear_training_chord_quiz_items (
  id, stage_id, order_index, measure_number, beat_offset, duration_beats,
  chord_name, voicing, voicing_staves
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-item-b12-q1-60'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'rn-ear-b12-q1'),
  60, 61, 1, 4,
  'Db3',
  ARRAY['Db3']::text[],
  ARRAY[2]::smallint[]
);

COMMIT;
