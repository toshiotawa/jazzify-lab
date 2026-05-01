BEGIN;

ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS assignment_description_en text;

-- II-V-I phrases 1-5 (C) ear training battle
-- N=128 completion damage: good=24 great=41 perfect=75
-- rounds check: 3*great=999 2*perf=1006 4*good=992

DELETE FROM public.lesson_songs
WHERE id = '573f6350-d425-57bc-b66d-95381c5a6079'::uuid
   OR id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-1-5-ear')
   OR (lesson_id = '21d4cbf1-5f4b-5631-9c87-d521461ef401'::uuid AND ear_training_stage_id = 'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid);

DELETE FROM public.lessons WHERE id = '21d4cbf1-5f4b-5631-9c87-d521461ef401'::uuid;

DELETE FROM public.ear_training_phrase_demo_loops WHERE phrase_id = ANY (ARRAY['0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 'e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 'f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 'ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, '4a30d9e0-e425-521e-8649-468593005756'::uuid]);
DELETE FROM public.ear_training_phrase_notes WHERE phrase_id = ANY (ARRAY['0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 'e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 'f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 'ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, '4a30d9e0-e425-521e-8649-468593005756'::uuid]);
DELETE FROM public.ear_training_phrase_chords WHERE phrase_id = ANY (ARRAY['0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 'e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 'f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 'ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, '4a30d9e0-e425-521e-8649-468593005756'::uuid]);
DELETE FROM public.ear_training_phrases WHERE id = ANY (ARRAY['0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 'e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 'f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 'ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, '4a30d9e0-e425-521e-8649-468593005756'::uuid]);
DELETE FROM public.ear_training_stages WHERE id = 'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid;


INSERT INTO public.ear_training_stages (
  id, slug, title, title_en, description, description_en,
  bpm, beats_per_measure, beat_type, loop_measures, max_loops_per_phrase, count_in_beats,
  time_limit_sec, player_hp, enemy_hp,
  per_correct_note_damage, good_completion_damage, great_completion_damage, perfect_completion_damage,
  miss_damage, fail_damage, perfect_max_misses, great_max_misses,
  background_theme, is_active
) VALUES (
  'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid,
  'ii-v-i-ear-battle-1-5-c',
  'II-V-I フレーズ1-5（C）耳コピバトル',
  'II-V-I phrases 1-5 (C) ear-copy battle',
  'II-V-I進行のフレーズ1-5を、模範演奏とクリックの6ループで聴き取り、同じメロディを入力します。BPM 160。',
  'Practice phrases 1-5 over II-V-I in C: six alternating demo and click loops per phrase at 160 BPM.',
  160, 4, 4, 4, 6, 4,
  510, 100, 1000,
  1, 24, 41, 75,
  2, 10, 0, 2,
  'blue_club', true
);


INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en, music_xml_url, audio_url,
  loop_duration_sec, audio_duration_sec, note_count
) VALUES (
  '0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid,
  'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid,
  0,
  'フレーズ 1',
  'Phrase 1',
  null,
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-ii-v-i-1-5-c-phrase-01.mp3',
  6,
  36,
  18
);

INSERT INTO public.ear_training_phrase_notes (phrase_id, note_index, pitch_midi, pitch_class, note_name, octave, measure_number, beat_offset) VALUES
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 0, 62, 2, 'D4', 4, 1, 1.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 1, 64, 4, 'E4', 4, 1, 1.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 2, 65, 5, 'F4', 4, 1, 2.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 3, 67, 7, 'G4', 4, 1, 2.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 4, 69, 9, 'A4', 4, 1, 3.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 5, 65, 5, 'F4', 4, 1, 3.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 6, 62, 2, 'D4', 4, 1, 4.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 7, 57, 9, 'A3', 3, 1, 4.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 8, 61, 1, 'C#4', 4, 2, 1.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 9, 60, 0, 'C4', 4, 2, 2.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 10, 58, 10, 'A#3', 3, 2, 2.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 11, 59, 11, 'B3', 3, 2, 3.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 12, 67, 7, 'G4', 4, 2, 3.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 13, 65, 5, 'F4', 4, 2, 4.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 14, 64, 4, 'E4', 4, 3, 1.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 15, 55, 7, 'G3', 3, 3, 1.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 16, 56, 8, 'G#3', 3, 3, 2.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 17, 57, 9, 'A3', 3, 3, 2.5);

