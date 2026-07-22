-- 両手ヴォイシング中級: key_fifths UPSERT 漏れ修正 + phrase chord 時刻丸め + b2-q1 BAB デモ
BEGIN;

UPDATE public.ear_training_stages SET key_fifths = 0, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing');

UPDATE public.ear_training_phrases SET key_fifths = 0, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = -1, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q1-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = -2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing');

UPDATE public.ear_training_phrases SET key_fifths = -2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = -3, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q2-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = -4, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing');

UPDATE public.ear_training_phrases SET key_fifths = -4, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = -5, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q3-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = -6, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing');

UPDATE public.ear_training_phrases SET key_fifths = -6, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = 5, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q4-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = 4, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing');

UPDATE public.ear_training_phrases SET key_fifths = 4, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = 3, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q5-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = 2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing');

UPDATE public.ear_training_phrases SET key_fifths = 2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = 1, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q6-quiz') AND order_index = 5;

UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 5;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 6;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 7;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 8;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 9;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 10;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 11;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 12;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 13;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 14;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 15;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 16;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 17;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 18;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 19;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 20;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 21;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 22;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 23;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 24;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 25;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 26;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 27;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 28;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 29;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 30;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 31;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 32;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 33;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 34;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b1-q7-quiz') AND order_index = 35;

UPDATE public.ear_training_stages SET key_fifths = 0, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing');

UPDATE public.ear_training_phrases SET key_fifths = 0, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = -1, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q1-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = -2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing');

UPDATE public.ear_training_phrases SET key_fifths = -2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = -3, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q2-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = -4, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing');

UPDATE public.ear_training_phrases SET key_fifths = -4, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = -5, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q3-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = -6, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing');

UPDATE public.ear_training_phrases SET key_fifths = -6, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = 5, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q4-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = 4, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing');

UPDATE public.ear_training_phrases SET key_fifths = 4, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = 3, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q5-quiz') AND order_index = 5;

UPDATE public.ear_training_stages SET key_fifths = 2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing');

UPDATE public.ear_training_phrases SET key_fifths = 2, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph0-c3');

UPDATE public.ear_training_phrases SET key_fifths = 1, updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1');

UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 0,
  end_time_sec = 2.4
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1-c0');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 2.4,
  end_time_sec = 4.8
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1-c1');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 4.8,
  end_time_sec = 7.2
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1-c2');
UPDATE public.ear_training_phrase_chords SET
  start_time_sec = 7.2,
  end_time_sec = 9.6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-voicing-ph1-c3');

UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q6-quiz') AND order_index = 5;

UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 0;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 1;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 0, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 2;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 3;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 4;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 5;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 6;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 7;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 8;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 9;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 10;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 11;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 12;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 13;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 14;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 15;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 16;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 17;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 18;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 19;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = -6, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 20;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 21;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 22;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 5, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 23;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 24;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 25;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 4, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 26;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 27;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 28;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 3, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 29;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 30;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 31;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 2, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 32;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 33;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 34;
UPDATE public.ear_training_chord_quiz_items SET key_fifths = 1, updated_at = now()
WHERE stage_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'thvi-b2-q7-quiz') AND order_index = 35;

