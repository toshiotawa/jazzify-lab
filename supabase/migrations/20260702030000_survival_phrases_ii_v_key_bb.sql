BEGIN;

-- Survival Phrases II-V key Bb: stages 79-114
-- MusicXML: 251譜面_-2st_Bb.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 79 AND 114
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 79 AND 114;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 79 AND 114
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 79 AND 114
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 79 AND 114;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 79 AND 114;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_bb_1', 'II-V in Bb 1-5', 'II-V in Bb 1-5', 13)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_bb_2', 'II-V in Bb 6-10', 'II-V in Bb 6-10', 14)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_bb_3', 'II-V in Bb 11-15', 'II-V in Bb 11-15', 15)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_bb_4', 'II-V in Bb 16-20', 'II-V in Bb 16-20', 16)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_bb_5', 'II-V in Bb 21-25', 'II-V in Bb 21-25', 17)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_bb_6', 'II-V in Bb 26-30', 'II-V in Bb 26-30', 18)
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
  79,
  'progression',
  'II-V in Bb · 1',
  'II-V in Bb · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_1',
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
  79,
  'II-V in Bb · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-01.mp3',
  -2
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
  80,
  'progression',
  'II-V in Bb · 2',
  'II-V in Bb · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_1',
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
  80,
  'II-V in Bb · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-02.mp3',
  -2
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
  81,
  'progression',
  'II-V in Bb · 3',
  'II-V in Bb · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_1',
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
  81,
  'II-V in Bb · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-03.mp3',
  -2
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
  82,
  'progression',
  'II-V in Bb · 4',
  'II-V in Bb · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_1',
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
  82,
  'II-V in Bb · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-04.mp3',
  -2
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
  83,
  'progression',
  'II-V in Bb · 5',
  'II-V in Bb · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_1',
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
  83,
  'II-V in Bb · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-05.mp3',
  -2
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
  84,
  'progression',
  '複合フレーズ · II-V in Bb 1-5',
  'Composite · II-V in Bb 1-5',
  'easy',
  '',
  'II-V in Bb 1-5',
  'II-V in Bb 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_1',
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
VALUES ('phrases', 84, 'B', -2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  85,
  'progression',
  'II-V in Bb · 6',
  'II-V in Bb · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_2',
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
  85,
  'II-V in Bb · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-06.mp3',
  -2
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
  86,
  'progression',
  'II-V in Bb · 7',
  'II-V in Bb · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_2',
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
  86,
  'II-V in Bb · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-07.mp3',
  -2
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
  87,
  'progression',
  'II-V in Bb · 8',
  'II-V in Bb · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_2',
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
  87,
  'II-V in Bb · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-08.mp3',
  -2
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
  88,
  'progression',
  'II-V in Bb · 9',
  'II-V in Bb · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_2',
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
  88,
  'II-V in Bb · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-09.mp3',
  -2
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
  89,
  'progression',
  'II-V in Bb · 10',
  'II-V in Bb · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_2',
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
  89,
  'II-V in Bb · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-10.mp3',
  -2
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
  90,
  'progression',
  '複合フレーズ · II-V in Bb 6-10',
  'Composite · II-V in Bb 6-10',
  'easy',
  '',
  'II-V in Bb 6-10',
  'II-V in Bb 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_2',
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
VALUES ('phrases', 90, 'C', -2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  91,
  'progression',
  'II-V in Bb · 11',
  'II-V in Bb · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_3',
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
  91,
  'II-V in Bb · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-11.mp3',
  -2
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
  92,
  'progression',
  'II-V in Bb · 12',
  'II-V in Bb · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_3',
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
  92,
  'II-V in Bb · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-12.mp3',
  -2
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
  93,
  'progression',
  'II-V in Bb · 13',
  'II-V in Bb · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_3',
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
  93,
  'II-V in Bb · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-13.mp3',
  -2
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
  94,
  'progression',
  'II-V in Bb · 14',
  'II-V in Bb · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_3',
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
  94,
  'II-V in Bb · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-14.mp3',
  -2
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
  95,
  'progression',
  'II-V in Bb · 15',
  'II-V in Bb · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_3',
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
  95,
  'II-V in Bb · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-15.mp3',
  -2
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
  96,
  'progression',
  '複合フレーズ · II-V in Bb 11-15',
  'Composite · II-V in Bb 11-15',
  'easy',
  '',
  'II-V in Bb 11-15',
  'II-V in Bb 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_3',
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
VALUES ('phrases', 96, 'A', -2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  97,
  'progression',
  'II-V in Bb · 16',
  'II-V in Bb · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_4',
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
  97,
  'II-V in Bb · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-16.mp3',
  -2
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
  98,
  'progression',
  'II-V in Bb · 17',
  'II-V in Bb · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_4',
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
  98,
  'II-V in Bb · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-17.mp3',
  -2
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
  99,
  'progression',
  'II-V in Bb · 18',
  'II-V in Bb · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_4',
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
  99,
  'II-V in Bb · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-18.mp3',
  -2
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
  100,
  'progression',
  'II-V in Bb · 19',
  'II-V in Bb · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_4',
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
  100,
  'II-V in Bb · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-19.mp3',
  -2
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
  101,
  'progression',
  'II-V in Bb · 20',
  'II-V in Bb · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_4',
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
  101,
  'II-V in Bb · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-20.mp3',
  -2
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
  102,
  'progression',
  '複合フレーズ · II-V in Bb 16-20',
  'Composite · II-V in Bb 16-20',
  'easy',
  '',
  'II-V in Bb 16-20',
  'II-V in Bb 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_4',
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
VALUES ('phrases', 102, 'B', -2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  103,
  'progression',
  'II-V in Bb · 21',
  'II-V in Bb · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_5',
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
  103,
  'II-V in Bb · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-21.mp3',
  -2
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
  104,
  'progression',
  'II-V in Bb · 22',
  'II-V in Bb · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_5',
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
  104,
  'II-V in Bb · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-22.mp3',
  -2
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
  105,
  'progression',
  'II-V in Bb · 23',
  'II-V in Bb · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_5',
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
  105,
  'II-V in Bb · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-23.mp3',
  -2
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
  106,
  'progression',
  'II-V in Bb · 24',
  'II-V in Bb · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_5',
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
  106,
  'II-V in Bb · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-24.mp3',
  -2
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
  107,
  'progression',
  'II-V in Bb · 25',
  'II-V in Bb · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_5',
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
  107,
  'II-V in Bb · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-25.mp3',
  -2
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
  108,
  'progression',
  '複合フレーズ · II-V in Bb 21-25',
  'Composite · II-V in Bb 21-25',
  'easy',
  '',
  'II-V in Bb 21-25',
  'II-V in Bb 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_5',
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
VALUES ('phrases', 108, 'C', -2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  109,
  'progression',
  'II-V in Bb · 26',
  'II-V in Bb · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_6',
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
  109,
  'II-V in Bb · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-26.mp3',
  -2
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
  110,
  'progression',
  'II-V in Bb · 27',
  'II-V in Bb · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_6',
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
  110,
  'II-V in Bb · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-27.mp3',
  -2
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
  111,
  'progression',
  'II-V in Bb · 28',
  'II-V in Bb · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_6',
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
  111,
  'II-V in Bb · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-28.mp3',
  -2
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
  112,
  'progression',
  'II-V in Bb · 29',
  'II-V in Bb · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_6',
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
  112,
  'II-V in Bb · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-29.mp3',
  -2
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
  113,
  'progression',
  'II-V in Bb · 30',
  'II-V in Bb · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_6',
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
  113,
  'II-V in Bb · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-bb-30.mp3',
  -2
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
  114,
  'progression',
  '複合フレーズ · II-V in Bb 26-30',
  'Composite · II-V in Bb 26-30',
  'easy',
  '',
  'II-V in Bb 26-30',
  'II-V in Bb 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_bb_6',
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
VALUES ('phrases', 114, 'A', -2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_79 uuid;
  v_chord_79_0 uuid;
  v_chord_79_1 uuid;
  v_phrase_80 uuid;
  v_chord_80_0 uuid;
  v_chord_80_1 uuid;
  v_phrase_81 uuid;
  v_chord_81_0 uuid;
  v_chord_81_1 uuid;
  v_phrase_82 uuid;
  v_chord_82_0 uuid;
  v_chord_82_1 uuid;
  v_phrase_83 uuid;
  v_chord_83_0 uuid;
  v_chord_83_1 uuid;
  v_phrase_85 uuid;
  v_chord_85_0 uuid;
  v_chord_85_1 uuid;
  v_phrase_86 uuid;
  v_chord_86_0 uuid;
  v_chord_86_1 uuid;
  v_phrase_87 uuid;
  v_chord_87_0 uuid;
  v_chord_87_1 uuid;
  v_phrase_88 uuid;
  v_chord_88_0 uuid;
  v_chord_88_1 uuid;
  v_phrase_89 uuid;
  v_chord_89_0 uuid;
  v_chord_89_1 uuid;
  v_phrase_91 uuid;
  v_chord_91_0 uuid;
  v_chord_91_1 uuid;
  v_phrase_92 uuid;
  v_chord_92_0 uuid;
  v_chord_92_1 uuid;
  v_phrase_93 uuid;
  v_chord_93_0 uuid;
  v_chord_93_1 uuid;
  v_phrase_94 uuid;
  v_chord_94_0 uuid;
  v_chord_94_1 uuid;
  v_phrase_95 uuid;
  v_chord_95_0 uuid;
  v_chord_95_1 uuid;
  v_phrase_97 uuid;
  v_chord_97_0 uuid;
  v_chord_97_1 uuid;
  v_phrase_98 uuid;
  v_chord_98_0 uuid;
  v_chord_98_1 uuid;
  v_phrase_99 uuid;
  v_chord_99_0 uuid;
  v_chord_99_1 uuid;
  v_phrase_100 uuid;
  v_chord_100_0 uuid;
  v_chord_100_1 uuid;
  v_phrase_101 uuid;
  v_chord_101_0 uuid;
  v_chord_101_1 uuid;
  v_phrase_103 uuid;
  v_chord_103_0 uuid;
  v_chord_103_1 uuid;
  v_phrase_104 uuid;
  v_chord_104_0 uuid;
  v_chord_104_1 uuid;
  v_phrase_105 uuid;
  v_chord_105_0 uuid;
  v_chord_105_1 uuid;
  v_phrase_106 uuid;
  v_chord_106_0 uuid;
  v_chord_106_1 uuid;
  v_phrase_107 uuid;
  v_chord_107_0 uuid;
  v_chord_107_1 uuid;
  v_phrase_109 uuid;
  v_chord_109_0 uuid;
  v_chord_109_1 uuid;
  v_phrase_110 uuid;
  v_chord_110_0 uuid;
  v_chord_110_1 uuid;
  v_phrase_111 uuid;
  v_chord_111_0 uuid;
  v_chord_111_1 uuid;
  v_phrase_112 uuid;
  v_chord_112_0 uuid;
  v_chord_112_1 uuid;
  v_phrase_113 uuid;
  v_chord_113_0 uuid;
  v_chord_113_1 uuid;
  v_comp_84 uuid;
  v_comp_90 uuid;
  v_comp_96 uuid;
  v_comp_102 uuid;
  v_comp_108 uuid;
  v_comp_114 uuid;
BEGIN
  SELECT id INTO v_phrase_79 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 79;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_79, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_79_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_79_0, 0, 74, 2, 'D5', 1),
    (v_chord_79_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_79_0, 2, 67, 7, 'G4', 1),
    (v_chord_79_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_79_0, 4, 67, 7, 'G4', 1),
    (v_chord_79_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_79_0, 6, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_79, 1, 'F7', 2)
  RETURNING id INTO v_chord_79_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_79_1, 0, 77, 5, 'F5', 1),
    (v_chord_79_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_79_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_79_1, 3, 67, 7, 'G4', 1),
    (v_chord_79_1, 4, 74, 2, 'D5', 1),
    (v_chord_79_1, 5, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_80 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 80;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_80, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_80_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_80_0, 0, 61, 1, 'C#4', 1),
    (v_chord_80_0, 1, 62, 2, 'D4', 1),
    (v_chord_80_0, 2, 65, 5, 'F4', 1),
    (v_chord_80_0, 3, 62, 2, 'D4', 1),
    (v_chord_80_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_80_0, 5, 67, 7, 'G4', 1),
    (v_chord_80_0, 6, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_80, 1, 'F7', 2)
  RETURNING id INTO v_chord_80_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_80_1, 0, 74, 2, 'D5', 1),
    (v_chord_80_1, 1, 72, 0, 'C5', 1),
    (v_chord_80_1, 2, 67, 7, 'G4', 1),
    (v_chord_80_1, 3, 63, 3, 'Eb4', 1),
    (v_chord_80_1, 4, 62, 2, 'D4', 1),
    (v_chord_80_1, 5, 60, 0, 'C4', 1);
  SELECT id INTO v_phrase_81 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 81;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_81, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_81_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_81_0, 0, 60, 0, 'C4', 1),
    (v_chord_81_0, 1, 62, 2, 'D4', 1),
    (v_chord_81_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_81_0, 3, 65, 5, 'F4', 1),
    (v_chord_81_0, 4, 67, 7, 'G4', 1),
    (v_chord_81_0, 5, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_81, 1, 'F7', 2)
  RETURNING id INTO v_chord_81_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_81_1, 0, 69, 9, 'A4', 1),
    (v_chord_81_1, 1, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_82 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 82;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_82, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_82_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_82_0, 0, 77, 5, 'F5', 1),
    (v_chord_82_0, 1, 75, 3, 'Eb5', 1),
    (v_chord_82_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_82_0, 3, 67, 7, 'G4', 1),
    (v_chord_82_0, 4, 74, 2, 'D5', 1),
    (v_chord_82_0, 5, 71, 11, 'B4', 1),
    (v_chord_82_0, 6, 72, 0, 'C5', 1),
    (v_chord_82_0, 7, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_82, 1, 'F7', 2)
  RETURNING id INTO v_chord_82_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_82_1, 0, 75, 3, 'Eb5', 1),
    (v_chord_82_1, 1, 77, 5, 'F5', 1),
    (v_chord_82_1, 2, 79, 7, 'G5', 1),
    (v_chord_82_1, 3, 75, 3, 'Eb5', 1),
    (v_chord_82_1, 4, 74, 2, 'D5', 1),
    (v_chord_82_1, 5, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_83 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 83;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_83, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_83_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_83_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_83_0, 1, 65, 5, 'F4', 1),
    (v_chord_83_0, 2, 67, 7, 'G4', 1),
    (v_chord_83_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_83_0, 4, 62, 2, 'D4', 1),
    (v_chord_83_0, 5, 60, 0, 'C4', 1),
    (v_chord_83_0, 6, 59, 11, 'B3', 1),
    (v_chord_83_0, 7, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_83, 1, 'F7', 2)
  RETURNING id INTO v_chord_83_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_83_1, 0, 60, 0, 'C4', 1),
    (v_chord_83_1, 1, 58, 10, 'Bb3', 1),
    (v_chord_83_1, 2, 56, 8, 'G#3', 1),
    (v_chord_83_1, 3, 57, 9, 'A3', 1),
    (v_chord_83_1, 4, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_85 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 85;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_85, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_85_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_85_0, 0, 60, 0, 'C4', 1),
    (v_chord_85_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_85_0, 2, 67, 7, 'G4', 1),
    (v_chord_85_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_85_0, 4, 67, 7, 'G4', 1),
    (v_chord_85_0, 5, 68, 8, 'G#4', 1),
    (v_chord_85_0, 6, 69, 9, 'A4', 1),
    (v_chord_85_0, 7, 60, 0, 'C4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_85, 1, 'F7', 2)
  RETURNING id INTO v_chord_85_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_85_1, 0, 63, 3, 'Eb4', 1),
    (v_chord_85_1, 1, 67, 7, 'G4', 1),
    (v_chord_85_1, 2, 66, 6, 'Gb4', 1),
    (v_chord_85_1, 3, 64, 4, 'E4', 1),
    (v_chord_85_1, 4, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_86 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 86;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_86, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_86_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_86_0, 0, 60, 0, 'C4', 1),
    (v_chord_86_0, 1, 62, 2, 'D4', 1),
    (v_chord_86_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_86_0, 3, 65, 5, 'F4', 1),
    (v_chord_86_0, 4, 67, 7, 'G4', 1),
    (v_chord_86_0, 5, 69, 9, 'A4', 1),
    (v_chord_86_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_86_0, 7, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_86, 1, 'F7', 2)
  RETURNING id INTO v_chord_86_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_86_1, 0, 74, 2, 'D5', 1),
    (v_chord_86_1, 1, 77, 5, 'F5', 1),
    (v_chord_86_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_86_1, 3, 67, 7, 'G4', 1),
    (v_chord_86_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_86_1, 5, 74, 2, 'D5', 1),
    (v_chord_86_1, 6, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_87 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 87;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_87, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_87_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_87_0, 0, 74, 2, 'D5', 1),
    (v_chord_87_0, 1, 71, 11, 'B4', 1),
    (v_chord_87_0, 2, 72, 0, 'C5', 1),
    (v_chord_87_0, 3, 74, 2, 'D5', 1),
    (v_chord_87_0, 4, 75, 3, 'Eb5', 1),
    (v_chord_87_0, 5, 77, 5, 'F5', 1),
    (v_chord_87_0, 6, 79, 7, 'G5', 1),
    (v_chord_87_0, 7, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_87, 1, 'F7', 2)
  RETURNING id INTO v_chord_87_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_87_1, 0, 72, 0, 'C5', 1),
    (v_chord_87_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_87_1, 2, 68, 8, 'G#4', 1),
    (v_chord_87_1, 3, 69, 9, 'A4', 1),
    (v_chord_87_1, 4, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_88 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 88;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_88, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_88_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_88_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_88_0, 1, 65, 5, 'F4', 1),
    (v_chord_88_0, 2, 67, 7, 'G4', 1),
    (v_chord_88_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_88_0, 4, 74, 2, 'D5', 1),
    (v_chord_88_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_88_0, 6, 71, 11, 'B4', 1),
    (v_chord_88_0, 7, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_88, 1, 'F7', 2)
  RETURNING id INTO v_chord_88_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_88_1, 0, 72, 0, 'C5', 1),
    (v_chord_88_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_88_1, 2, 67, 7, 'G4', 1),
    (v_chord_88_1, 3, 68, 8, 'G#4', 1),
    (v_chord_88_1, 4, 69, 9, 'A4', 1),
    (v_chord_88_1, 5, 67, 7, 'G4', 1),
    (v_chord_88_1, 6, 65, 5, 'F4', 1),
    (v_chord_88_1, 7, 64, 4, 'Fb4', 1);
  SELECT id INTO v_phrase_89 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 89;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_89, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_89_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_89_0, 0, 69, 9, 'A4', 1),
    (v_chord_89_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_89_0, 2, 67, 7, 'G4', 1),
    (v_chord_89_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_89_0, 4, 62, 2, 'D4', 1),
    (v_chord_89_0, 5, 63, 3, 'Eb4', 1),
    (v_chord_89_0, 6, 67, 7, 'G4', 1),
    (v_chord_89_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_89, 1, 'F7', 2)
  RETURNING id INTO v_chord_89_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_89_1, 0, 74, 2, 'D5', 1),
    (v_chord_89_1, 1, 72, 0, 'C5', 1),
    (v_chord_89_1, 2, 67, 7, 'G4', 1),
    (v_chord_89_1, 3, 63, 3, 'Eb4', 1),
    (v_chord_89_1, 4, 62, 2, 'D4', 1),
    (v_chord_89_1, 5, 60, 0, 'C4', 1);
  SELECT id INTO v_phrase_91 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 91;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_91, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_91_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_91_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_91_0, 1, 67, 7, 'G4', 1),
    (v_chord_91_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_91_0, 3, 74, 2, 'D5', 1),
    (v_chord_91_0, 4, 77, 5, 'F5', 1),
    (v_chord_91_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_91_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_91_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_91, 1, 'F7', 2)
  RETURNING id INTO v_chord_91_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_91_1, 0, 74, 2, 'D5', 1),
    (v_chord_91_1, 1, 72, 0, 'C5', 1),
    (v_chord_91_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_91_1, 3, 69, 9, 'A4', 1),
    (v_chord_91_1, 4, 67, 7, 'G4', 1),
    (v_chord_91_1, 5, 65, 5, 'F4', 1),
    (v_chord_91_1, 6, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_92 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 92;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_92, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_92_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_92_0, 0, 72, 0, 'C5', 1),
    (v_chord_92_0, 1, 74, 2, 'D5', 1),
    (v_chord_92_0, 2, 75, 3, 'Eb5', 1),
    (v_chord_92_0, 3, 77, 5, 'F5', 1),
    (v_chord_92_0, 4, 79, 7, 'G5', 1),
    (v_chord_92_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_92_0, 6, 72, 0, 'C5', 1),
    (v_chord_92_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_92, 1, 'F7', 2)
  RETURNING id INTO v_chord_92_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_92_1, 0, 71, 11, 'B4', 1),
    (v_chord_92_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_92_1, 2, 68, 8, 'G#4', 1),
    (v_chord_92_1, 3, 69, 9, 'A4', 1),
    (v_chord_92_1, 4, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_93 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 93;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_93, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_93_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_93_0, 0, 77, 5, 'F5', 1),
    (v_chord_93_0, 1, 76, 4, 'Fb5', 1),
    (v_chord_93_0, 2, 75, 3, 'Eb5', 1),
    (v_chord_93_0, 3, 67, 7, 'G4', 1),
    (v_chord_93_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_93_0, 5, 74, 2, 'D5', 1),
    (v_chord_93_0, 6, 73, 1, 'Db5', 1),
    (v_chord_93_0, 7, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_93, 1, 'F7', 2)
  RETURNING id INTO v_chord_93_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_93_1, 0, 72, 0, 'C5', 1),
    (v_chord_93_1, 1, 74, 2, 'D5', 1),
    (v_chord_93_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_93_1, 3, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_94 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 94;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_94, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_94_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_94_0, 0, 65, 5, 'F4', 1),
    (v_chord_94_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_94_0, 2, 65, 5, 'F4', 1),
    (v_chord_94_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_94_0, 4, 62, 2, 'D4', 1),
    (v_chord_94_0, 5, 63, 3, 'Eb4', 1),
    (v_chord_94_0, 6, 67, 7, 'G4', 1),
    (v_chord_94_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_94, 1, 'F7', 2)
  RETURNING id INTO v_chord_94_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_94_1, 0, 74, 2, 'D5', 1),
    (v_chord_94_1, 1, 77, 5, 'F5', 1),
    (v_chord_94_1, 2, 73, 1, 'Db5', 1),
    (v_chord_94_1, 3, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_95 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 95;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_95, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_95_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_95_0, 0, 62, 2, 'D4', 1),
    (v_chord_95_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_95_0, 2, 67, 7, 'G4', 1),
    (v_chord_95_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_95_0, 4, 74, 2, 'D5', 1),
    (v_chord_95_0, 5, 77, 5, 'F5', 1),
    (v_chord_95_0, 6, 75, 3, 'Eb5', 1),
    (v_chord_95_0, 7, 70, 10, 'Bb4', 1),
    (v_chord_95_0, 8, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_95, 1, 'F7', 2)
  RETURNING id INTO v_chord_95_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_95_1, 0, 66, 6, 'Gb4', 1),
    (v_chord_95_1, 1, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_97 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 97;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_97, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_97_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_97_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_97_0, 1, 65, 5, 'F4', 1),
    (v_chord_97_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_97_0, 3, 62, 2, 'D4', 1),
    (v_chord_97_0, 4, 61, 1, 'Db4', 1),
    (v_chord_97_0, 5, 60, 0, 'C4', 1),
    (v_chord_97_0, 6, 59, 11, 'Cb4', 1),
    (v_chord_97_0, 7, 58, 10, 'Bb3', 1),
    (v_chord_97_0, 8, 56, 8, 'G#3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_97, 1, 'F7', 2)
  RETURNING id INTO v_chord_97_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_97_1, 0, 57, 9, 'A3', 1),
    (v_chord_97_1, 1, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_98 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 98;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_98, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_98_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_98_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_98_0, 1, 65, 5, 'F4', 1),
    (v_chord_98_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_98_0, 3, 62, 2, 'D4', 1),
    (v_chord_98_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_98_0, 5, 60, 0, 'C4', 1),
    (v_chord_98_0, 6, 62, 2, 'D4', 1),
    (v_chord_98_0, 7, 63, 3, 'Eb4', 1),
    (v_chord_98_0, 8, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_98, 1, 'F7', 2)
  RETURNING id INTO v_chord_98_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_98_1, 0, 67, 7, 'G4', 1),
    (v_chord_98_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_98_1, 2, 67, 7, 'G4', 1),
    (v_chord_98_1, 3, 68, 8, 'G#4', 1),
    (v_chord_98_1, 4, 69, 9, 'A4', 1),
    (v_chord_98_1, 5, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_99 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 99;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_99, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_99_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_99_0, 0, 75, 3, 'Eb5', 1),
    (v_chord_99_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_99_0, 2, 71, 11, 'B4', 1),
    (v_chord_99_0, 3, 74, 2, 'D5', 1),
    (v_chord_99_0, 4, 72, 0, 'C5', 1),
    (v_chord_99_0, 5, 67, 7, 'G4', 1),
    (v_chord_99_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_99_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_99, 1, 'F7', 2)
  RETURNING id INTO v_chord_99_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_99_1, 0, 69, 9, 'A4', 1),
    (v_chord_99_1, 1, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_100 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 100;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_100, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_100_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_100_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_100_0, 1, 58, 10, 'Bb3', 1),
    (v_chord_100_0, 2, 59, 11, 'B3', 1),
    (v_chord_100_0, 3, 62, 2, 'D4', 1),
    (v_chord_100_0, 4, 61, 1, 'Db4', 1),
    (v_chord_100_0, 5, 59, 11, 'B3', 1),
    (v_chord_100_0, 6, 60, 0, 'C4', 1),
    (v_chord_100_0, 7, 55, 7, 'G3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_100, 1, 'F7', 2)
  RETURNING id INTO v_chord_100_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_100_1, 0, 58, 10, 'Bb3', 1),
    (v_chord_100_1, 1, 56, 8, 'G#3', 1),
    (v_chord_100_1, 2, 57, 9, 'A3', 1),
    (v_chord_100_1, 3, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_101 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 101;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_101, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_101_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_101_0, 0, 67, 7, 'G4', 1),
    (v_chord_101_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_101_0, 2, 74, 2, 'D5', 1),
    (v_chord_101_0, 3, 77, 5, 'F5', 1),
    (v_chord_101_0, 4, 74, 2, 'D5', 1),
    (v_chord_101_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_101_0, 6, 79, 7, 'G5', 1),
    (v_chord_101_0, 7, 82, 10, 'Bb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_101, 1, 'F7', 2)
  RETURNING id INTO v_chord_101_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_101_1, 0, 86, 2, 'D6', 1),
    (v_chord_101_1, 1, 84, 0, 'C6', 1),
    (v_chord_101_1, 2, 79, 7, 'G5', 1),
    (v_chord_101_1, 3, 75, 3, 'Eb5', 1),
    (v_chord_101_1, 4, 74, 2, 'D5', 1),
    (v_chord_101_1, 5, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_103 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 103;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_103, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_103_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_103_0, 0, 59, 11, 'B3', 1),
    (v_chord_103_0, 1, 60, 0, 'C4', 1),
    (v_chord_103_0, 2, 62, 2, 'D4', 1),
    (v_chord_103_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_103_0, 4, 65, 5, 'F4', 1),
    (v_chord_103_0, 5, 67, 7, 'G4', 1),
    (v_chord_103_0, 6, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_103, 1, 'F7', 2)
  RETURNING id INTO v_chord_103_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_103_1, 0, 69, 9, 'A4', 1),
    (v_chord_103_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_103_1, 2, 69, 9, 'A4', 1),
    (v_chord_103_1, 3, 67, 7, 'G4', 1),
    (v_chord_103_1, 4, 66, 6, 'Gb4', 1),
    (v_chord_103_1, 5, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_104 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 104;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_104, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_104_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_104_0, 0, 66, 6, 'F#4', 1),
    (v_chord_104_0, 1, 67, 7, 'G4', 1),
    (v_chord_104_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_104_0, 3, 74, 2, 'D5', 1),
    (v_chord_104_0, 4, 77, 5, 'F5', 1),
    (v_chord_104_0, 5, 76, 4, 'Fb5', 1),
    (v_chord_104_0, 6, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_104, 1, 'F7', 2)
  RETURNING id INTO v_chord_104_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_104_1, 0, 75, 3, 'Eb5', 1),
    (v_chord_104_1, 1, 67, 7, 'G4', 1),
    (v_chord_104_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_104_1, 3, 74, 2, 'D5', 1),
    (v_chord_104_1, 4, 74, 2, 'D5', 1),
    (v_chord_104_1, 5, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_105 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 105;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_105, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_105_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_105_0, 0, 61, 1, 'C#4', 1),
    (v_chord_105_0, 1, 62, 2, 'D4', 1),
    (v_chord_105_0, 2, 65, 5, 'F4', 1),
    (v_chord_105_0, 3, 62, 2, 'D4', 1),
    (v_chord_105_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_105_0, 5, 67, 7, 'G4', 1),
    (v_chord_105_0, 6, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_105, 1, 'F7', 2)
  RETURNING id INTO v_chord_105_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_105_1, 0, 74, 2, 'D5', 1),
    (v_chord_105_1, 1, 72, 0, 'C5', 1),
    (v_chord_105_1, 2, 71, 11, 'B4', 1),
    (v_chord_105_1, 3, 69, 9, 'A4', 1),
    (v_chord_105_1, 4, 68, 8, 'Ab4', 1),
    (v_chord_105_1, 5, 66, 6, 'Gb4', 1),
    (v_chord_105_1, 6, 65, 5, 'F4', 1),
    (v_chord_105_1, 7, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_106 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 106;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_106, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_106_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_106_0, 0, 79, 7, 'G5', 1),
    (v_chord_106_0, 1, 75, 3, 'Eb5', 1),
    (v_chord_106_0, 2, 74, 2, 'D5', 1),
    (v_chord_106_0, 3, 72, 0, 'C5', 1),
    (v_chord_106_0, 4, 77, 5, 'F5', 1),
    (v_chord_106_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_106_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_106_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_106, 1, 'F7', 2)
  RETURNING id INTO v_chord_106_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_106_1, 0, 71, 11, 'B4', 1),
    (v_chord_106_1, 1, 74, 2, 'D5', 1),
    (v_chord_106_1, 2, 73, 1, 'Db5', 1),
    (v_chord_106_1, 3, 71, 11, 'B4', 1),
    (v_chord_106_1, 4, 72, 0, 'C5', 1),
    (v_chord_106_1, 5, 74, 2, 'D5', 1),
    (v_chord_106_1, 6, 75, 3, 'Eb5', 1),
    (v_chord_106_1, 7, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_107 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 107;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_107, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_107_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_107_0, 0, 60, 0, 'C4', 1),
    (v_chord_107_0, 1, 59, 11, 'B3', 1),
    (v_chord_107_0, 2, 60, 0, 'C4', 1),
    (v_chord_107_0, 3, 62, 2, 'D4', 1),
    (v_chord_107_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_107_0, 5, 65, 5, 'F4', 1),
    (v_chord_107_0, 6, 67, 7, 'G4', 1),
    (v_chord_107_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_107, 1, 'F7', 2)
  RETURNING id INTO v_chord_107_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_107_1, 0, 69, 9, 'A4', 1),
    (v_chord_107_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_107_1, 2, 69, 9, 'A4', 1),
    (v_chord_107_1, 3, 67, 7, 'G4', 1),
    (v_chord_107_1, 4, 66, 6, 'Gb4', 1),
    (v_chord_107_1, 5, 65, 5, 'F4', 1),
    (v_chord_107_1, 6, 64, 4, 'Fb4', 1),
    (v_chord_107_1, 7, 63, 3, 'Eb4', 1),
    (v_chord_107_1, 8, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_109 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 109;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_109, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_109_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_109_0, 0, 60, 0, 'C4', 1),
    (v_chord_109_0, 1, 59, 11, 'B3', 1),
    (v_chord_109_0, 2, 60, 0, 'C4', 1),
    (v_chord_109_0, 3, 62, 2, 'D4', 1),
    (v_chord_109_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_109_0, 5, 65, 5, 'F4', 1),
    (v_chord_109_0, 6, 67, 7, 'G4', 1),
    (v_chord_109_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_109, 1, 'F7', 2)
  RETURNING id INTO v_chord_109_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_109_1, 0, 62, 2, 'D4', 1),
    (v_chord_109_1, 1, 65, 5, 'F4', 1),
    (v_chord_109_1, 2, 63, 3, 'Eb4', 1),
    (v_chord_109_1, 3, 55, 7, 'G3', 1),
    (v_chord_109_1, 4, 58, 10, 'Bb3', 1),
    (v_chord_109_1, 5, 62, 2, 'D4', 1),
    (v_chord_109_1, 6, 61, 1, 'Db4', 1),
    (v_chord_109_1, 7, 59, 11, 'B3', 1);
  SELECT id INTO v_phrase_110 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 110;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_110, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_110_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_110_0, 0, 77, 5, 'F5', 1),
    (v_chord_110_0, 1, 75, 3, 'Eb5', 1),
    (v_chord_110_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_110_0, 3, 67, 7, 'G4', 1),
    (v_chord_110_0, 4, 71, 11, 'B4', 1),
    (v_chord_110_0, 5, 74, 2, 'D5', 1),
    (v_chord_110_0, 6, 73, 1, 'Db5', 1),
    (v_chord_110_0, 7, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_110, 1, 'F7', 2)
  RETURNING id INTO v_chord_110_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_110_1, 0, 72, 0, 'C5', 1),
    (v_chord_110_1, 1, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_111 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 111;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_111, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_111_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_111_0, 0, 69, 9, 'A4', 1),
    (v_chord_111_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_111_0, 2, 67, 7, 'G4', 1),
    (v_chord_111_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_111_0, 4, 62, 2, 'D4', 1),
    (v_chord_111_0, 5, 60, 0, 'C4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_111, 1, 'F7', 2)
  RETURNING id INTO v_chord_111_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_111_1, 0, 62, 2, 'D4', 1),
    (v_chord_111_1, 1, 63, 3, 'Eb4', 1),
    (v_chord_111_1, 2, 65, 5, 'F4', 1),
    (v_chord_111_1, 3, 66, 6, 'F#4', 1),
    (v_chord_111_1, 4, 69, 9, 'A4', 1),
    (v_chord_111_1, 5, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_112 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 112;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_112, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_112_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_112_0, 0, 69, 9, 'A4', 1),
    (v_chord_112_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_112_0, 2, 67, 7, 'G4', 1),
    (v_chord_112_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_112_0, 4, 62, 2, 'D4', 1),
    (v_chord_112_0, 5, 60, 0, 'C4', 1),
    (v_chord_112_0, 6, 59, 11, 'B3', 1),
    (v_chord_112_0, 7, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_112, 1, 'F7', 2)
  RETURNING id INTO v_chord_112_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_112_1, 0, 60, 0, 'C4', 1),
    (v_chord_112_1, 1, 55, 7, 'G3', 1);
  SELECT id INTO v_phrase_113 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 113;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_113, 0, 'Cm7', 1)
  RETURNING id INTO v_chord_113_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_113_0, 0, 59, 11, 'B3', 1),
    (v_chord_113_0, 1, 60, 0, 'C4', 1),
    (v_chord_113_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_113_0, 3, 67, 7, 'G4', 1),
    (v_chord_113_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_113_0, 5, 67, 7, 'G4', 1),
    (v_chord_113_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_113_0, 7, 60, 0, 'C4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_113, 1, 'F7', 2)
  RETURNING id INTO v_chord_113_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_113_1, 0, 62, 2, 'D4', 1),
    (v_chord_113_1, 1, 65, 5, 'F4', 1);
  SELECT id INTO v_comp_84 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 84;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_84;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_84, 79, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_84, 80, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_84, 81, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_84, 82, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_84, 83, 4);
  SELECT id INTO v_comp_90 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 90;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_90;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_90, 85, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_90, 86, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_90, 87, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_90, 88, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_90, 89, 4);
  SELECT id INTO v_comp_96 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 96;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_96;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_96, 91, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_96, 92, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_96, 93, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_96, 94, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_96, 95, 4);
  SELECT id INTO v_comp_102 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 102;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_102;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_102, 97, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_102, 98, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_102, 99, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_102, 100, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_102, 101, 4);
  SELECT id INTO v_comp_108 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 108;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_108;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_108, 103, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_108, 104, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_108, 105, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_108, 106, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_108, 107, 4);
  SELECT id INTO v_comp_114 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 114;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_114;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_114, 109, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_114, 110, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_114, 111, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_114, 112, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_114, 113, 4);
END $$;

COMMIT;