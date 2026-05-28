BEGIN;

-- Survival Phrases II-V key G: stages 403-438
-- MusicXML: 251譜面_-5st_G.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 403 AND 438
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 403 AND 438;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 403 AND 438
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 403 AND 438
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 403 AND 438;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 403 AND 438;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_g_1', 'II-V in G 1-5', 'II-V in G 1-5', 67)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_g_2', 'II-V in G 6-10', 'II-V in G 6-10', 68)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_g_3', 'II-V in G 11-15', 'II-V in G 11-15', 69)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_g_4', 'II-V in G 16-20', 'II-V in G 16-20', 70)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_g_5', 'II-V in G 21-25', 'II-V in G 21-25', 71)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_g_6', 'II-V in G 26-30', 'II-V in G 26-30', 72)
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
  403,
  'progression',
  'II-V in G · 1',
  'II-V in G · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_1',
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
  403,
  'II-V in G · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-01.mp3',
  1
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
  404,
  'progression',
  'II-V in G · 2',
  'II-V in G · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_1',
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
  404,
  'II-V in G · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-02.mp3',
  1
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
  405,
  'progression',
  'II-V in G · 3',
  'II-V in G · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_1',
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
  405,
  'II-V in G · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-03.mp3',
  1
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
  406,
  'progression',
  'II-V in G · 4',
  'II-V in G · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_1',
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
  406,
  'II-V in G · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-04.mp3',
  1
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
  407,
  'progression',
  'II-V in G · 5',
  'II-V in G · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_1',
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
  407,
  'II-V in G · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-05.mp3',
  1
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
  408,
  'progression',
  '複合フレーズ · II-V in G 1-5',
  'Composite · II-V in G 1-5',
  'easy',
  '',
  'II-V in G 1-5',
  'II-V in G 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_1',
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
VALUES ('phrases', 408, 'B', 1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  409,
  'progression',
  'II-V in G · 6',
  'II-V in G · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_2',
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
  409,
  'II-V in G · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-06.mp3',
  1
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
  410,
  'progression',
  'II-V in G · 7',
  'II-V in G · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_2',
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
  410,
  'II-V in G · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-07.mp3',
  1
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
  411,
  'progression',
  'II-V in G · 8',
  'II-V in G · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_2',
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
  411,
  'II-V in G · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-08.mp3',
  1
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
  412,
  'progression',
  'II-V in G · 9',
  'II-V in G · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_2',
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
  412,
  'II-V in G · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-09.mp3',
  1
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
  413,
  'progression',
  'II-V in G · 10',
  'II-V in G · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_2',
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
  413,
  'II-V in G · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-10.mp3',
  1
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
  414,
  'progression',
  '複合フレーズ · II-V in G 6-10',
  'Composite · II-V in G 6-10',
  'easy',
  '',
  'II-V in G 6-10',
  'II-V in G 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_2',
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
VALUES ('phrases', 414, 'C', 1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  415,
  'progression',
  'II-V in G · 11',
  'II-V in G · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_3',
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
  415,
  'II-V in G · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-11.mp3',
  1
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
  416,
  'progression',
  'II-V in G · 12',
  'II-V in G · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_3',
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
  416,
  'II-V in G · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-12.mp3',
  1
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
  417,
  'progression',
  'II-V in G · 13',
  'II-V in G · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_3',
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
  417,
  'II-V in G · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-13.mp3',
  1
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
  418,
  'progression',
  'II-V in G · 14',
  'II-V in G · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_3',
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
  418,
  'II-V in G · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-14.mp3',
  1
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
  419,
  'progression',
  'II-V in G · 15',
  'II-V in G · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_3',
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
  419,
  'II-V in G · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-15.mp3',
  1
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
  420,
  'progression',
  '複合フレーズ · II-V in G 11-15',
  'Composite · II-V in G 11-15',
  'easy',
  '',
  'II-V in G 11-15',
  'II-V in G 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_3',
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
VALUES ('phrases', 420, 'A', 1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  421,
  'progression',
  'II-V in G · 16',
  'II-V in G · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_4',
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
  421,
  'II-V in G · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-16.mp3',
  1
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
  422,
  'progression',
  'II-V in G · 17',
  'II-V in G · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_4',
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
  422,
  'II-V in G · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-17.mp3',
  1
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
  423,
  'progression',
  'II-V in G · 18',
  'II-V in G · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_4',
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
  423,
  'II-V in G · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-18.mp3',
  1
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
  424,
  'progression',
  'II-V in G · 19',
  'II-V in G · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_4',
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
  424,
  'II-V in G · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-19.mp3',
  1
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
  425,
  'progression',
  'II-V in G · 20',
  'II-V in G · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_4',
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
  425,
  'II-V in G · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-20.mp3',
  1
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
  426,
  'progression',
  '複合フレーズ · II-V in G 16-20',
  'Composite · II-V in G 16-20',
  'easy',
  '',
  'II-V in G 16-20',
  'II-V in G 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_4',
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
VALUES ('phrases', 426, 'B', 1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  427,
  'progression',
  'II-V in G · 21',
  'II-V in G · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_5',
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
  427,
  'II-V in G · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-21.mp3',
  1
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
  428,
  'progression',
  'II-V in G · 22',
  'II-V in G · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_5',
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
  428,
  'II-V in G · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-22.mp3',
  1
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
  429,
  'progression',
  'II-V in G · 23',
  'II-V in G · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_5',
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
  429,
  'II-V in G · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-23.mp3',
  1
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
  430,
  'progression',
  'II-V in G · 24',
  'II-V in G · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_5',
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
  430,
  'II-V in G · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-24.mp3',
  1
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
  431,
  'progression',
  'II-V in G · 25',
  'II-V in G · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_5',
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
  431,
  'II-V in G · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-25.mp3',
  1
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
  432,
  'progression',
  '複合フレーズ · II-V in G 21-25',
  'Composite · II-V in G 21-25',
  'easy',
  '',
  'II-V in G 21-25',
  'II-V in G 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_5',
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
VALUES ('phrases', 432, 'C', 1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  433,
  'progression',
  'II-V in G · 26',
  'II-V in G · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_6',
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
  433,
  'II-V in G · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-26.mp3',
  1
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
  434,
  'progression',
  'II-V in G · 27',
  'II-V in G · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_6',
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
  434,
  'II-V in G · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-27.mp3',
  1
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
  435,
  'progression',
  'II-V in G · 28',
  'II-V in G · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_6',
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
  435,
  'II-V in G · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-28.mp3',
  1
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
  436,
  'progression',
  'II-V in G · 29',
  'II-V in G · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_6',
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
  436,
  'II-V in G · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-29.mp3',
  1
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
  437,
  'progression',
  'II-V in G · 30',
  'II-V in G · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_6',
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
  437,
  'II-V in G · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-g-30.mp3',
  1
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
  438,
  'progression',
  '複合フレーズ · II-V in G 26-30',
  'Composite · II-V in G 26-30',
  'easy',
  '',
  'II-V in G 26-30',
  'II-V in G 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_g_6',
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
VALUES ('phrases', 438, 'A', 1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_403 uuid;
  v_chord_403_0 uuid;
  v_chord_403_1 uuid;
  v_phrase_404 uuid;
  v_chord_404_0 uuid;
  v_chord_404_1 uuid;
  v_phrase_405 uuid;
  v_chord_405_0 uuid;
  v_chord_405_1 uuid;
  v_phrase_406 uuid;
  v_chord_406_0 uuid;
  v_chord_406_1 uuid;
  v_phrase_407 uuid;
  v_chord_407_0 uuid;
  v_chord_407_1 uuid;
  v_phrase_409 uuid;
  v_chord_409_0 uuid;
  v_chord_409_1 uuid;
  v_phrase_410 uuid;
  v_chord_410_0 uuid;
  v_chord_410_1 uuid;
  v_phrase_411 uuid;
  v_chord_411_0 uuid;
  v_chord_411_1 uuid;
  v_phrase_412 uuid;
  v_chord_412_0 uuid;
  v_chord_412_1 uuid;
  v_phrase_413 uuid;
  v_chord_413_0 uuid;
  v_chord_413_1 uuid;
  v_phrase_415 uuid;
  v_chord_415_0 uuid;
  v_chord_415_1 uuid;
  v_phrase_416 uuid;
  v_chord_416_0 uuid;
  v_chord_416_1 uuid;
  v_phrase_417 uuid;
  v_chord_417_0 uuid;
  v_chord_417_1 uuid;
  v_phrase_418 uuid;
  v_chord_418_0 uuid;
  v_chord_418_1 uuid;
  v_phrase_419 uuid;
  v_chord_419_0 uuid;
  v_chord_419_1 uuid;
  v_phrase_421 uuid;
  v_chord_421_0 uuid;
  v_chord_421_1 uuid;
  v_phrase_422 uuid;
  v_chord_422_0 uuid;
  v_chord_422_1 uuid;
  v_phrase_423 uuid;
  v_chord_423_0 uuid;
  v_chord_423_1 uuid;
  v_phrase_424 uuid;
  v_chord_424_0 uuid;
  v_chord_424_1 uuid;
  v_phrase_425 uuid;
  v_chord_425_0 uuid;
  v_chord_425_1 uuid;
  v_phrase_427 uuid;
  v_chord_427_0 uuid;
  v_chord_427_1 uuid;
  v_phrase_428 uuid;
  v_chord_428_0 uuid;
  v_chord_428_1 uuid;
  v_phrase_429 uuid;
  v_chord_429_0 uuid;
  v_chord_429_1 uuid;
  v_phrase_430 uuid;
  v_chord_430_0 uuid;
  v_chord_430_1 uuid;
  v_phrase_431 uuid;
  v_chord_431_0 uuid;
  v_chord_431_1 uuid;
  v_phrase_433 uuid;
  v_chord_433_0 uuid;
  v_chord_433_1 uuid;
  v_phrase_434 uuid;
  v_chord_434_0 uuid;
  v_chord_434_1 uuid;
  v_phrase_435 uuid;
  v_chord_435_0 uuid;
  v_chord_435_1 uuid;
  v_phrase_436 uuid;
  v_chord_436_0 uuid;
  v_chord_436_1 uuid;
  v_phrase_437 uuid;
  v_chord_437_0 uuid;
  v_chord_437_1 uuid;
  v_comp_408 uuid;
  v_comp_414 uuid;
  v_comp_420 uuid;
  v_comp_426 uuid;
  v_comp_432 uuid;
  v_comp_438 uuid;
BEGIN
  SELECT id INTO v_phrase_403 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 403;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_403, 0, 'Am7', 1)
  RETURNING id INTO v_chord_403_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_403_0, 0, 71, 11, 'B4', 1),
    (v_chord_403_0, 1, 67, 7, 'G4', 1),
    (v_chord_403_0, 2, 64, 4, 'E4', 1),
    (v_chord_403_0, 3, 60, 0, 'C4', 1),
    (v_chord_403_0, 4, 64, 4, 'E4', 1),
    (v_chord_403_0, 5, 67, 7, 'G4', 1),
    (v_chord_403_0, 6, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_403, 1, 'D7', 2)
  RETURNING id INTO v_chord_403_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_403_1, 0, 74, 2, 'D5', 1),
    (v_chord_403_1, 1, 72, 0, 'C5', 1),
    (v_chord_403_1, 2, 67, 7, 'G4', 1),
    (v_chord_403_1, 3, 64, 4, 'E4', 1),
    (v_chord_403_1, 4, 71, 11, 'B4', 1),
    (v_chord_403_1, 5, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_404 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 404;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_404, 0, 'Am7', 1)
  RETURNING id INTO v_chord_404_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_404_0, 0, 58, 10, 'A#3', 1),
    (v_chord_404_0, 1, 59, 11, 'B3', 1),
    (v_chord_404_0, 2, 62, 2, 'D4', 1),
    (v_chord_404_0, 3, 59, 11, 'B3', 1),
    (v_chord_404_0, 4, 60, 0, 'C4', 1),
    (v_chord_404_0, 5, 64, 4, 'E4', 1),
    (v_chord_404_0, 6, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_404, 1, 'D7', 2)
  RETURNING id INTO v_chord_404_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_404_1, 0, 71, 11, 'B4', 1),
    (v_chord_404_1, 1, 69, 9, 'A4', 1),
    (v_chord_404_1, 2, 64, 4, 'E4', 1),
    (v_chord_404_1, 3, 60, 0, 'C4', 1),
    (v_chord_404_1, 4, 59, 11, 'B3', 1),
    (v_chord_404_1, 5, 57, 9, 'A3', 1);
  SELECT id INTO v_phrase_405 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 405;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_405, 0, 'Am7', 1)
  RETURNING id INTO v_chord_405_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_405_0, 0, 57, 9, 'A3', 1),
    (v_chord_405_0, 1, 59, 11, 'B3', 1),
    (v_chord_405_0, 2, 60, 0, 'C4', 1),
    (v_chord_405_0, 3, 62, 2, 'D4', 1),
    (v_chord_405_0, 4, 64, 4, 'E4', 1),
    (v_chord_405_0, 5, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_405, 1, 'D7', 2)
  RETURNING id INTO v_chord_405_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_405_1, 0, 66, 6, 'F#4', 1),
    (v_chord_405_1, 1, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_406 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 406;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_406, 0, 'Am7', 1)
  RETURNING id INTO v_chord_406_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_406_0, 0, 74, 2, 'D5', 1),
    (v_chord_406_0, 1, 72, 0, 'C5', 1),
    (v_chord_406_0, 2, 67, 7, 'G4', 1),
    (v_chord_406_0, 3, 64, 4, 'E4', 1),
    (v_chord_406_0, 4, 71, 11, 'B4', 1),
    (v_chord_406_0, 5, 68, 8, 'G#4', 1),
    (v_chord_406_0, 6, 69, 9, 'A4', 1),
    (v_chord_406_0, 7, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_406, 1, 'D7', 2)
  RETURNING id INTO v_chord_406_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_406_1, 0, 72, 0, 'C5', 1),
    (v_chord_406_1, 1, 74, 2, 'D5', 1),
    (v_chord_406_1, 2, 76, 4, 'E5', 1),
    (v_chord_406_1, 3, 72, 0, 'C5', 1),
    (v_chord_406_1, 4, 71, 11, 'B4', 1),
    (v_chord_406_1, 5, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_407 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 407;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_407, 0, 'Am7', 1)
  RETURNING id INTO v_chord_407_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_407_0, 0, 60, 0, 'C4', 1),
    (v_chord_407_0, 1, 62, 2, 'D4', 1),
    (v_chord_407_0, 2, 64, 4, 'E4', 1),
    (v_chord_407_0, 3, 60, 0, 'C4', 1),
    (v_chord_407_0, 4, 59, 11, 'B3', 1),
    (v_chord_407_0, 5, 57, 9, 'A3', 1),
    (v_chord_407_0, 6, 56, 8, 'G#3', 1),
    (v_chord_407_0, 7, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_407, 1, 'D7', 2)
  RETURNING id INTO v_chord_407_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_407_1, 0, 57, 9, 'A3', 1),
    (v_chord_407_1, 1, 55, 7, 'G3', 1),
    (v_chord_407_1, 2, 53, 5, 'E#3', 1),
    (v_chord_407_1, 3, 54, 6, 'F#3', 1),
    (v_chord_407_1, 4, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_409 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 409;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_409, 0, 'Am7', 1)
  RETURNING id INTO v_chord_409_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_409_0, 0, 69, 9, 'A4', 1),
    (v_chord_409_0, 1, 72, 0, 'C5', 1),
    (v_chord_409_0, 2, 76, 4, 'E5', 1),
    (v_chord_409_0, 3, 79, 7, 'G5', 1),
    (v_chord_409_0, 4, 76, 4, 'E5', 1),
    (v_chord_409_0, 5, 77, 5, 'E#5', 1),
    (v_chord_409_0, 6, 78, 6, 'F#5', 1),
    (v_chord_409_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_409, 1, 'D7', 2)
  RETURNING id INTO v_chord_409_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_409_1, 0, 72, 0, 'C5', 1),
    (v_chord_409_1, 1, 76, 4, 'E5', 1),
    (v_chord_409_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_409_1, 3, 73, 1, 'C#5', 1),
    (v_chord_409_1, 4, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_410 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 410;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_410, 0, 'Am7', 1)
  RETURNING id INTO v_chord_410_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_410_0, 0, 57, 9, 'A3', 1),
    (v_chord_410_0, 1, 59, 11, 'B3', 1),
    (v_chord_410_0, 2, 60, 0, 'C4', 1),
    (v_chord_410_0, 3, 62, 2, 'D4', 1),
    (v_chord_410_0, 4, 64, 4, 'E4', 1),
    (v_chord_410_0, 5, 66, 6, 'F#4', 1),
    (v_chord_410_0, 6, 67, 7, 'G4', 1),
    (v_chord_410_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_410, 1, 'D7', 2)
  RETURNING id INTO v_chord_410_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_410_1, 0, 71, 11, 'B4', 1),
    (v_chord_410_1, 1, 74, 2, 'D5', 1),
    (v_chord_410_1, 2, 72, 0, 'C5', 1),
    (v_chord_410_1, 3, 64, 4, 'E4', 1),
    (v_chord_410_1, 4, 67, 7, 'G4', 1),
    (v_chord_410_1, 5, 71, 11, 'B4', 1),
    (v_chord_410_1, 6, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_411 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 411;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_411, 0, 'Am7', 1)
  RETURNING id INTO v_chord_411_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_411_0, 0, 71, 11, 'B4', 1),
    (v_chord_411_0, 1, 68, 8, 'G#4', 1),
    (v_chord_411_0, 2, 69, 9, 'A4', 1),
    (v_chord_411_0, 3, 71, 11, 'B4', 1),
    (v_chord_411_0, 4, 72, 0, 'C5', 1),
    (v_chord_411_0, 5, 74, 2, 'D5', 1),
    (v_chord_411_0, 6, 76, 4, 'E5', 1),
    (v_chord_411_0, 7, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_411, 1, 'D7', 2)
  RETURNING id INTO v_chord_411_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_411_1, 0, 69, 9, 'A4', 1),
    (v_chord_411_1, 1, 67, 7, 'G4', 1),
    (v_chord_411_1, 2, 65, 5, 'E#4', 1),
    (v_chord_411_1, 3, 66, 6, 'F#4', 1),
    (v_chord_411_1, 4, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_412 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 412;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_412, 0, 'Am7', 1)
  RETURNING id INTO v_chord_412_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_412_0, 0, 60, 0, 'C4', 1),
    (v_chord_412_0, 1, 62, 2, 'D4', 1),
    (v_chord_412_0, 2, 64, 4, 'E4', 1),
    (v_chord_412_0, 3, 67, 7, 'G4', 1),
    (v_chord_412_0, 4, 71, 11, 'B4', 1),
    (v_chord_412_0, 5, 72, 0, 'C5', 1),
    (v_chord_412_0, 6, 68, 8, 'G#4', 1),
    (v_chord_412_0, 7, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_412, 1, 'D7', 2)
  RETURNING id INTO v_chord_412_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_412_1, 0, 69, 9, 'A4', 1),
    (v_chord_412_1, 1, 67, 7, 'G4', 1),
    (v_chord_412_1, 2, 64, 4, 'E4', 1),
    (v_chord_412_1, 3, 65, 5, 'E#4', 1),
    (v_chord_412_1, 4, 66, 6, 'F#4', 1),
    (v_chord_412_1, 5, 64, 4, 'E4', 1),
    (v_chord_412_1, 6, 62, 2, 'D4', 1),
    (v_chord_412_1, 7, 61, 1, 'Db4', 1);
  SELECT id INTO v_phrase_413 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 413;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_413, 0, 'Am7', 1)
  RETURNING id INTO v_chord_413_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_413_0, 0, 66, 6, 'F#4', 1),
    (v_chord_413_0, 1, 67, 7, 'G4', 1),
    (v_chord_413_0, 2, 64, 4, 'E4', 1),
    (v_chord_413_0, 3, 60, 0, 'C4', 1),
    (v_chord_413_0, 4, 59, 11, 'B3', 1),
    (v_chord_413_0, 5, 60, 0, 'C4', 1),
    (v_chord_413_0, 6, 64, 4, 'E4', 1),
    (v_chord_413_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_413, 1, 'D7', 2)
  RETURNING id INTO v_chord_413_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_413_1, 0, 71, 11, 'B4', 1),
    (v_chord_413_1, 1, 69, 9, 'A4', 1),
    (v_chord_413_1, 2, 64, 4, 'E4', 1),
    (v_chord_413_1, 3, 60, 0, 'C4', 1),
    (v_chord_413_1, 4, 59, 11, 'B3', 1),
    (v_chord_413_1, 5, 57, 9, 'A3', 1);
  SELECT id INTO v_phrase_415 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 415;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_415, 0, 'Am7', 1)
  RETURNING id INTO v_chord_415_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_415_0, 0, 60, 0, 'C4', 1),
    (v_chord_415_0, 1, 64, 4, 'E4', 1),
    (v_chord_415_0, 2, 67, 7, 'G4', 1),
    (v_chord_415_0, 3, 71, 11, 'B4', 1),
    (v_chord_415_0, 4, 74, 2, 'D5', 1),
    (v_chord_415_0, 5, 72, 0, 'C5', 1),
    (v_chord_415_0, 6, 67, 7, 'G4', 1),
    (v_chord_415_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_415, 1, 'D7', 2)
  RETURNING id INTO v_chord_415_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_415_1, 0, 71, 11, 'B4', 1),
    (v_chord_415_1, 1, 69, 9, 'A4', 1),
    (v_chord_415_1, 2, 67, 7, 'G4', 1),
    (v_chord_415_1, 3, 66, 6, 'F#4', 1),
    (v_chord_415_1, 4, 64, 4, 'E4', 1),
    (v_chord_415_1, 5, 62, 2, 'D4', 1),
    (v_chord_415_1, 6, 61, 1, 'C#4', 1);
  SELECT id INTO v_phrase_416 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 416;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_416, 0, 'Am7', 1)
  RETURNING id INTO v_chord_416_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_416_0, 0, 69, 9, 'A4', 1),
    (v_chord_416_0, 1, 71, 11, 'B4', 1),
    (v_chord_416_0, 2, 72, 0, 'C5', 1),
    (v_chord_416_0, 3, 74, 2, 'D5', 1),
    (v_chord_416_0, 4, 76, 4, 'E5', 1),
    (v_chord_416_0, 5, 72, 0, 'C5', 1),
    (v_chord_416_0, 6, 69, 9, 'A4', 1),
    (v_chord_416_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_416, 1, 'D7', 2)
  RETURNING id INTO v_chord_416_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_416_1, 0, 68, 8, 'G#4', 1),
    (v_chord_416_1, 1, 67, 7, 'G4', 1),
    (v_chord_416_1, 2, 65, 5, 'E#4', 1),
    (v_chord_416_1, 3, 66, 6, 'F#4', 1),
    (v_chord_416_1, 4, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_417 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 417;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_417, 0, 'Am7', 1)
  RETURNING id INTO v_chord_417_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_417_0, 0, 74, 2, 'D5', 1),
    (v_chord_417_0, 1, 73, 1, 'Db5', 1),
    (v_chord_417_0, 2, 72, 0, 'C5', 1),
    (v_chord_417_0, 3, 64, 4, 'E4', 1),
    (v_chord_417_0, 4, 67, 7, 'G4', 1),
    (v_chord_417_0, 5, 71, 11, 'B4', 1),
    (v_chord_417_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_417_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_417, 1, 'D7', 2)
  RETURNING id INTO v_chord_417_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_417_1, 0, 69, 9, 'A4', 1),
    (v_chord_417_1, 1, 71, 11, 'B4', 1),
    (v_chord_417_1, 2, 72, 0, 'C5', 1),
    (v_chord_417_1, 3, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_418 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 418;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_418, 0, 'Am7', 1)
  RETURNING id INTO v_chord_418_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_418_0, 0, 62, 2, 'D4', 1),
    (v_chord_418_0, 1, 60, 0, 'C4', 1),
    (v_chord_418_0, 2, 62, 2, 'D4', 1),
    (v_chord_418_0, 3, 60, 0, 'C4', 1),
    (v_chord_418_0, 4, 59, 11, 'B3', 1),
    (v_chord_418_0, 5, 60, 0, 'C4', 1),
    (v_chord_418_0, 6, 64, 4, 'E4', 1),
    (v_chord_418_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_418, 1, 'D7', 2)
  RETURNING id INTO v_chord_418_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_418_1, 0, 71, 11, 'B4', 1),
    (v_chord_418_1, 1, 74, 2, 'D5', 1),
    (v_chord_418_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_418_1, 3, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_419 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 419;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_419, 0, 'Am7', 1)
  RETURNING id INTO v_chord_419_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_419_0, 0, 59, 11, 'B3', 1),
    (v_chord_419_0, 1, 60, 0, 'C4', 1),
    (v_chord_419_0, 2, 64, 4, 'E4', 1),
    (v_chord_419_0, 3, 67, 7, 'G4', 1),
    (v_chord_419_0, 4, 71, 11, 'B4', 1),
    (v_chord_419_0, 5, 74, 2, 'D5', 1),
    (v_chord_419_0, 6, 72, 0, 'C5', 1),
    (v_chord_419_0, 7, 67, 7, 'G4', 1),
    (v_chord_419_0, 8, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_419, 1, 'D7', 2)
  RETURNING id INTO v_chord_419_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_419_1, 0, 63, 3, 'Eb4', 1),
    (v_chord_419_1, 1, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_421 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 421;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_421, 0, 'Am7', 1)
  RETURNING id INTO v_chord_421_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_421_0, 0, 72, 0, 'C5', 1),
    (v_chord_421_0, 1, 74, 2, 'D5', 1),
    (v_chord_421_0, 2, 72, 0, 'C5', 1),
    (v_chord_421_0, 3, 71, 11, 'B4', 1),
    (v_chord_421_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_421_0, 5, 69, 9, 'A4', 1),
    (v_chord_421_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_421_0, 7, 67, 7, 'G4', 1),
    (v_chord_421_0, 8, 65, 5, 'E#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_421, 1, 'D7', 2)
  RETURNING id INTO v_chord_421_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_421_1, 0, 66, 6, 'F#4', 1),
    (v_chord_421_1, 1, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_422 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 422;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_422, 0, 'Am7', 1)
  RETURNING id INTO v_chord_422_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_422_0, 0, 60, 0, 'C4', 1),
    (v_chord_422_0, 1, 62, 2, 'D4', 1),
    (v_chord_422_0, 2, 60, 0, 'C4', 1),
    (v_chord_422_0, 3, 59, 11, 'B3', 1),
    (v_chord_422_0, 4, 60, 0, 'C4', 1),
    (v_chord_422_0, 5, 57, 9, 'A3', 1),
    (v_chord_422_0, 6, 59, 11, 'B3', 1),
    (v_chord_422_0, 7, 60, 0, 'C4', 1),
    (v_chord_422_0, 8, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_422, 1, 'D7', 2)
  RETURNING id INTO v_chord_422_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_422_1, 0, 64, 4, 'E4', 1),
    (v_chord_422_1, 1, 67, 7, 'G4', 1),
    (v_chord_422_1, 2, 64, 4, 'E4', 1),
    (v_chord_422_1, 3, 65, 5, 'E#4', 1),
    (v_chord_422_1, 4, 66, 6, 'F#4', 1),
    (v_chord_422_1, 5, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_423 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 423;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_423, 0, 'Am7', 1)
  RETURNING id INTO v_chord_423_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_423_0, 0, 72, 0, 'C5', 1),
    (v_chord_423_0, 1, 67, 7, 'G4', 1),
    (v_chord_423_0, 2, 68, 8, 'G#4', 1),
    (v_chord_423_0, 3, 71, 11, 'B4', 1),
    (v_chord_423_0, 4, 69, 9, 'A4', 1),
    (v_chord_423_0, 5, 64, 4, 'E4', 1),
    (v_chord_423_0, 6, 67, 7, 'G4', 1),
    (v_chord_423_0, 7, 65, 5, 'E#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_423, 1, 'D7', 2)
  RETURNING id INTO v_chord_423_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_423_1, 0, 66, 6, 'F#4', 1),
    (v_chord_423_1, 1, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_424 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 424;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_424, 0, 'Am7', 1)
  RETURNING id INTO v_chord_424_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_424_0, 0, 72, 0, 'C5', 1),
    (v_chord_424_0, 1, 67, 7, 'G4', 1),
    (v_chord_424_0, 2, 68, 8, 'G#4', 1),
    (v_chord_424_0, 3, 71, 11, 'B4', 1),
    (v_chord_424_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_424_0, 5, 68, 8, 'G#4', 1),
    (v_chord_424_0, 6, 69, 9, 'A4', 1),
    (v_chord_424_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_424, 1, 'D7', 2)
  RETURNING id INTO v_chord_424_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_424_1, 0, 67, 7, 'G4', 1),
    (v_chord_424_1, 1, 65, 5, 'E#4', 1),
    (v_chord_424_1, 2, 66, 6, 'F#4', 1),
    (v_chord_424_1, 3, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_425 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 425;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_425, 0, 'Am7', 1)
  RETURNING id INTO v_chord_425_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_425_0, 0, 64, 4, 'E4', 1),
    (v_chord_425_0, 1, 67, 7, 'G4', 1),
    (v_chord_425_0, 2, 71, 11, 'B4', 1),
    (v_chord_425_0, 3, 74, 2, 'D5', 1),
    (v_chord_425_0, 4, 71, 11, 'B4', 1),
    (v_chord_425_0, 5, 72, 0, 'C5', 1),
    (v_chord_425_0, 6, 76, 4, 'E5', 1),
    (v_chord_425_0, 7, 79, 7, 'G5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_425, 1, 'D7', 2)
  RETURNING id INTO v_chord_425_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_425_1, 0, 83, 11, 'B5', 1),
    (v_chord_425_1, 1, 81, 9, 'A5', 1),
    (v_chord_425_1, 2, 76, 4, 'E5', 1),
    (v_chord_425_1, 3, 72, 0, 'C5', 1),
    (v_chord_425_1, 4, 71, 11, 'B4', 1),
    (v_chord_425_1, 5, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_427 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 427;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_427, 0, 'Am7', 1)
  RETURNING id INTO v_chord_427_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_427_0, 0, 68, 8, 'G#4', 1),
    (v_chord_427_0, 1, 69, 9, 'A4', 1),
    (v_chord_427_0, 2, 71, 11, 'B4', 1),
    (v_chord_427_0, 3, 72, 0, 'C5', 1),
    (v_chord_427_0, 4, 74, 2, 'D5', 1),
    (v_chord_427_0, 5, 76, 4, 'E5', 1),
    (v_chord_427_0, 6, 79, 7, 'G5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_427, 1, 'D7', 2)
  RETURNING id INTO v_chord_427_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_427_1, 0, 78, 6, 'F#5', 1),
    (v_chord_427_1, 1, 79, 7, 'G5', 1),
    (v_chord_427_1, 2, 78, 6, 'F#5', 1),
    (v_chord_427_1, 3, 76, 4, 'E5', 1),
    (v_chord_427_1, 4, 75, 3, 'Eb5', 1),
    (v_chord_427_1, 5, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_428 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 428;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_428, 0, 'Am7', 1)
  RETURNING id INTO v_chord_428_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_428_0, 0, 63, 3, 'D#4', 1),
    (v_chord_428_0, 1, 64, 4, 'E4', 1),
    (v_chord_428_0, 2, 67, 7, 'G4', 1),
    (v_chord_428_0, 3, 71, 11, 'B4', 1),
    (v_chord_428_0, 4, 74, 2, 'D5', 1),
    (v_chord_428_0, 5, 73, 1, 'Db5', 1),
    (v_chord_428_0, 6, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_428, 1, 'D7', 2)
  RETURNING id INTO v_chord_428_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_428_1, 0, 72, 0, 'C5', 1),
    (v_chord_428_1, 1, 64, 4, 'E4', 1),
    (v_chord_428_1, 2, 67, 7, 'G4', 1),
    (v_chord_428_1, 3, 71, 11, 'B4', 1),
    (v_chord_428_1, 4, 71, 11, 'B4', 1),
    (v_chord_428_1, 5, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_429 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 429;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_429, 0, 'Am7', 1)
  RETURNING id INTO v_chord_429_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_429_0, 0, 70, 10, 'A#4', 1),
    (v_chord_429_0, 1, 71, 11, 'B4', 1),
    (v_chord_429_0, 2, 74, 2, 'D5', 1),
    (v_chord_429_0, 3, 71, 11, 'B4', 1),
    (v_chord_429_0, 4, 72, 0, 'C5', 1),
    (v_chord_429_0, 5, 76, 4, 'E5', 1),
    (v_chord_429_0, 6, 79, 7, 'G5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_429, 1, 'D7', 2)
  RETURNING id INTO v_chord_429_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_429_1, 0, 83, 11, 'B5', 1),
    (v_chord_429_1, 1, 81, 9, 'A5', 1),
    (v_chord_429_1, 2, 80, 8, 'G#5', 1),
    (v_chord_429_1, 3, 78, 6, 'F#5', 1),
    (v_chord_429_1, 4, 77, 5, 'F5', 1),
    (v_chord_429_1, 5, 75, 3, 'Eb5', 1),
    (v_chord_429_1, 6, 74, 2, 'D5', 1),
    (v_chord_429_1, 7, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_430 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 430;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_430, 0, 'Am7', 1)
  RETURNING id INTO v_chord_430_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_430_0, 0, 76, 4, 'E5', 1),
    (v_chord_430_0, 1, 72, 0, 'C5', 1),
    (v_chord_430_0, 2, 71, 11, 'B4', 1),
    (v_chord_430_0, 3, 69, 9, 'A4', 1),
    (v_chord_430_0, 4, 74, 2, 'D5', 1),
    (v_chord_430_0, 5, 72, 0, 'C5', 1),
    (v_chord_430_0, 6, 67, 7, 'G4', 1),
    (v_chord_430_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_430, 1, 'D7', 2)
  RETURNING id INTO v_chord_430_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_430_1, 0, 68, 8, 'G#4', 1),
    (v_chord_430_1, 1, 71, 11, 'B4', 1),
    (v_chord_430_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_430_1, 3, 68, 8, 'G#4', 1),
    (v_chord_430_1, 4, 69, 9, 'A4', 1),
    (v_chord_430_1, 5, 71, 11, 'B4', 1),
    (v_chord_430_1, 6, 72, 0, 'C5', 1),
    (v_chord_430_1, 7, 74, 2, 'D5', 1);
  SELECT id INTO v_phrase_431 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 431;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_431, 0, 'Am7', 1)
  RETURNING id INTO v_chord_431_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_431_0, 0, 69, 9, 'A4', 1),
    (v_chord_431_0, 1, 68, 8, 'G#4', 1),
    (v_chord_431_0, 2, 69, 9, 'A4', 1),
    (v_chord_431_0, 3, 71, 11, 'B4', 1),
    (v_chord_431_0, 4, 72, 0, 'C5', 1),
    (v_chord_431_0, 5, 74, 2, 'D5', 1),
    (v_chord_431_0, 6, 76, 4, 'E5', 1),
    (v_chord_431_0, 7, 79, 7, 'G5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_431, 1, 'D7', 2)
  RETURNING id INTO v_chord_431_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_431_1, 0, 78, 6, 'F#5', 1),
    (v_chord_431_1, 1, 79, 7, 'G5', 1),
    (v_chord_431_1, 2, 78, 6, 'F#5', 1),
    (v_chord_431_1, 3, 76, 4, 'E5', 1),
    (v_chord_431_1, 4, 75, 3, 'Eb5', 1),
    (v_chord_431_1, 5, 74, 2, 'D5', 1),
    (v_chord_431_1, 6, 73, 1, 'Db5', 1),
    (v_chord_431_1, 7, 72, 0, 'C5', 1),
    (v_chord_431_1, 8, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_433 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 433;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_433, 0, 'Am7', 1)
  RETURNING id INTO v_chord_433_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_433_0, 0, 69, 9, 'A4', 1),
    (v_chord_433_0, 1, 68, 8, 'G#4', 1),
    (v_chord_433_0, 2, 69, 9, 'A4', 1),
    (v_chord_433_0, 3, 71, 11, 'B4', 1),
    (v_chord_433_0, 4, 72, 0, 'C5', 1),
    (v_chord_433_0, 5, 74, 2, 'D5', 1),
    (v_chord_433_0, 6, 76, 4, 'E5', 1),
    (v_chord_433_0, 7, 70, 10, 'A#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_433, 1, 'D7', 2)
  RETURNING id INTO v_chord_433_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_433_1, 0, 71, 11, 'B4', 1),
    (v_chord_433_1, 1, 74, 2, 'D5', 1),
    (v_chord_433_1, 2, 72, 0, 'C5', 1),
    (v_chord_433_1, 3, 64, 4, 'E4', 1),
    (v_chord_433_1, 4, 67, 7, 'G4', 1),
    (v_chord_433_1, 5, 71, 11, 'B4', 1),
    (v_chord_433_1, 6, 70, 10, 'Bb4', 1),
    (v_chord_433_1, 7, 68, 8, 'G#4', 1);
  SELECT id INTO v_phrase_434 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 434;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_434, 0, 'Am7', 1)
  RETURNING id INTO v_chord_434_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_434_0, 0, 74, 2, 'D5', 1),
    (v_chord_434_0, 1, 72, 0, 'C5', 1),
    (v_chord_434_0, 2, 67, 7, 'G4', 1),
    (v_chord_434_0, 3, 64, 4, 'E4', 1),
    (v_chord_434_0, 4, 68, 8, 'G#4', 1),
    (v_chord_434_0, 5, 71, 11, 'B4', 1),
    (v_chord_434_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_434_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_434, 1, 'D7', 2)
  RETURNING id INTO v_chord_434_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_434_1, 0, 69, 9, 'A4', 1),
    (v_chord_434_1, 1, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_435 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 435;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_435, 0, 'Am7', 1)
  RETURNING id INTO v_chord_435_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_435_0, 0, 66, 6, 'F#4', 1),
    (v_chord_435_0, 1, 67, 7, 'G4', 1),
    (v_chord_435_0, 2, 64, 4, 'E4', 1),
    (v_chord_435_0, 3, 60, 0, 'C4', 1),
    (v_chord_435_0, 4, 59, 11, 'B3', 1),
    (v_chord_435_0, 5, 57, 9, 'A3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_435, 1, 'D7', 2)
  RETURNING id INTO v_chord_435_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_435_1, 0, 59, 11, 'B3', 1),
    (v_chord_435_1, 1, 60, 0, 'C4', 1),
    (v_chord_435_1, 2, 62, 2, 'D4', 1),
    (v_chord_435_1, 3, 63, 3, 'D#4', 1),
    (v_chord_435_1, 4, 66, 6, 'F#4', 1),
    (v_chord_435_1, 5, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_436 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 436;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_436, 0, 'Am7', 1)
  RETURNING id INTO v_chord_436_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_436_0, 0, 66, 6, 'F#4', 1),
    (v_chord_436_0, 1, 67, 7, 'G4', 1),
    (v_chord_436_0, 2, 64, 4, 'E4', 1),
    (v_chord_436_0, 3, 60, 0, 'C4', 1),
    (v_chord_436_0, 4, 59, 11, 'B3', 1),
    (v_chord_436_0, 5, 57, 9, 'A3', 1),
    (v_chord_436_0, 6, 56, 8, 'G#3', 1),
    (v_chord_436_0, 7, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_436, 1, 'D7', 2)
  RETURNING id INTO v_chord_436_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_436_1, 0, 57, 9, 'A3', 1),
    (v_chord_436_1, 1, 52, 4, 'E3', 1);
  SELECT id INTO v_phrase_437 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 437;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_437, 0, 'Am7', 1)
  RETURNING id INTO v_chord_437_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_437_0, 0, 68, 8, 'G#4', 1),
    (v_chord_437_0, 1, 69, 9, 'A4', 1),
    (v_chord_437_0, 2, 72, 0, 'C5', 1),
    (v_chord_437_0, 3, 76, 4, 'E5', 1),
    (v_chord_437_0, 4, 79, 7, 'G5', 1),
    (v_chord_437_0, 5, 76, 4, 'E5', 1),
    (v_chord_437_0, 6, 72, 0, 'C5', 1),
    (v_chord_437_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_437, 1, 'D7', 2)
  RETURNING id INTO v_chord_437_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_437_1, 0, 71, 11, 'B4', 1),
    (v_chord_437_1, 1, 74, 2, 'D5', 1);
  SELECT id INTO v_comp_408 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 408;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_408;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_408, 403, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_408, 404, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_408, 405, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_408, 406, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_408, 407, 4);
  SELECT id INTO v_comp_414 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 414;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_414;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_414, 409, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_414, 410, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_414, 411, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_414, 412, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_414, 413, 4);
  SELECT id INTO v_comp_420 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 420;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_420;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_420, 415, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_420, 416, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_420, 417, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_420, 418, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_420, 419, 4);
  SELECT id INTO v_comp_426 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 426;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_426;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_426, 421, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_426, 422, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_426, 423, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_426, 424, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_426, 425, 4);
  SELECT id INTO v_comp_432 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 432;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_432;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_432, 427, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_432, 428, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_432, 429, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_432, 430, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_432, 431, 4);
  SELECT id INTO v_comp_438 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 438;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_438;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_438, 433, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_438, 434, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_438, 435, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_438, 436, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_438, 437, 4);
END $$;

COMMIT;