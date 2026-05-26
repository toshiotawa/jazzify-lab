BEGIN;

-- Survival Phrases stages 1-5 (Dm7): replace placeholder stage 1 and add 2-5
-- MusicXML: 1 measure per stage. BGM: 4 measures @160 BPM per stage (6s each).

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 1 AND 5
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 1 AND 5
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 1 AND 5;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  1,
  'progression',
  'フレーズ I',
  'Phrases I',
  'easy',
  '',
  'Dm7',
  'Dm7',
  NULL,
  NULL,
  NULL,
  'phrases_basic_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE
SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  2,
  'progression',
  'フレーズ II',
  'Phrases II',
  'easy',
  '',
  'Dm7',
  'Dm7',
  NULL,
  NULL,
  NULL,
  'phrases_basic_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE
SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  3,
  'progression',
  'フレーズ III',
  'Phrases III',
  'easy',
  '',
  'Dm7',
  'Dm7',
  NULL,
  NULL,
  NULL,
  'phrases_basic_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE
SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  4,
  'progression',
  'フレーズ IV',
  'Phrases IV',
  'easy',
  '',
  'Dm7',
  'Dm7',
  NULL,
  NULL,
  NULL,
  'phrases_basic_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE
SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  5,
  'progression',
  'フレーズ V',
  'Phrases V',
  'easy',
  '',
  'Dm7',
  'Dm7',
  NULL,
  NULL,
  NULL,
  'phrases_basic_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE
SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  1,
  'Phrases I',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-01.mp3',
  0
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  2,
  'Phrases II',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-02.mp3',
  0
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  3,
  'Phrases III',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-03.mp3',
  0
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  4,
  'Phrases IV',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-04.mp3',
  0
);

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  5,
  'Phrases V',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-dm7-1-5-stage-05.mp3',
  0
);

DO $$
DECLARE
  v_phrase_1 uuid;
  v_chord_1 uuid;
  v_phrase_2 uuid;
  v_chord_2 uuid;
  v_phrase_3 uuid;
  v_chord_3 uuid;
  v_phrase_4 uuid;
  v_chord_4 uuid;
  v_phrase_5 uuid;
  v_chord_5 uuid;
BEGIN
  SELECT id INTO v_phrase_1 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 1;
  SELECT id INTO v_phrase_2 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 2;
  SELECT id INTO v_phrase_3 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 3;
  SELECT id INTO v_phrase_4 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 4;
  SELECT id INTO v_phrase_5 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 5;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_1, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_1, 0, 76, 4, 'E5', 1),
    (v_chord_1, 1, 74, 2, 'D5', 1),
    (v_chord_1, 2, 69, 9, 'A4', 1),
    (v_chord_1, 3, 65, 5, 'F4', 1),
    (v_chord_1, 4, 64, 4, 'E4', 1),
    (v_chord_1, 5, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_2, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_2;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_2, 0, 64, 4, 'E4', 1),
    (v_chord_2, 1, 65, 5, 'F4', 1),
    (v_chord_2, 2, 69, 9, 'A4', 1),
    (v_chord_2, 3, 72, 0, 'C5', 1),
    (v_chord_2, 4, 76, 4, 'E5', 1),
    (v_chord_2, 5, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_3, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_3;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_3, 0, 74, 2, 'D5', 1),
    (v_chord_3, 1, 76, 4, 'E5', 1),
    (v_chord_3, 2, 77, 5, 'F5', 1),
    (v_chord_3, 3, 79, 7, 'G5', 1),
    (v_chord_3, 4, 76, 4, 'E5', 1),
    (v_chord_3, 5, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_4, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_4;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_4, 0, 64, 4, 'E4', 1),
    (v_chord_4, 1, 61, 1, 'C#4', 1),
    (v_chord_4, 2, 62, 2, 'D4', 1),
    (v_chord_4, 3, 64, 4, 'E4', 1),
    (v_chord_4, 4, 65, 5, 'F4', 1),
    (v_chord_4, 5, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_5, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_5;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_5, 0, 69, 9, 'A4', 1),
    (v_chord_5, 1, 65, 5, 'F4', 1),
    (v_chord_5, 2, 64, 4, 'E4', 1),
    (v_chord_5, 3, 62, 2, 'D4', 1),
    (v_chord_5, 4, 67, 7, 'G4', 1),
    (v_chord_5, 5, 65, 5, 'F4', 1);
END $$;

COMMIT;
