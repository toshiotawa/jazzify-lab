BEGIN;

-- Survival Phrases II-V key C: stages 7-42
-- MusicXML: 251譜面_C.musicxml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 7 AND 42
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 7 AND 42;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 7 AND 42
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 7 AND 42
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 7 AND 42;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 7 AND 42;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_c_1', 'II-V in C 1-5', 'II-V in C 1-5', 1)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_c_2', 'II-V in C 6-10', 'II-V in C 6-10', 2)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_c_3', 'II-V in C 11-15', 'II-V in C 11-15', 3)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_c_4', 'II-V in C 16-20', 'II-V in C 16-20', 4)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_c_5', 'II-V in C 21-25', 'II-V in C 21-25', 5)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_c_6', 'II-V in C 26-30', 'II-V in C 26-30', 6)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  7,
  'progression',
  'II-V in C · 1',
  'II-V in C · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  7,
  'II-V in C · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-01.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  8,
  'progression',
  'II-V in C · 2',
  'II-V in C · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  8,
  'II-V in C · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-02.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  9,
  'progression',
  'II-V in C · 3',
  'II-V in C · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  9,
  'II-V in C · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-03.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  10,
  'progression',
  'II-V in C · 4',
  'II-V in C · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  10,
  'II-V in C · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-04.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  11,
  'progression',
  'II-V in C · 5',
  'II-V in C · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  11,
  'II-V in C · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-05.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  12,
  'progression',
  '複合フレーズ · II-V in C 1-5',
  'Composite · II-V in C 1-5',
  'easy',
  '',
  'II-V in C 1-5',
  'II-V in C 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_composite_phrase_stages (map_category, stage_number, boss_type, key_fifths, bgm_url)