INSERT INTO public.ear_training_phrase_chords (phrase_id, order_index, chord_name, measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec) VALUES
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 0, 'Dm7', 1, 1.0, 4.0, 0.0, 1.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 1, 'G7', 2, 1.0, 4.0, 1.5, 3.0),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 2, 'CM7', 3, 1.0, 4.0, 3.0, 4.5),
  ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 3, 'A7', 4, 1.0, 4.0, 4.5, 6.0);

INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number) VALUES ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 1), ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 3), ('0a9b2d44-ec98-5da2-b84f-510a59895d67'::uuid, 5);


INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en, music_xml_url, audio_url,
  loop_duration_sec, audio_duration_sec, note_count
) VALUES (
  'e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid,
  'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid,
  1,
  'フレーズ 2',
  'Phrase 2',
  null,
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-ii-v-i-1-5-c-phrase-02.mp3',
  6,
  36,
  29
);

INSERT INTO public.ear_training_phrase_notes (phrase_id, note_index, pitch_midi, pitch_class, note_name, octave, measure_number, beat_offset) VALUES
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 0, 62, 2, 'D4', 4, 1, 1.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 1, 61, 1, 'C#4', 4, 1, 1.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 2, 62, 2, 'D4', 4, 1, 2.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 3, 64, 4, 'E4', 4, 1, 2.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 4, 65, 5, 'F4', 4, 1, 3.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 5, 67, 7, 'G4', 4, 1, 3.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 6, 69, 9, 'A4', 4, 1, 4.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 7, 72, 0, 'C5', 5, 1, 4.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 8, 76, 4, 'E5', 5, 2, 1.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 9, 74, 2, 'D5', 5, 2, 1.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 10, 73, 1, 'C#5', 5, 2, 2.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 11, 71, 11, 'B4', 4, 2, 2.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 12, 70, 10, 'Bb4', 4, 2, 3.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 13, 68, 8, 'Ab4', 4, 2, 3.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 14, 67, 7, 'G4', 4, 2, 4.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 15, 65, 5, 'F4', 4, 2, 4.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 16, 64, 4, 'E4', 4, 3, 1.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 17, 65, 5, 'F4', 4, 3, 2.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 18, 66, 6, 'F#4', 4, 3, 2.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 19, 67, 7, 'G4', 4, 3, 3.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 20, 64, 4, 'E4', 4, 3, 3.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 21, 62, 2, 'D4', 4, 3, 4.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 22, 60, 0, 'C4', 4, 3, 4.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 23, 61, 1, 'C#4', 4, 4, 1.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 24, 64, 4, 'E4', 4, 4, 1.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 25, 67, 7, 'G4', 4, 4, 2.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 26, 70, 10, 'Bb4', 4, 4, 2.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 27, 70, 10, 'Bb4', 4, 4, 3.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 28, 69, 9, 'A4', 4, 4, 4.0);

INSERT INTO public.ear_training_phrase_chords (phrase_id, order_index, chord_name, measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec) VALUES
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 0, 'Dm7', 1, 1.0, 4.0, 0.0, 1.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 1, 'G7', 2, 1.0, 4.0, 1.5, 3.0),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 2, 'CM7', 3, 1.0, 4.0, 3.0, 4.5),
  ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 3, 'A7', 4, 1.0, 4.0, 4.5, 6.0);

INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number) VALUES ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 1), ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 3), ('e18fa243-80f6-5935-8522-debb1fef7b7c'::uuid, 5);


INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en, music_xml_url, audio_url,
  loop_duration_sec, audio_duration_sec, note_count
) VALUES (
  'f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid,
  'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid,
  2,
  'フレーズ 3',
  'Phrase 3',
  null,
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-ii-v-i-1-5-c-phrase-03.mp3',
  6,
  36,
  31
);