UPDATE public.survival_tutorial_scripts SET
  script = '{"version":3,"ui":{"hidePlayerHpBar":true,"hideSettingsButton":true,"hideBackButton":true,"hideMidiToggle":true,"showExitButton":true,"playerInvincible":true,"disableEnemyAttacks":true,"keyboardHintsDefault":true},"content":{},"scenes":[{"type":"demo_play","bpm":100,"beatsPerMeasure":4,"keyFifths":0,"audio":{"url_ja":"https://jazzify-cdn.com/sozai/drop2_iivi_aba_demo_100bpm_bgm.mp3","url_en":"https://jazzify-cdn.com/sozai/drop2_iivi_aba_demo_100bpm_bgm_en.mp3","volume":0.28},"introLines":[{"ja":"ブロック2じゃ。同じ Key of C & F でも、形が変わるぞい。","en":"This is Block 2. Same Key of C and F, but the shape changes.","speaker":"jajii"},{"ja":"B-A-B フォーム？","en":"B-A-B form?","speaker":"fai"},{"ja":"そうじゃ。A-B-A とは最低音の並びが違う。Dm7 は F、G7 も F、CM7 は E から始まる。","en":"Yes. Unlike A-B-A, the bottom notes differ. Dm7 starts on F, G7 on F, CM7 on E.","speaker":"jajii"}],"chords":[{"startBeat":0,"durationBeats":4,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":1,"keyFifths":0},{"startBeat":4,"durationBeats":4,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":2,"keyFifths":0},{"startBeat":8,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":3,"keyFifths":0},{"startBeat":12,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":4,"keyFifths":0},{"startBeat":16,"durationBeats":4,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":5,"keyFifths":0},{"startBeat":20,"durationBeats":4,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":6,"keyFifths":0},{"startBeat":24,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":7,"keyFifths":0},{"startBeat":28,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":8,"keyFifths":0},{"startBeat":32,"durationBeats":2,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":9,"keyFifths":0},{"startBeat":34,"durationBeats":2,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":9,"keyFifths":0},{"startBeat":36,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":10,"keyFifths":0},{"startBeat":40,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":11,"keyFifths":0},{"startBeat":44,"durationBeats":2,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":12,"keyFifths":0},{"startBeat":46,"durationBeats":2,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":12,"keyFifths":0},{"startBeat":48,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":13,"keyFifths":0},{"startBeat":52,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":14,"keyFifths":0},{"startBeat":56,"durationBeats":4,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":15,"keyFifths":0},{"startBeat":60,"durationBeats":4,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":16,"keyFifths":0},{"startBeat":64,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":17,"keyFifths":0},{"startBeat":68,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":18,"keyFifths":0},{"startBeat":72,"durationBeats":2,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":19,"keyFifths":0},{"startBeat":74,"durationBeats":2,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":19,"keyFifths":0},{"startBeat":76,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":20,"keyFifths":0},{"startBeat":80,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":21,"keyFifths":0},{"startBeat":84,"durationBeats":4,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":22,"keyFifths":0},{"startBeat":88,"durationBeats":4,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":23,"keyFifths":0},{"startBeat":92,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":24,"keyFifths":0},{"startBeat":96,"durationBeats":4,"chordName":"","voicing":[],"measureNumber":25,"keyFifths":0},{"startBeat":100,"durationBeats":2,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":26,"keyFifths":0},{"startBeat":102,"durationBeats":2,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":26,"keyFifths":0},{"startBeat":104,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":27,"keyFifths":0},{"startBeat":108,"durationBeats":2,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":28,"keyFifths":0},{"startBeat":110,"durationBeats":2,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":28,"keyFifths":0},{"startBeat":112,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":29,"keyFifths":0},{"startBeat":116,"durationBeats":2,"chordName":"Dm7","voicing":[53,60,64,69],"voicingNames":["F3","C4","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":30,"keyFifths":0},{"startBeat":118,"durationBeats":2,"chordName":"G7","voicing":[53,59,64,69],"voicingNames":["F3","B3","E4","A4"],"voicing_staves":[2,1,1,1],"measureNumber":30,"keyFifths":0},{"startBeat":120,"durationBeats":4,"chordName":"CM7","voicing":[52,59,62,67],"voicingNames":["E3","B3","D4","G4"],"voicing_staves":[2,1,1,1],"measureNumber":31,"keyFifths":0}],"lines":[{"ja":"これが B-A-B の Dm7 じゃ。最低音は F3。","en":"This is B-A-B Dm7. The bottom note is F3.","speaker":"jajii","startBeat":0,"durationBeats":4},{"ja":"G7。左手の F はキープ、右手の中の音が動く。","en":"G7. Keep the left-hand F; inner right-hand tones move.","speaker":"jajii","startBeat":4,"durationBeats":4},{"ja":"CM7。左手が半音下がって E になる。","en":"CM7. The left hand drops a half step to E.","speaker":"jajii","startBeat":8,"durationBeats":4},{"ja":"ブロック1の A-B-A と最低音が違うのをよく見るんじゃ。","en":"Notice how the bottom notes differ from Block 1 A-B-A.","speaker":"jajii","startBeat":16,"durationBeats":8},{"ja":"Dm7 → G7 → CM7。この3つを耳と手に覚えろ。","en":"Dm7 to G7 to CM7. Memorize these three with ears and hands.","speaker":"jajii","startBeat":32,"durationBeats":8},{"ja":"もう一度。最低音 F → F → E じゃ。","en":"Again. Bottom notes: F, F, then E.","speaker":"fai","startBeat":56,"durationBeats":8},{"ja":"バトルではこの B-A-B 形で弾くのじゃ。A-B-A と混ぜるなよ。","en":"In battle, play this B-A-B shape. Do not mix it with A-B-A.","speaker":"jajii","startBeat":84,"durationBeats":8},{"ja":"最後にもう一回。形を焼きつけるんじゃ。","en":"One last time. Burn the shape in.","speaker":"jajii","startBeat":100,"durationBeats":8},{"ja":"よし。クイズとバトルで確かめるぞい。","en":"Good. Confirm it in the quiz and battle.","speaker":"jajii","startBeat":116,"durationBeats":4}]},{"type":"finish"}],"finish":{"showCta":true}}'::jsonb,
  updated_at = now()
WHERE id = 'thvi-demo-b2-q1';

COMMIT;