VALUES ('phrases', 12, 'B', 0, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  13,
  'progression',
  'II-V in C · 6',
  'II-V in C · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  13,
  'II-V in C · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-06.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  14,
  'progression',
  'II-V in C · 7',
  'II-V in C · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  14,
  'II-V in C · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-07.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  15,
  'progression',
  'II-V in C · 8',
  'II-V in C · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  15,
  'II-V in C · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-08.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  16,
  'progression',
  'II-V in C · 9',
  'II-V in C · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  16,
  'II-V in C · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-09.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  17,
  'progression',
  'II-V in C · 10',
  'II-V in C · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  17,
  'II-V in C · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-10.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  18,
  'progression',
  '複合フレーズ · II-V in C 6-10',
  'Composite · II-V in C 6-10',
  'easy',
  '',
  'II-V in C 6-10',
  'II-V in C 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_composite_phrase_stages (map_category, stage_number, boss_type, key_fifths, bgm_url)
VALUES ('phrases', 18, 'C', 0, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  19,
  'progression',
  'II-V in C · 11',
  'II-V in C · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  19,
  'II-V in C · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-11.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  20,
  'progression',
  'II-V in C · 12',
  'II-V in C · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  20,
  'II-V in C · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-12.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  21,
  'progression',
  'II-V in C · 13',
  'II-V in C · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  21,
  'II-V in C · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-13.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  22,
  'progression',
  'II-V in C · 14',
  'II-V in C · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  22,
  'II-V in C · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-14.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  23,
  'progression',
  'II-V in C · 15',
  'II-V in C · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  23,
  'II-V in C · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-15.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  24,
  'progression',
  '複合フレーズ · II-V in C 11-15',
  'Composite · II-V in C 11-15',
  'easy',
  '',
  'II-V in C 11-15',
  'II-V in C 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_composite_phrase_stages (map_category, stage_number, boss_type, key_fifths, bgm_url)
VALUES ('phrases', 24, 'A', 0, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  25,
  'progression',
  'II-V in C · 16',
  'II-V in C · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  25,
  'II-V in C · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-16.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  26,
  'progression',
  'II-V in C · 17',
  'II-V in C · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  26,
  'II-V in C · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-17.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  27,
  'progression',
  'II-V in C · 18',
  'II-V in C · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  27,
  'II-V in C · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-18.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  28,
  'progression',
  'II-V in C · 19',
  'II-V in C · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  28,
  'II-V in C · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-19.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  29,
  'progression',
  'II-V in C · 20',
  'II-V in C · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  29,
  'II-V in C · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-20.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  30,
  'progression',
  '複合フレーズ · II-V in C 16-20',
  'Composite · II-V in C 16-20',
  'easy',
  '',
  'II-V in C 16-20',
  'II-V in C 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_composite_phrase_stages (map_category, stage_number, boss_type, key_fifths, bgm_url)
VALUES ('phrases', 30, 'B', 0, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  31,
  'progression',
  'II-V in C · 21',
  'II-V in C · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  31,
  'II-V in C · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-21.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  32,
  'progression',
  'II-V in C · 22',
  'II-V in C · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  32,
  'II-V in C · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-22.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  33,
  'progression',
  'II-V in C · 23',
  'II-V in C · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  33,
  'II-V in C · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-23.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  34,
  'progression',
  'II-V in C · 24',
  'II-V in C · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  34,
  'II-V in C · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-24.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  35,
  'progression',
  'II-V in C · 25',
  'II-V in C · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  35,
  'II-V in C · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-25.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  36,
  'progression',
  '複合フレーズ · II-V in C 21-25',
  'Composite · II-V in C 21-25',
  'easy',
  '',
  'II-V in C 21-25',
  'II-V in C 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_composite_phrase_stages (map_category, stage_number, boss_type, key_fifths, bgm_url)
VALUES ('phrases', 36, 'C', 0, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  37,
  'progression',
  'II-V in C · 26',
  'II-V in C · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  37,
  'II-V in C · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-26.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  38,
  'progression',
  'II-V in C · 27',
  'II-V in C · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  38,
  'II-V in C · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-27.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  39,
  'progression',
  'II-V in C · 28',
  'II-V in C · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  39,
  'II-V in C · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-28.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  40,
  'progression',
  'II-V in C · 29',
  'II-V in C · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  40,
  'II-V in C · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-29.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  41,
  'progression',
  'II-V in C · 30',
  'II-V in C · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  41,
  'II-V in C · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-c-30.mp3',
  0
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  42,
  'progression',
  '複合フレーズ · II-V in C 26-30',
  'Composite · II-V in C 26-30',
  'easy',
  '',
  'II-V in C 26-30',
  'II-V in C 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_c_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_composite_phrase_stages (map_category, stage_number, boss_type, key_fifths, bgm_url)
VALUES ('phrases', 42, 'A', 0, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_7 uuid;
  v_chord_7_0 uuid;
  v_chord_7_1 uuid;
  v_phrase_8 uuid;
  v_chord_8_0 uuid;
  v_chord_8_1 uuid;
  v_phrase_9 uuid;
  v_chord_9_0 uuid;
  v_chord_9_1 uuid;
  v_phrase_10 uuid;
  v_chord_10_0 uuid;
  v_chord_10_1 uuid;
  v_phrase_11 uuid;
  v_chord_11_0 uuid;
  v_chord_11_1 uuid;
  v_phrase_13 uuid;
  v_chord_13_0 uuid;
  v_chord_13_1 uuid;
  v_phrase_14 uuid;
  v_chord_14_0 uuid;
  v_chord_14_1 uuid;
  v_phrase_15 uuid;
  v_chord_15_0 uuid;
  v_chord_15_1 uuid;
  v_phrase_16 uuid;
  v_chord_16_0 uuid;
  v_chord_16_1 uuid;
  v_phrase_17 uuid;
  v_chord_17_0 uuid;
  v_chord_17_1 uuid;
  v_phrase_19 uuid;
  v_chord_19_0 uuid;
  v_chord_19_1 uuid;
  v_phrase_20 uuid;
  v_chord_20_0 uuid;
  v_chord_20_1 uuid;
  v_phrase_21 uuid;
  v_chord_21_0 uuid;
  v_chord_21_1 uuid;
  v_phrase_22 uuid;
  v_chord_22_0 uuid;
  v_chord_22_1 uuid;
  v_phrase_23 uuid;
  v_chord_23_0 uuid;
  v_chord_23_1 uuid;
  v_phrase_25 uuid;
  v_chord_25_0 uuid;
  v_chord_25_1 uuid;
  v_phrase_26 uuid;
  v_chord_26_0 uuid;
  v_chord_26_1 uuid;
  v_phrase_27 uuid;
  v_chord_27_0 uuid;
  v_chord_27_1 uuid;
  v_phrase_28 uuid;
  v_chord_28_0 uuid;
  v_chord_28_1 uuid;
  v_phrase_29 uuid;
  v_chord_29_0 uuid;
  v_chord_29_1 uuid;
  v_phrase_31 uuid;
  v_chord_31_0 uuid;
  v_chord_31_1 uuid;
  v_phrase_32 uuid;
  v_chord_32_0 uuid;
  v_chord_32_1 uuid;
  v_phrase_33 uuid;
  v_chord_33_0 uuid;
  v_chord_33_1 uuid;
  v_phrase_34 uuid;
  v_chord_34_0 uuid;
  v_chord_34_1 uuid;
  v_phrase_35 uuid;
  v_chord_35_0 uuid;
  v_chord_35_1 uuid;
  v_phrase_37 uuid;
  v_chord_37_0 uuid;
  v_chord_37_1 uuid;
  v_phrase_38 uuid;
  v_chord_38_0 uuid;
  v_chord_38_1 uuid;
  v_phrase_39 uuid;
  v_chord_39_0 uuid;
  v_chord_39_1 uuid;
  v_phrase_40 uuid;
  v_chord_40_0 uuid;
  v_chord_40_1 uuid;
  v_phrase_41 uuid;
  v_chord_41_0 uuid;
  v_chord_41_1 uuid;
  v_comp_12 uuid;
  v_comp_18 uuid;
  v_comp_24 uuid;
  v_comp_30 uuid;
  v_comp_36 uuid;
  v_comp_42 uuid;
BEGIN
  SELECT id INTO v_phrase_7 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 7;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_7, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_7_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_7_0, 0, 76, 4, 'E5', 1),
    (v_chord_7_0, 1, 72, 0, 'C5', 1),
    (v_chord_7_0, 2, 69, 9, 'A4', 1),
    (v_chord_7_0, 3, 65, 5, 'F4', 1),
    (v_chord_7_0, 4, 69, 9, 'A4', 1),
    (v_chord_7_0, 5, 72, 0, 'C5', 1),
    (v_chord_7_0, 6, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_7, 1, 'G7', 2)
  RETURNING id INTO v_chord_7_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_7_1, 0, 79, 7, 'G5', 1),
    (v_chord_7_1, 1, 77, 5, 'F5', 1),
    (v_chord_7_1, 2, 72, 0, 'C5', 1),
    (v_chord_7_1, 3, 69, 9, 'A4', 1),
    (v_chord_7_1, 4, 76, 4, 'E5', 1),
    (v_chord_7_1, 5, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_8 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 8;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_8, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_8_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_8_0, 0, 63, 3, 'D#4', 1),
    (v_chord_8_0, 1, 64, 4, 'E4', 1),
    (v_chord_8_0, 2, 67, 7, 'G4', 1),
    (v_chord_8_0, 3, 64, 4, 'E4', 1),
    (v_chord_8_0, 4, 65, 5, 'F4', 1),
    (v_chord_8_0, 5, 69, 9, 'A4', 1),
    (v_chord_8_0, 6, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_8, 1, 'G7', 2)
  RETURNING id INTO v_chord_8_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_8_1, 0, 76, 4, 'E5', 1),
    (v_chord_8_1, 1, 74, 2, 'D5', 1),
    (v_chord_8_1, 2, 69, 9, 'A4', 1),
    (v_chord_8_1, 3, 65, 5, 'F4', 1),
    (v_chord_8_1, 4, 64, 4, 'E4', 1),
    (v_chord_8_1, 5, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_9 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 9;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_9, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_9_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_9_0, 0, 62, 2, 'D4', 1),
    (v_chord_9_0, 1, 64, 4, 'E4', 1),
    (v_chord_9_0, 2, 65, 5, 'F4', 1),
    (v_chord_9_0, 3, 67, 7, 'G4', 1),
    (v_chord_9_0, 4, 69, 9, 'A4', 1),
    (v_chord_9_0, 5, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_9, 1, 'G7', 2)
  RETURNING id INTO v_chord_9_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_9_1, 0, 71, 11, 'B4', 1),
    (v_chord_9_1, 1, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_10 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 10;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_10, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_10_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_10_0, 0, 67, 7, 'G4', 1),
    (v_chord_10_0, 1, 65, 5, 'F4', 1),
    (v_chord_10_0, 2, 60, 0, 'C4', 1),
    (v_chord_10_0, 3, 57, 9, 'A3', 1),
    (v_chord_10_0, 4, 64, 4, 'E4', 1),
    (v_chord_10_0, 5, 61, 1, 'C#4', 1),
    (v_chord_10_0, 6, 62, 2, 'D4', 1),
    (v_chord_10_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_10, 1, 'G7', 2)
  RETURNING id INTO v_chord_10_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_10_1, 0, 65, 5, 'F4', 1),
    (v_chord_10_1, 1, 67, 7, 'G4', 1),
    (v_chord_10_1, 2, 69, 9, 'A4', 1),
    (v_chord_10_1, 3, 65, 5, 'F4', 1),
    (v_chord_10_1, 4, 64, 4, 'E4', 1),
    (v_chord_10_1, 5, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_11 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 11;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_11, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_11_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_11_0, 0, 65, 5, 'F4', 1),
    (v_chord_11_0, 1, 67, 7, 'G4', 1),
    (v_chord_11_0, 2, 69, 9, 'A4', 1),
    (v_chord_11_0, 3, 65, 5, 'F4', 1),
    (v_chord_11_0, 4, 64, 4, 'E4', 1),
    (v_chord_11_0, 5, 62, 2, 'D4', 1),
    (v_chord_11_0, 6, 61, 1, 'C#4', 1),
    (v_chord_11_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_11, 1, 'G7', 2)
  RETURNING id INTO v_chord_11_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_11_1, 0, 62, 2, 'D4', 1),
    (v_chord_11_1, 1, 60, 0, 'C4', 1),
    (v_chord_11_1, 2, 58, 10, 'A#3', 1),
    (v_chord_11_1, 3, 59, 11, 'B3', 1),
    (v_chord_11_1, 4, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_13 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 13;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_13, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_13_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_13_0, 0, 62, 2, 'D4', 1),
    (v_chord_13_0, 1, 65, 5, 'F4', 1),
    (v_chord_13_0, 2, 69, 9, 'A4', 1),
    (v_chord_13_0, 3, 72, 0, 'C5', 1),
    (v_chord_13_0, 4, 69, 9, 'A4', 1),
    (v_chord_13_0, 5, 70, 10, 'A#4', 1),
    (v_chord_13_0, 6, 71, 11, 'B4', 1),
    (v_chord_13_0, 7, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_13, 1, 'G7', 2)
  RETURNING id INTO v_chord_13_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_13_1, 0, 65, 5, 'F4', 1),
    (v_chord_13_1, 1, 69, 9, 'A4', 1),
    (v_chord_13_1, 2, 68, 8, 'Ab4', 1),
    (v_chord_13_1, 3, 66, 6, 'F#4', 1),
    (v_chord_13_1, 4, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_14 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 14;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_14, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_14_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_14_0, 0, 62, 2, 'D4', 1),
    (v_chord_14_0, 1, 64, 4, 'E4', 1),
    (v_chord_14_0, 2, 65, 5, 'F4', 1),
    (v_chord_14_0, 3, 67, 7, 'G4', 1),
    (v_chord_14_0, 4, 69, 9, 'A4', 1),
    (v_chord_14_0, 5, 71, 11, 'B4', 1),
    (v_chord_14_0, 6, 72, 0, 'C5', 1),
    (v_chord_14_0, 7, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_14, 1, 'G7', 2)
  RETURNING id INTO v_chord_14_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_14_1, 0, 76, 4, 'E5', 1),
    (v_chord_14_1, 1, 79, 7, 'G5', 1),
    (v_chord_14_1, 2, 77, 5, 'F5', 1),
    (v_chord_14_1, 3, 69, 9, 'A4', 1),
    (v_chord_14_1, 4, 72, 0, 'C5', 1),
    (v_chord_14_1, 5, 76, 4, 'E5', 1),
    (v_chord_14_1, 6, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_15 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 15;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_15, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_15_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_15_0, 0, 64, 4, 'E4', 1),
    (v_chord_15_0, 1, 61, 1, 'C#4', 1),
    (v_chord_15_0, 2, 62, 2, 'D4', 1),
    (v_chord_15_0, 3, 64, 4, 'E4', 1),
    (v_chord_15_0, 4, 65, 5, 'F4', 1),
    (v_chord_15_0, 5, 67, 7, 'G4', 1),
    (v_chord_15_0, 6, 69, 9, 'A4', 1),
    (v_chord_15_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_15, 1, 'G7', 2)
  RETURNING id INTO v_chord_15_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_15_1, 0, 62, 2, 'D4', 1),
    (v_chord_15_1, 1, 60, 0, 'C4', 1),
    (v_chord_15_1, 2, 58, 10, 'A#3', 1),
    (v_chord_15_1, 3, 59, 11, 'B3', 1),
    (v_chord_15_1, 4, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_16 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 16;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_16, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_16_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_16_0, 0, 65, 5, 'F4', 1),
    (v_chord_16_0, 1, 67, 7, 'G4', 1),
    (v_chord_16_0, 2, 69, 9, 'A4', 1),
    (v_chord_16_0, 3, 72, 0, 'C5', 1),
    (v_chord_16_0, 4, 76, 4, 'E5', 1),
    (v_chord_16_0, 5, 77, 5, 'F5', 1),
    (v_chord_16_0, 6, 73, 1, 'C#5', 1),
    (v_chord_16_0, 7, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_16, 1, 'G7', 2)
  RETURNING id INTO v_chord_16_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_16_1, 0, 74, 2, 'D5', 1),
    (v_chord_16_1, 1, 72, 0, 'C5', 1),
    (v_chord_16_1, 2, 69, 9, 'A4', 1),
    (v_chord_16_1, 3, 70, 10, 'A#4', 1),
    (v_chord_16_1, 4, 71, 11, 'B4', 1),
    (v_chord_16_1, 5, 69, 9, 'A4', 1),
    (v_chord_16_1, 6, 67, 7, 'G4', 1),
    (v_chord_16_1, 7, 66, 6, 'Gb4', 1);
  SELECT id INTO v_phrase_17 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 17;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_17, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_17_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_17_0, 0, 71, 11, 'B4', 1),
    (v_chord_17_0, 1, 72, 0, 'C5', 1),
    (v_chord_17_0, 2, 69, 9, 'A4', 1),
    (v_chord_17_0, 3, 65, 5, 'F4', 1),
    (v_chord_17_0, 4, 64, 4, 'E4', 1),
    (v_chord_17_0, 5, 65, 5, 'F4', 1),
    (v_chord_17_0, 6, 69, 9, 'A4', 1),
    (v_chord_17_0, 7, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_17, 1, 'G7', 2)
  RETURNING id INTO v_chord_17_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_17_1, 0, 76, 4, 'E5', 1),
    (v_chord_17_1, 1, 74, 2, 'D5', 1),
    (v_chord_17_1, 2, 69, 9, 'A4', 1),
    (v_chord_17_1, 3, 65, 5, 'F4', 1),
    (v_chord_17_1, 4, 64, 4, 'E4', 1),
    (v_chord_17_1, 5, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_19 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 19;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_19, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_19_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_19_0, 0, 65, 5, 'F4', 1),
    (v_chord_19_0, 1, 69, 9, 'A4', 1),
    (v_chord_19_0, 2, 72, 0, 'C5', 1),
    (v_chord_19_0, 3, 76, 4, 'E5', 1),
    (v_chord_19_0, 4, 79, 7, 'G5', 1),
    (v_chord_19_0, 5, 77, 5, 'F5', 1),
    (v_chord_19_0, 6, 72, 0, 'C5', 1),
    (v_chord_19_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_19, 1, 'G7', 2)
  RETURNING id INTO v_chord_19_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_19_1, 0, 76, 4, 'E5', 1),
    (v_chord_19_1, 1, 74, 2, 'D5', 1),
    (v_chord_19_1, 2, 72, 0, 'C5', 1),
    (v_chord_19_1, 3, 71, 11, 'B4', 1),
    (v_chord_19_1, 4, 69, 9, 'A4', 1),
    (v_chord_19_1, 5, 67, 7, 'G4', 1),
    (v_chord_19_1, 6, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_20 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 20;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_20, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_20_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_20_0, 0, 62, 2, 'D4', 1),
    (v_chord_20_0, 1, 64, 4, 'E4', 1),
    (v_chord_20_0, 2, 65, 5, 'F4', 1),
    (v_chord_20_0, 3, 67, 7, 'G4', 1),
    (v_chord_20_0, 4, 69, 9, 'A4', 1),
    (v_chord_20_0, 5, 65, 5, 'F4', 1),
    (v_chord_20_0, 6, 62, 2, 'D4', 1),
    (v_chord_20_0, 7, 57, 9, 'A3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_20, 1, 'G7', 2)
  RETURNING id INTO v_chord_20_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_20_1, 0, 61, 1, 'C#4', 1),
    (v_chord_20_1, 1, 60, 0, 'C4', 1),
    (v_chord_20_1, 2, 58, 10, 'A#3', 1),
    (v_chord_20_1, 3, 59, 11, 'B3', 1),
    (v_chord_20_1, 4, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_21 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 21;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_21, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_21_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_21_0, 0, 67, 7, 'G4', 1),
    (v_chord_21_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_21_0, 2, 65, 5, 'F4', 1),
    (v_chord_21_0, 3, 57, 9, 'A3', 1),
    (v_chord_21_0, 4, 60, 0, 'C4', 1),
    (v_chord_21_0, 5, 64, 4, 'E4', 1),
    (v_chord_21_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_21_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_21, 1, 'G7', 2)
  RETURNING id INTO v_chord_21_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_21_1, 0, 62, 2, 'D4', 1),
    (v_chord_21_1, 1, 64, 4, 'E4', 1),
    (v_chord_21_1, 2, 65, 5, 'F4', 1),
    (v_chord_21_1, 3, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_22 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 22;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_22, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_22_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_22_0, 0, 67, 7, 'G4', 1),
    (v_chord_22_0, 1, 65, 5, 'F4', 1),
    (v_chord_22_0, 2, 67, 7, 'G4', 1),
    (v_chord_22_0, 3, 65, 5, 'F4', 1),
    (v_chord_22_0, 4, 64, 4, 'E4', 1),
    (v_chord_22_0, 5, 65, 5, 'F4', 1),
    (v_chord_22_0, 6, 69, 9, 'A4', 1),
    (v_chord_22_0, 7, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_22, 1, 'G7', 2)
  RETURNING id INTO v_chord_22_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_22_1, 0, 76, 4, 'E5', 1),
    (v_chord_22_1, 1, 79, 7, 'G5', 1),
    (v_chord_22_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_22_1, 3, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_23 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 23;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_23, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_23_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_23_0, 0, 64, 4, 'E4', 1),
    (v_chord_23_0, 1, 65, 5, 'F4', 1),
    (v_chord_23_0, 2, 69, 9, 'A4', 1),
    (v_chord_23_0, 3, 72, 0, 'C5', 1),
    (v_chord_23_0, 4, 76, 4, 'E5', 1),
    (v_chord_23_0, 5, 79, 7, 'G5', 1),
    (v_chord_23_0, 6, 77, 5, 'F5', 1),
    (v_chord_23_0, 7, 72, 0, 'C5', 1),
    (v_chord_23_0, 8, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_23, 1, 'G7', 2)
  RETURNING id INTO v_chord_23_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_23_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_23_1, 1, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_25 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 25;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_25, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_25_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_25_0, 0, 65, 5, 'F4', 1),
    (v_chord_25_0, 1, 67, 7, 'G4', 1),
    (v_chord_25_0, 2, 65, 5, 'F4', 1),
    (v_chord_25_0, 3, 64, 4, 'E4', 1),
    (v_chord_25_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_25_0, 5, 62, 2, 'D4', 1),
    (v_chord_25_0, 6, 61, 1, 'Db4', 1),
    (v_chord_25_0, 7, 60, 0, 'C4', 1),
    (v_chord_25_0, 8, 58, 10, 'A#3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_25, 1, 'G7', 2)
  RETURNING id INTO v_chord_25_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_25_1, 0, 59, 11, 'B3', 1),
    (v_chord_25_1, 1, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_26 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 26;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_26, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_26_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_26_0, 0, 65, 5, 'F4', 1),
    (v_chord_26_0, 1, 67, 7, 'G4', 1),
    (v_chord_26_0, 2, 65, 5, 'F4', 1),
    (v_chord_26_0, 3, 64, 4, 'E4', 1),
    (v_chord_26_0, 4, 65, 5, 'F4', 1),
    (v_chord_26_0, 5, 62, 2, 'D4', 1),
    (v_chord_26_0, 6, 64, 4, 'E4', 1),
    (v_chord_26_0, 7, 65, 5, 'F4', 1),
    (v_chord_26_0, 8, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_26, 1, 'G7', 2)
  RETURNING id INTO v_chord_26_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_26_1, 0, 69, 9, 'A4', 1),
    (v_chord_26_1, 1, 72, 0, 'C5', 1),
    (v_chord_26_1, 2, 69, 9, 'A4', 1),
    (v_chord_26_1, 3, 70, 10, 'A#4', 1),
    (v_chord_26_1, 4, 71, 11, 'B4', 1),
    (v_chord_26_1, 5, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_27 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 27;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_27, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_27_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_27_0, 0, 65, 5, 'F4', 1),
    (v_chord_27_0, 1, 60, 0, 'C4', 1),
    (v_chord_27_0, 2, 61, 1, 'C#4', 1),
    (v_chord_27_0, 3, 64, 4, 'E4', 1),
    (v_chord_27_0, 4, 62, 2, 'D4', 1),
    (v_chord_27_0, 5, 57, 9, 'A3', 1),
    (v_chord_27_0, 6, 60, 0, 'C4', 1),
    (v_chord_27_0, 7, 58, 10, 'A#3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_27, 1, 'G7', 2)
  RETURNING id INTO v_chord_27_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_27_1, 0, 59, 11, 'B3', 1),
    (v_chord_27_1, 1, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_28 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 28;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_28, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_28_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_28_0, 0, 65, 5, 'F4', 1),
    (v_chord_28_0, 1, 60, 0, 'C4', 1),
    (v_chord_28_0, 2, 61, 1, 'C#4', 1),
    (v_chord_28_0, 3, 64, 4, 'E4', 1),
    (v_chord_28_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_28_0, 5, 61, 1, 'C#4', 1),
    (v_chord_28_0, 6, 62, 2, 'D4', 1),
    (v_chord_28_0, 7, 57, 9, 'A3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_28, 1, 'G7', 2)
  RETURNING id INTO v_chord_28_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_28_1, 0, 60, 0, 'C4', 1),
    (v_chord_28_1, 1, 58, 10, 'A#3', 1),
    (v_chord_28_1, 2, 59, 11, 'B3', 1),
    (v_chord_28_1, 3, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_29 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 29;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_29, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_29_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_29_0, 0, 57, 9, 'A3', 1),
    (v_chord_29_0, 1, 60, 0, 'C4', 1),
    (v_chord_29_0, 2, 64, 4, 'E4', 1),
    (v_chord_29_0, 3, 67, 7, 'G4', 1),
    (v_chord_29_0, 4, 64, 4, 'E4', 1),
    (v_chord_29_0, 5, 65, 5, 'F4', 1),
    (v_chord_29_0, 6, 69, 9, 'A4', 1),
    (v_chord_29_0, 7, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_29, 1, 'G7', 2)
  RETURNING id INTO v_chord_29_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_29_1, 0, 76, 4, 'E5', 1),
    (v_chord_29_1, 1, 74, 2, 'D5', 1),
    (v_chord_29_1, 2, 69, 9, 'A4', 1),
    (v_chord_29_1, 3, 65, 5, 'F4', 1),
    (v_chord_29_1, 4, 64, 4, 'E4', 1),
    (v_chord_29_1, 5, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_31 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 31;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_31, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_31_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_31_0, 0, 61, 1, 'C#4', 1),
    (v_chord_31_0, 1, 62, 2, 'D4', 1),
    (v_chord_31_0, 2, 64, 4, 'E4', 1),
    (v_chord_31_0, 3, 65, 5, 'F4', 1),
    (v_chord_31_0, 4, 67, 7, 'G4', 1),
    (v_chord_31_0, 5, 69, 9, 'A4', 1),
    (v_chord_31_0, 6, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_31, 1, 'G7', 2)
  RETURNING id INTO v_chord_31_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_31_1, 0, 71, 11, 'B4', 1),
    (v_chord_31_1, 1, 72, 0, 'C5', 1),
    (v_chord_31_1, 2, 71, 11, 'B4', 1),
    (v_chord_31_1, 3, 69, 9, 'A4', 1),
    (v_chord_31_1, 4, 68, 8, 'Ab4', 1),
    (v_chord_31_1, 5, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_32 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 32;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_32, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_32_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_32_0, 0, 68, 8, 'G#4', 1),
    (v_chord_32_0, 1, 69, 9, 'A4', 1),
    (v_chord_32_0, 2, 72, 0, 'C5', 1),
    (v_chord_32_0, 3, 76, 4, 'E5', 1),
    (v_chord_32_0, 4, 79, 7, 'G5', 1),
    (v_chord_32_0, 5, 78, 6, 'Gb5', 1),
    (v_chord_32_0, 6, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_32, 1, 'G7', 2)
  RETURNING id INTO v_chord_32_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_32_1, 0, 77, 5, 'F5', 1),
    (v_chord_32_1, 1, 69, 9, 'A4', 1),
    (v_chord_32_1, 2, 72, 0, 'C5', 1),
    (v_chord_32_1, 3, 76, 4, 'E5', 1),
    (v_chord_32_1, 4, 76, 4, 'E5', 1),
    (v_chord_32_1, 5, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_33 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 33;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_33, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_33_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_33_0, 0, 63, 3, 'D#4', 1),
    (v_chord_33_0, 1, 64, 4, 'E4', 1),
    (v_chord_33_0, 2, 67, 7, 'G4', 1),
    (v_chord_33_0, 3, 64, 4, 'E4', 1),
    (v_chord_33_0, 4, 65, 5, 'F4', 1),
    (v_chord_33_0, 5, 69, 9, 'A4', 1),
    (v_chord_33_0, 6, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_33, 1, 'G7', 2)
  RETURNING id INTO v_chord_33_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_33_1, 0, 76, 4, 'E5', 1),
    (v_chord_33_1, 1, 74, 2, 'D5', 1),
    (v_chord_33_1, 2, 73, 1, 'C#5', 1),
    (v_chord_33_1, 3, 71, 11, 'B4', 1),
    (v_chord_33_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_33_1, 5, 68, 8, 'Ab4', 1),
    (v_chord_33_1, 6, 67, 7, 'G4', 1),
    (v_chord_33_1, 7, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_34 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 34;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_34, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_34_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_34_0, 0, 69, 9, 'A4', 1),
    (v_chord_34_0, 1, 65, 5, 'F4', 1),
    (v_chord_34_0, 2, 64, 4, 'E4', 1),
    (v_chord_34_0, 3, 62, 2, 'D4', 1),
    (v_chord_34_0, 4, 67, 7, 'G4', 1),
    (v_chord_34_0, 5, 65, 5, 'F4', 1),
    (v_chord_34_0, 6, 60, 0, 'C4', 1),
    (v_chord_34_0, 7, 57, 9, 'A3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_34, 1, 'G7', 2)
  RETURNING id INTO v_chord_34_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_34_1, 0, 61, 1, 'C#4', 1),
    (v_chord_34_1, 1, 64, 4, 'E4', 1),
    (v_chord_34_1, 2, 63, 3, 'Eb4', 1),
    (v_chord_34_1, 3, 61, 1, 'C#4', 1),
    (v_chord_34_1, 4, 62, 2, 'D4', 1),
    (v_chord_34_1, 5, 64, 4, 'E4', 1),
    (v_chord_34_1, 6, 65, 5, 'F4', 1),
    (v_chord_34_1, 7, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_35 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 35;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_35, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_35_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_35_0, 0, 62, 2, 'D4', 1),
    (v_chord_35_0, 1, 61, 1, 'C#4', 1),
    (v_chord_35_0, 2, 62, 2, 'D4', 1),
    (v_chord_35_0, 3, 64, 4, 'E4', 1),
    (v_chord_35_0, 4, 65, 5, 'F4', 1),
    (v_chord_35_0, 5, 67, 7, 'G4', 1),
    (v_chord_35_0, 6, 69, 9, 'A4', 1),
    (v_chord_35_0, 7, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_35, 1, 'G7', 2)
  RETURNING id INTO v_chord_35_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_35_1, 0, 71, 11, 'B4', 1),
    (v_chord_35_1, 1, 72, 0, 'C5', 1),
    (v_chord_35_1, 2, 71, 11, 'B4', 1),
    (v_chord_35_1, 3, 69, 9, 'A4', 1),
    (v_chord_35_1, 4, 68, 8, 'Ab4', 1),
    (v_chord_35_1, 5, 67, 7, 'G4', 1),
    (v_chord_35_1, 6, 66, 6, 'Gb4', 1),
    (v_chord_35_1, 7, 65, 5, 'F4', 1),
    (v_chord_35_1, 8, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_37 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 37;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_37, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_37_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_37_0, 0, 62, 2, 'D4', 1),
    (v_chord_37_0, 1, 61, 1, 'C#4', 1),
    (v_chord_37_0, 2, 62, 2, 'D4', 1),
    (v_chord_37_0, 3, 64, 4, 'E4', 1),
    (v_chord_37_0, 4, 65, 5, 'F4', 1),
    (v_chord_37_0, 5, 67, 7, 'G4', 1),
    (v_chord_37_0, 6, 69, 9, 'A4', 1),
    (v_chord_37_0, 7, 63, 3, 'D#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_37, 1, 'G7', 2)
  RETURNING id INTO v_chord_37_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_37_1, 0, 64, 4, 'E4', 1),
    (v_chord_37_1, 1, 67, 7, 'G4', 1),
    (v_chord_37_1, 2, 65, 5, 'F4', 1),
    (v_chord_37_1, 3, 57, 9, 'A3', 1),
    (v_chord_37_1, 4, 60, 0, 'C4', 1),
    (v_chord_37_1, 5, 64, 4, 'E4', 1),
    (v_chord_37_1, 6, 63, 3, 'Eb4', 1),
    (v_chord_37_1, 7, 61, 1, 'C#4', 1);
  SELECT id INTO v_phrase_38 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 38;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_38, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_38_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_38_0, 0, 79, 7, 'G5', 1),
    (v_chord_38_0, 1, 77, 5, 'F5', 1),
    (v_chord_38_0, 2, 72, 0, 'C5', 1),
    (v_chord_38_0, 3, 69, 9, 'A4', 1),
    (v_chord_38_0, 4, 73, 1, 'C#5', 1),
    (v_chord_38_0, 5, 76, 4, 'E5', 1),
    (v_chord_38_0, 6, 75, 3, 'Eb5', 1),
    (v_chord_38_0, 7, 73, 1, 'C#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_38, 1, 'G7', 2)
  RETURNING id INTO v_chord_38_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_38_1, 0, 74, 2, 'D5', 1),
    (v_chord_38_1, 1, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_39 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 39;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_39, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_39_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_39_0, 0, 71, 11, 'B4', 1),
    (v_chord_39_0, 1, 72, 0, 'C5', 1),
    (v_chord_39_0, 2, 69, 9, 'A4', 1),
    (v_chord_39_0, 3, 65, 5, 'F4', 1),
    (v_chord_39_0, 4, 64, 4, 'E4', 1),
    (v_chord_39_0, 5, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_39, 1, 'G7', 2)
  RETURNING id INTO v_chord_39_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_39_1, 0, 64, 4, 'E4', 1),
    (v_chord_39_1, 1, 65, 5, 'F4', 1),
    (v_chord_39_1, 2, 67, 7, 'G4', 1),
    (v_chord_39_1, 3, 68, 8, 'G#4', 1),
    (v_chord_39_1, 4, 71, 11, 'B4', 1),
    (v_chord_39_1, 5, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_40 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 40;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_40, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_40_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_40_0, 0, 71, 11, 'B4', 1),
    (v_chord_40_0, 1, 72, 0, 'C5', 1),
    (v_chord_40_0, 2, 69, 9, 'A4', 1),
    (v_chord_40_0, 3, 65, 5, 'F4', 1),
    (v_chord_40_0, 4, 64, 4, 'E4', 1),
    (v_chord_40_0, 5, 62, 2, 'D4', 1),
    (v_chord_40_0, 6, 61, 1, 'C#4', 1),
    (v_chord_40_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_40, 1, 'G7', 2)
  RETURNING id INTO v_chord_40_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_40_1, 0, 62, 2, 'D4', 1),
    (v_chord_40_1, 1, 57, 9, 'A3', 1);
  SELECT id INTO v_phrase_41 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 41;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_41, 0, 'Dm7', 1)
  RETURNING id INTO v_chord_41_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_41_0, 0, 61, 1, 'C#4', 1),
    (v_chord_41_0, 1, 62, 2, 'D4', 1),
    (v_chord_41_0, 2, 65, 5, 'F4', 1),
    (v_chord_41_0, 3, 69, 9, 'A4', 1),
    (v_chord_41_0, 4, 72, 0, 'C5', 1),
    (v_chord_41_0, 5, 69, 9, 'A4', 1),
    (v_chord_41_0, 6, 65, 5, 'F4', 1),
    (v_chord_41_0, 7, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_41, 1, 'G7', 2)
  RETURNING id INTO v_chord_41_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_41_1, 0, 64, 4, 'E4', 1),
    (v_chord_41_1, 1, 67, 7, 'G4', 1);
  SELECT id INTO v_comp_12 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 12;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_12;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_12, 7, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_12, 8, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_12, 9, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_12, 10, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_12, 11, 4);
  SELECT id INTO v_comp_18 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 18;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_18;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_18, 13, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_18, 14, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_18, 15, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_18, 16, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_18, 17, 4);
  SELECT id INTO v_comp_24 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 24;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_24;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_24, 19, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_24, 20, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_24, 21, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_24, 22, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_24, 23, 4);
  SELECT id INTO v_comp_30 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 30;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_30;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_30, 25, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_30, 26, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_30, 27, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_30, 28, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_30, 29, 4);
  SELECT id INTO v_comp_36 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 36;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_36;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_36, 31, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_36, 32, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_36, 33, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_36, 34, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_36, 35, 4);
  SELECT id INTO v_comp_42 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 42;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_42;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_42, 37, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_42, 38, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_42, 39, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_42, 40, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_42, 41, 4);
END $$;

COMMIT;