INSERT INTO public.ear_training_phrase_notes (phrase_id, note_index, pitch_midi, pitch_class, note_name, octave, measure_number, beat_offset) VALUES
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 0, 62, 2, 'D4', 4, 1, 1.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 1, 64, 4, 'E4', 4, 1, 1.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 2, 65, 5, 'F4', 4, 1, 2.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 3, 66, 6, 'F#4', 4, 1, 2.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 4, 67, 7, 'G4', 4, 1, 3.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 5, 65, 5, 'F4', 4, 1, 3.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 6, 60, 0, 'C4', 4, 1, 4.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 7, 57, 9, 'A3', 3, 1, 4.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 8, 56, 8, 'Ab3', 3, 2, 1.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 9, 64, 4, 'E4', 4, 2, 1.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 10, 59, 11, 'B3', 3, 2, 2.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 11, 62, 2, 'D4', 4, 2, 3.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 12, 59, 11, 'B3', 3, 2, 3.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 13, 60, 0, 'C4', 4, 2, 4.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 14, 64, 4, 'E4', 4, 2, 4.333),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 15, 67, 7, 'G4', 4, 2, 4.667),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 16, 71, 11, 'B4', 4, 3, 1.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 17, 72, 0, 'C5', 5, 3, 1.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 18, 71, 11, 'B4', 4, 3, 2.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 19, 69, 9, 'A4', 4, 3, 2.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 20, 67, 7, 'G4', 4, 3, 3.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 21, 65, 5, 'F4', 4, 3, 3.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 22, 64, 4, 'E4', 4, 3, 4.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 23, 62, 2, 'D4', 4, 3, 4.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 24, 59, 11, 'B3', 3, 4, 1.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 25, 60, 0, 'B#3', 3, 4, 1.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 26, 61, 1, 'C#4', 4, 4, 2.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 27, 64, 4, 'E4', 4, 4, 2.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 28, 67, 7, 'G4', 4, 4, 3.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 29, 70, 10, 'Bb4', 4, 4, 3.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 30, 69, 9, 'A4', 4, 4, 4.0);

INSERT INTO public.ear_training_phrase_chords (phrase_id, order_index, chord_name, measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec) VALUES
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 0, 'Dm7', 1, 1.0, 4.0, 0.0, 1.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 1, 'G7', 2, 1.0, 4.0, 1.5, 3.0),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 2, 'CM7', 3, 1.0, 4.0, 3.0, 4.5),
  ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 3, 'A7', 4, 1.0, 4.0, 4.5, 6.0);

INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number) VALUES ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 1), ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 3), ('f121680a-d32b-5248-9e3f-d383d61cccc2'::uuid, 5);


INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en, music_xml_url, audio_url,
  loop_duration_sec, audio_duration_sec, note_count
) VALUES (
  'ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid,
  'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid,
  3,
  'フレーズ 4',
  'Phrase 4',
  null,
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-ii-v-i-1-5-c-phrase-04.mp3',
  6,
  36,
  28
);

INSERT INTO public.ear_training_phrase_notes (phrase_id, note_index, pitch_midi, pitch_class, note_name, octave, measure_number, beat_offset) VALUES
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 0, 62, 2, 'D4', 4, 1, 1.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 1, 65, 5, 'F4', 4, 1, 1.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 2, 69, 9, 'A4', 4, 1, 2.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 3, 72, 0, 'C5', 5, 1, 2.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 4, 69, 9, 'A4', 4, 1, 3.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 5, 70, 10, 'A#4', 4, 1, 3.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 6, 71, 11, 'B4', 4, 1, 4.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 7, 62, 2, 'D4', 4, 1, 4.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 8, 65, 5, 'F4', 4, 2, 1.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 9, 69, 9, 'A4', 4, 2, 1.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 10, 68, 8, 'Ab4', 4, 2, 2.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 11, 66, 6, 'F#4', 4, 2, 2.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 12, 67, 7, 'G4', 4, 2, 3.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 13, 65, 5, 'F4', 4, 2, 4.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 14, 63, 3, 'D#4', 4, 2, 4.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 15, 64, 4, 'E4', 4, 3, 1.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 16, 67, 7, 'G4', 4, 3, 1.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 17, 71, 11, 'B4', 4, 3, 2.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 18, 74, 2, 'D5', 5, 3, 2.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 19, 71, 11, 'B4', 4, 3, 3.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 20, 72, 0, 'B#4', 4, 3, 3.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 21, 73, 1, 'C#5', 5, 3, 4.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 22, 64, 4, 'E4', 4, 3, 4.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 23, 67, 7, 'G4', 4, 4, 1.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 24, 70, 10, 'Bb4', 4, 4, 1.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 25, 67, 7, 'G4', 4, 4, 2.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 26, 68, 8, 'G#4', 4, 4, 2.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 27, 69, 9, 'A4', 4, 4, 3.0);

INSERT INTO public.ear_training_phrase_chords (phrase_id, order_index, chord_name, measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec) VALUES
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 0, 'Dm7', 1, 1.0, 4.0, 0.0, 1.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 1, 'G7', 2, 1.0, 4.0, 1.5, 3.0),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 2, 'CM7', 3, 1.0, 4.0, 3.0, 4.5),
  ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 3, 'A7', 4, 1.0, 4.0, 4.5, 6.0);

INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number) VALUES ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 1), ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 3), ('ae44caad-f8e1-5180-b1e3-e1c88a94b93e'::uuid, 5);


INSERT INTO public.ear_training_phrases (
  id, stage_id, order_index, title, title_en, music_xml_url, audio_url,
  loop_duration_sec, audio_duration_sec, note_count
) VALUES (
  '4a30d9e0-e425-521e-8649-468593005756'::uuid,
  'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid,
  4,
  'フレーズ 5',
  'Phrase 5',
  null,
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-ii-v-i-1-5-c-phrase-05.mp3',
  6,
  36,
  22
);

INSERT INTO public.ear_training_phrase_notes (phrase_id, note_index, pitch_midi, pitch_class, note_name, octave, measure_number, beat_offset) VALUES
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 0, 62, 2, 'D4', 4, 1, 2.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 1, 64, 4, 'E4', 4, 1, 2.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 2, 65, 5, 'F4', 4, 1, 3.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 3, 67, 7, 'G4', 4, 1, 3.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 4, 69, 9, 'A4', 4, 1, 4.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 5, 72, 0, 'C5', 5, 1, 4.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 6, 71, 11, 'B4', 4, 2, 1.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 7, 67, 7, 'G4', 4, 2, 1.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 8, 70, 10, 'Bb4', 4, 2, 3.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 9, 71, 11, 'Cb5', 5, 2, 3.25),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 10, 70, 10, 'Bb4', 4, 2, 3.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 11, 68, 8, 'Ab4', 4, 2, 3.75),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 12, 63, 3, 'Eb4', 4, 2, 4.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 13, 65, 5, 'F4', 4, 2, 4.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 14, 67, 7, 'G4', 4, 3, 1.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 15, 72, 0, 'C5', 5, 4, 1.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 16, 73, 1, 'Db5', 5, 4, 1.25),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 17, 72, 0, 'C5', 5, 4, 1.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 18, 70, 10, 'Bb4', 4, 4, 1.75),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 19, 67, 7, 'G4', 4, 4, 2.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 20, 68, 8, 'G#4', 4, 4, 2.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 21, 69, 9, 'A4', 4, 4, 3.0);

INSERT INTO public.ear_training_phrase_chords (phrase_id, order_index, chord_name, measure_number, beat_offset, duration_beats, start_time_sec, end_time_sec) VALUES
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 0, 'Dm7', 1, 1.0, 4.0, 0.0, 1.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 1, 'G7', 2, 1.0, 4.0, 1.5, 3.0),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 2, 'CM7', 3, 1.0, 4.0, 3.0, 4.5),
  ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 3, 'A7', 4, 1.0, 4.0, 4.5, 6.0);

INSERT INTO public.ear_training_phrase_demo_loops (phrase_id, loop_number) VALUES ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 1), ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 3), ('4a30d9e0-e425-521e-8649-468593005756'::uuid, 5);


-- 既存レッスン「II-V-I フレーズ 1-5（C）」に耳コピ課題を追加（新規レッスン行は作らない）
UPDATE public.lessons SET
  description =
    '実習: (1) リンク先のファンタジーステージをクリア（ランクC以上・1回）。(2) 耳コピバトルステージを1回クリア（ランクB以上）してください。',
  description_en =
    'Practice: (1) Clear the linked Fantasy stage once (rank C or better). (2) Clear the ear-copy battle stage once (rank B or better).',
  assignment_description = '制限時間内にステージクリアを目指してください。',
  assignment_description_en = 'Aim to clear the stage within the time limit.'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-1-5');

INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, is_survival, survival_stage_number,
  is_ear_training, ear_training_stage_id, title, title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsg-c-1-5-ear'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'lsn-c-1-5'),
  null,
  1,
  '{"count":1,"rank":"B"}'::jsonb,
  false,
  null,
  false,
  null,
  true,
  'd266f9f1-4b0c-5fb7-8468-0362686c38f1'::uuid,
  '課題（耳コピバトル）',
  'Assignment (ear-copy battle)'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
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
