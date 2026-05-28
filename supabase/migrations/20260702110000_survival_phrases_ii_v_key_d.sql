BEGIN;

-- Survival Phrases II-V key D: stages 367-402
-- MusicXML: 251譜面_+2st_D.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 367 AND 402
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 367 AND 402;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 367 AND 402
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 367 AND 402
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 367 AND 402;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 367 AND 402;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_d_1', 'II-V in D 1-5', 'II-V in D 1-5', 61)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_d_2', 'II-V in D 6-10', 'II-V in D 6-10', 62)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_d_3', 'II-V in D 11-15', 'II-V in D 11-15', 63)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_d_4', 'II-V in D 16-20', 'II-V in D 16-20', 64)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_d_5', 'II-V in D 21-25', 'II-V in D 21-25', 65)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_d_6', 'II-V in D 26-30', 'II-V in D 26-30', 66)
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
  367,
  'progression',
  'II-V in D · 1',
  'II-V in D · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_1',
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
  367,
  'II-V in D · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-01.mp3',
  2
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
  368,
  'progression',
  'II-V in D · 2',
  'II-V in D · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_1',
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
  368,
  'II-V in D · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-02.mp3',
  2
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
  369,
  'progression',
  'II-V in D · 3',
  'II-V in D · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_1',
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
  369,
  'II-V in D · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-03.mp3',
  2
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
  370,
  'progression',
  'II-V in D · 4',
  'II-V in D · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_1',
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
  370,
  'II-V in D · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-04.mp3',
  2
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
  371,
  'progression',
  'II-V in D · 5',
  'II-V in D · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_1',
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
  371,
  'II-V in D · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-05.mp3',
  2
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
  372,
  'progression',
  '複合フレーズ · II-V in D 1-5',
  'Composite · II-V in D 1-5',
  'easy',
  '',
  'II-V in D 1-5',
  'II-V in D 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_1',
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
VALUES ('phrases', 372, 'B', 2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  373,
  'progression',
  'II-V in D · 6',
  'II-V in D · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_2',
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
  373,
  'II-V in D · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-06.mp3',
  2
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
  374,
  'progression',
  'II-V in D · 7',
  'II-V in D · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_2',
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
  374,
  'II-V in D · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-07.mp3',
  2
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
  375,
  'progression',
  'II-V in D · 8',
  'II-V in D · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_2',
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
  375,
  'II-V in D · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-08.mp3',
  2
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
  376,
  'progression',
  'II-V in D · 9',
  'II-V in D · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_2',
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
  376,
  'II-V in D · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-09.mp3',
  2
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
  377,
  'progression',
  'II-V in D · 10',
  'II-V in D · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_2',
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
  377,
  'II-V in D · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-10.mp3',
  2
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
  378,
  'progression',
  '複合フレーズ · II-V in D 6-10',
  'Composite · II-V in D 6-10',
  'easy',
  '',
  'II-V in D 6-10',
  'II-V in D 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_2',
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
VALUES ('phrases', 378, 'C', 2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  379,
  'progression',
  'II-V in D · 11',
  'II-V in D · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_3',
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
  379,
  'II-V in D · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-11.mp3',
  2
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
  380,
  'progression',
  'II-V in D · 12',
  'II-V in D · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_3',
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
  380,
  'II-V in D · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-12.mp3',
  2
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
  381,
  'progression',
  'II-V in D · 13',
  'II-V in D · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_3',
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
  381,
  'II-V in D · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-13.mp3',
  2
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
  382,
  'progression',
  'II-V in D · 14',
  'II-V in D · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_3',
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
  382,
  'II-V in D · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-14.mp3',
  2
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
  383,
  'progression',
  'II-V in D · 15',
  'II-V in D · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_3',
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
  383,
  'II-V in D · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-15.mp3',
  2
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
  384,
  'progression',
  '複合フレーズ · II-V in D 11-15',
  'Composite · II-V in D 11-15',
  'easy',
  '',
  'II-V in D 11-15',
  'II-V in D 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_3',
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
VALUES ('phrases', 384, 'A', 2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  385,
  'progression',
  'II-V in D · 16',
  'II-V in D · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_4',
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
  385,
  'II-V in D · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-16.mp3',
  2
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
  386,
  'progression',
  'II-V in D · 17',
  'II-V in D · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_4',
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
  386,
  'II-V in D · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-17.mp3',
  2
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
  387,
  'progression',
  'II-V in D · 18',
  'II-V in D · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_4',
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
  387,
  'II-V in D · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-18.mp3',
  2
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
  388,
  'progression',
  'II-V in D · 19',
  'II-V in D · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_4',
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
  388,
  'II-V in D · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-19.mp3',
  2
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
  389,
  'progression',
  'II-V in D · 20',
  'II-V in D · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_4',
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
  389,
  'II-V in D · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-20.mp3',
  2
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
  390,
  'progression',
  '複合フレーズ · II-V in D 16-20',
  'Composite · II-V in D 16-20',
  'easy',
  '',
  'II-V in D 16-20',
  'II-V in D 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_4',
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
VALUES ('phrases', 390, 'B', 2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  391,
  'progression',
  'II-V in D · 21',
  'II-V in D · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_5',
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
  391,
  'II-V in D · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-21.mp3',
  2
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
  392,
  'progression',
  'II-V in D · 22',
  'II-V in D · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_5',
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
  392,
  'II-V in D · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-22.mp3',
  2
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
  393,
  'progression',
  'II-V in D · 23',
  'II-V in D · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_5',
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
  393,
  'II-V in D · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-23.mp3',
  2
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
  394,
  'progression',
  'II-V in D · 24',
  'II-V in D · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_5',
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
  394,
  'II-V in D · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-24.mp3',
  2
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
  395,
  'progression',
  'II-V in D · 25',
  'II-V in D · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_5',
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
  395,
  'II-V in D · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-25.mp3',
  2
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
  396,
  'progression',
  '複合フレーズ · II-V in D 21-25',
  'Composite · II-V in D 21-25',
  'easy',
  '',
  'II-V in D 21-25',
  'II-V in D 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_5',
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
VALUES ('phrases', 396, 'C', 2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  397,
  'progression',
  'II-V in D · 26',
  'II-V in D · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_6',
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
  397,
  'II-V in D · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-26.mp3',
  2
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
  398,
  'progression',
  'II-V in D · 27',
  'II-V in D · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_6',
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
  398,
  'II-V in D · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-27.mp3',
  2
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
  399,
  'progression',
  'II-V in D · 28',
  'II-V in D · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_6',
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
  399,
  'II-V in D · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-28.mp3',
  2
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
  400,
  'progression',
  'II-V in D · 29',
  'II-V in D · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_6',
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
  400,
  'II-V in D · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-29.mp3',
  2
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
  401,
  'progression',
  'II-V in D · 30',
  'II-V in D · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_6',
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
  401,
  'II-V in D · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-d-30.mp3',
  2
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
  402,
  'progression',
  '複合フレーズ · II-V in D 26-30',
  'Composite · II-V in D 26-30',
  'easy',
  '',
  'II-V in D 26-30',
  'II-V in D 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_d_6',
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
VALUES ('phrases', 402, 'A', 2, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_367 uuid;
  v_chord_367_0 uuid;
  v_chord_367_1 uuid;
  v_phrase_368 uuid;
  v_chord_368_0 uuid;
  v_chord_368_1 uuid;
  v_phrase_369 uuid;
  v_chord_369_0 uuid;
  v_chord_369_1 uuid;
  v_phrase_370 uuid;
  v_chord_370_0 uuid;
  v_chord_370_1 uuid;
  v_phrase_371 uuid;
  v_chord_371_0 uuid;
  v_chord_371_1 uuid;
  v_phrase_373 uuid;
  v_chord_373_0 uuid;
  v_chord_373_1 uuid;
  v_phrase_374 uuid;
  v_chord_374_0 uuid;
  v_chord_374_1 uuid;
  v_phrase_375 uuid;
  v_chord_375_0 uuid;
  v_chord_375_1 uuid;
  v_phrase_376 uuid;
  v_chord_376_0 uuid;
  v_chord_376_1 uuid;
  v_phrase_377 uuid;
  v_chord_377_0 uuid;
  v_chord_377_1 uuid;
  v_phrase_379 uuid;
  v_chord_379_0 uuid;
  v_chord_379_1 uuid;
  v_phrase_380 uuid;
  v_chord_380_0 uuid;
  v_chord_380_1 uuid;
  v_phrase_381 uuid;
  v_chord_381_0 uuid;
  v_chord_381_1 uuid;
  v_phrase_382 uuid;
  v_chord_382_0 uuid;
  v_chord_382_1 uuid;
  v_phrase_383 uuid;
  v_chord_383_0 uuid;
  v_chord_383_1 uuid;
  v_phrase_385 uuid;
  v_chord_385_0 uuid;
  v_chord_385_1 uuid;
  v_phrase_386 uuid;
  v_chord_386_0 uuid;
  v_chord_386_1 uuid;
  v_phrase_387 uuid;
  v_chord_387_0 uuid;
  v_chord_387_1 uuid;
  v_phrase_388 uuid;
  v_chord_388_0 uuid;
  v_chord_388_1 uuid;
  v_phrase_389 uuid;
  v_chord_389_0 uuid;
  v_chord_389_1 uuid;
  v_phrase_391 uuid;
  v_chord_391_0 uuid;
  v_chord_391_1 uuid;
  v_phrase_392 uuid;
  v_chord_392_0 uuid;
  v_chord_392_1 uuid;
  v_phrase_393 uuid;
  v_chord_393_0 uuid;
  v_chord_393_1 uuid;
  v_phrase_394 uuid;
  v_chord_394_0 uuid;
  v_chord_394_1 uuid;
  v_phrase_395 uuid;
  v_chord_395_0 uuid;
  v_chord_395_1 uuid;
  v_phrase_397 uuid;
  v_chord_397_0 uuid;
  v_chord_397_1 uuid;
  v_phrase_398 uuid;
  v_chord_398_0 uuid;
  v_chord_398_1 uuid;
  v_phrase_399 uuid;
  v_chord_399_0 uuid;
  v_chord_399_1 uuid;
  v_phrase_400 uuid;
  v_chord_400_0 uuid;
  v_chord_400_1 uuid;
  v_phrase_401 uuid;
  v_chord_401_0 uuid;
  v_chord_401_1 uuid;
  v_comp_372 uuid;
  v_comp_378 uuid;
  v_comp_384 uuid;
  v_comp_390 uuid;
  v_comp_396 uuid;
  v_comp_402 uuid;
BEGIN
  SELECT id INTO v_phrase_367 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 367;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_367, 0, 'Em7', 1)
  RETURNING id INTO v_chord_367_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_367_0, 0, 78, 6, 'F#5', 1),
    (v_chord_367_0, 1, 74, 2, 'D5', 1),
    (v_chord_367_0, 2, 71, 11, 'B4', 1),
    (v_chord_367_0, 3, 67, 7, 'G4', 1),
    (v_chord_367_0, 4, 71, 11, 'B4', 1),
    (v_chord_367_0, 5, 74, 2, 'D5', 1),
    (v_chord_367_0, 6, 78, 6, 'F#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_367, 1, 'A7', 2)
  RETURNING id INTO v_chord_367_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_367_1, 0, 81, 9, 'A5', 1),
    (v_chord_367_1, 1, 79, 7, 'G5', 1),
    (v_chord_367_1, 2, 74, 2, 'D5', 1),
    (v_chord_367_1, 3, 71, 11, 'B4', 1),
    (v_chord_367_1, 4, 78, 6, 'F#5', 1),
    (v_chord_367_1, 5, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_368 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 368;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_368, 0, 'Em7', 1)
  RETURNING id INTO v_chord_368_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_368_0, 0, 65, 5, 'E#4', 1),
    (v_chord_368_0, 1, 66, 6, 'F#4', 1),
    (v_chord_368_0, 2, 69, 9, 'A4', 1),
    (v_chord_368_0, 3, 66, 6, 'F#4', 1),
    (v_chord_368_0, 4, 67, 7, 'G4', 1),
    (v_chord_368_0, 5, 71, 11, 'B4', 1),
    (v_chord_368_0, 6, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_368, 1, 'A7', 2)
  RETURNING id INTO v_chord_368_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_368_1, 0, 78, 6, 'F#5', 1),
    (v_chord_368_1, 1, 76, 4, 'E5', 1),
    (v_chord_368_1, 2, 71, 11, 'B4', 1),
    (v_chord_368_1, 3, 67, 7, 'G4', 1),
    (v_chord_368_1, 4, 66, 6, 'F#4', 1),
    (v_chord_368_1, 5, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_369 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 369;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_369, 0, 'Em7', 1)
  RETURNING id INTO v_chord_369_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_369_0, 0, 64, 4, 'E4', 1),
    (v_chord_369_0, 1, 66, 6, 'F#4', 1),
    (v_chord_369_0, 2, 67, 7, 'G4', 1),
    (v_chord_369_0, 3, 69, 9, 'A4', 1),
    (v_chord_369_0, 4, 71, 11, 'B4', 1),
    (v_chord_369_0, 5, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_369, 1, 'A7', 2)
  RETURNING id INTO v_chord_369_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_369_1, 0, 73, 1, 'C#5', 1),
    (v_chord_369_1, 1, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_370 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 370;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_370, 0, 'Em7', 1)
  RETURNING id INTO v_chord_370_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_370_0, 0, 69, 9, 'A4', 1),
    (v_chord_370_0, 1, 67, 7, 'G4', 1),
    (v_chord_370_0, 2, 62, 2, 'D4', 1),
    (v_chord_370_0, 3, 59, 11, 'B3', 1),
    (v_chord_370_0, 4, 66, 6, 'F#4', 1),
    (v_chord_370_0, 5, 63, 3, 'D#4', 1),
    (v_chord_370_0, 6, 64, 4, 'E4', 1),
    (v_chord_370_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_370, 1, 'A7', 2)
  RETURNING id INTO v_chord_370_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_370_1, 0, 67, 7, 'G4', 1),
    (v_chord_370_1, 1, 69, 9, 'A4', 1),
    (v_chord_370_1, 2, 71, 11, 'B4', 1),
    (v_chord_370_1, 3, 67, 7, 'G4', 1),
    (v_chord_370_1, 4, 66, 6, 'F#4', 1),
    (v_chord_370_1, 5, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_371 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 371;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_371, 0, 'Em7', 1)
  RETURNING id INTO v_chord_371_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_371_0, 0, 67, 7, 'G4', 1),
    (v_chord_371_0, 1, 69, 9, 'A4', 1),
    (v_chord_371_0, 2, 71, 11, 'B4', 1),
    (v_chord_371_0, 3, 67, 7, 'G4', 1),
    (v_chord_371_0, 4, 66, 6, 'F#4', 1),
    (v_chord_371_0, 5, 64, 4, 'E4', 1),
    (v_chord_371_0, 6, 63, 3, 'D#4', 1),
    (v_chord_371_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_371, 1, 'A7', 2)
  RETURNING id INTO v_chord_371_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_371_1, 0, 64, 4, 'E4', 1),
    (v_chord_371_1, 1, 62, 2, 'D4', 1),
    (v_chord_371_1, 2, 60, 0, 'B#3', 1),
    (v_chord_371_1, 3, 61, 1, 'C#4', 1),
    (v_chord_371_1, 4, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_373 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 373;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_373, 0, 'Em7', 1)
  RETURNING id INTO v_chord_373_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_373_0, 0, 64, 4, 'E4', 1),
    (v_chord_373_0, 1, 67, 7, 'G4', 1),
    (v_chord_373_0, 2, 71, 11, 'B4', 1),
    (v_chord_373_0, 3, 74, 2, 'D5', 1),
    (v_chord_373_0, 4, 71, 11, 'B4', 1),
    (v_chord_373_0, 5, 72, 0, 'B#4', 1),
    (v_chord_373_0, 6, 73, 1, 'C#5', 1),
    (v_chord_373_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_373, 1, 'A7', 2)
  RETURNING id INTO v_chord_373_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_373_1, 0, 67, 7, 'G4', 1),
    (v_chord_373_1, 1, 71, 11, 'B4', 1),
    (v_chord_373_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_373_1, 3, 68, 8, 'G#4', 1),
    (v_chord_373_1, 4, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_374 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 374;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_374, 0, 'Em7', 1)
  RETURNING id INTO v_chord_374_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_374_0, 0, 64, 4, 'E4', 1),
    (v_chord_374_0, 1, 66, 6, 'F#4', 1),
    (v_chord_374_0, 2, 67, 7, 'G4', 1),
    (v_chord_374_0, 3, 69, 9, 'A4', 1),
    (v_chord_374_0, 4, 71, 11, 'B4', 1),
    (v_chord_374_0, 5, 73, 1, 'C#5', 1),
    (v_chord_374_0, 6, 74, 2, 'D5', 1),
    (v_chord_374_0, 7, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_374, 1, 'A7', 2)
  RETURNING id INTO v_chord_374_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_374_1, 0, 78, 6, 'F#5', 1),
    (v_chord_374_1, 1, 81, 9, 'A5', 1),
    (v_chord_374_1, 2, 79, 7, 'G5', 1),
    (v_chord_374_1, 3, 71, 11, 'B4', 1),
    (v_chord_374_1, 4, 74, 2, 'D5', 1),
    (v_chord_374_1, 5, 78, 6, 'F#5', 1),
    (v_chord_374_1, 6, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_375 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 375;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_375, 0, 'Em7', 1)
  RETURNING id INTO v_chord_375_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_375_0, 0, 66, 6, 'F#4', 1),
    (v_chord_375_0, 1, 63, 3, 'D#4', 1),
    (v_chord_375_0, 2, 64, 4, 'E4', 1),
    (v_chord_375_0, 3, 66, 6, 'F#4', 1),
    (v_chord_375_0, 4, 67, 7, 'G4', 1),
    (v_chord_375_0, 5, 69, 9, 'A4', 1),
    (v_chord_375_0, 6, 71, 11, 'B4', 1),
    (v_chord_375_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_375, 1, 'A7', 2)
  RETURNING id INTO v_chord_375_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_375_1, 0, 64, 4, 'E4', 1),
    (v_chord_375_1, 1, 62, 2, 'D4', 1),
    (v_chord_375_1, 2, 60, 0, 'B#3', 1),
    (v_chord_375_1, 3, 61, 1, 'C#4', 1),
    (v_chord_375_1, 4, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_376 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 376;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_376, 0, 'Em7', 1)
  RETURNING id INTO v_chord_376_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_376_0, 0, 67, 7, 'G4', 1),
    (v_chord_376_0, 1, 69, 9, 'A4', 1),
    (v_chord_376_0, 2, 71, 11, 'B4', 1),
    (v_chord_376_0, 3, 74, 2, 'D5', 1),
    (v_chord_376_0, 4, 78, 6, 'F#5', 1),
    (v_chord_376_0, 5, 79, 7, 'G5', 1),
    (v_chord_376_0, 6, 75, 3, 'D#5', 1),
    (v_chord_376_0, 7, 78, 6, 'F#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_376, 1, 'A7', 2)
  RETURNING id INTO v_chord_376_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_376_1, 0, 76, 4, 'E5', 1),
    (v_chord_376_1, 1, 74, 2, 'D5', 1),
    (v_chord_376_1, 2, 71, 11, 'B4', 1),
    (v_chord_376_1, 3, 72, 0, 'B#4', 1),
    (v_chord_376_1, 4, 73, 1, 'C#5', 1),
    (v_chord_376_1, 5, 71, 11, 'B4', 1),
    (v_chord_376_1, 6, 69, 9, 'A4', 1),
    (v_chord_376_1, 7, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_377 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 377;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_377, 0, 'Em7', 1)
  RETURNING id INTO v_chord_377_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_377_0, 0, 73, 1, 'C#5', 1),
    (v_chord_377_0, 1, 74, 2, 'D5', 1),
    (v_chord_377_0, 2, 71, 11, 'B4', 1),
    (v_chord_377_0, 3, 67, 7, 'G4', 1),
    (v_chord_377_0, 4, 66, 6, 'F#4', 1),
    (v_chord_377_0, 5, 67, 7, 'G4', 1),
    (v_chord_377_0, 6, 71, 11, 'B4', 1),
    (v_chord_377_0, 7, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_377, 1, 'A7', 2)
  RETURNING id INTO v_chord_377_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_377_1, 0, 78, 6, 'F#5', 1),
    (v_chord_377_1, 1, 76, 4, 'E5', 1),
    (v_chord_377_1, 2, 71, 11, 'B4', 1),
    (v_chord_377_1, 3, 67, 7, 'G4', 1),
    (v_chord_377_1, 4, 66, 6, 'F#4', 1),
    (v_chord_377_1, 5, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_379 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 379;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_379, 0, 'Em7', 1)
  RETURNING id INTO v_chord_379_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_379_0, 0, 67, 7, 'G4', 1),
    (v_chord_379_0, 1, 71, 11, 'B4', 1),
    (v_chord_379_0, 2, 74, 2, 'D5', 1),
    (v_chord_379_0, 3, 78, 6, 'F#5', 1),
    (v_chord_379_0, 4, 81, 9, 'A5', 1),
    (v_chord_379_0, 5, 79, 7, 'G5', 1),
    (v_chord_379_0, 6, 74, 2, 'D5', 1),
    (v_chord_379_0, 7, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_379, 1, 'A7', 2)
  RETURNING id INTO v_chord_379_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_379_1, 0, 78, 6, 'F#5', 1),
    (v_chord_379_1, 1, 76, 4, 'E5', 1),
    (v_chord_379_1, 2, 74, 2, 'D5', 1),
    (v_chord_379_1, 3, 73, 1, 'C#5', 1),
    (v_chord_379_1, 4, 71, 11, 'B4', 1),
    (v_chord_379_1, 5, 69, 9, 'A4', 1),
    (v_chord_379_1, 6, 68, 8, 'G#4', 1);
  SELECT id INTO v_phrase_380 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 380;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_380, 0, 'Em7', 1)
  RETURNING id INTO v_chord_380_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_380_0, 0, 64, 4, 'E4', 1),
    (v_chord_380_0, 1, 66, 6, 'F#4', 1),
    (v_chord_380_0, 2, 67, 7, 'G4', 1),
    (v_chord_380_0, 3, 69, 9, 'A4', 1),
    (v_chord_380_0, 4, 71, 11, 'B4', 1),
    (v_chord_380_0, 5, 67, 7, 'G4', 1),
    (v_chord_380_0, 6, 64, 4, 'E4', 1),
    (v_chord_380_0, 7, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_380, 1, 'A7', 2)
  RETURNING id INTO v_chord_380_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_380_1, 0, 63, 3, 'D#4', 1),
    (v_chord_380_1, 1, 62, 2, 'D4', 1),
    (v_chord_380_1, 2, 60, 0, 'B#3', 1),
    (v_chord_380_1, 3, 61, 1, 'C#4', 1),
    (v_chord_380_1, 4, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_381 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 381;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_381, 0, 'Em7', 1)
  RETURNING id INTO v_chord_381_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_381_0, 0, 69, 9, 'A4', 1),
    (v_chord_381_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_381_0, 2, 67, 7, 'G4', 1),
    (v_chord_381_0, 3, 59, 11, 'B3', 1),
    (v_chord_381_0, 4, 62, 2, 'D4', 1),
    (v_chord_381_0, 5, 66, 6, 'F#4', 1),
    (v_chord_381_0, 6, 65, 5, 'F4', 1),
    (v_chord_381_0, 7, 63, 3, 'D#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_381, 1, 'A7', 2)
  RETURNING id INTO v_chord_381_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_381_1, 0, 64, 4, 'E4', 1),
    (v_chord_381_1, 1, 66, 6, 'F#4', 1),
    (v_chord_381_1, 2, 67, 7, 'G4', 1),
    (v_chord_381_1, 3, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_382 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 382;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_382, 0, 'Em7', 1)
  RETURNING id INTO v_chord_382_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_382_0, 0, 69, 9, 'A4', 1),
    (v_chord_382_0, 1, 67, 7, 'G4', 1),
    (v_chord_382_0, 2, 69, 9, 'A4', 1),
    (v_chord_382_0, 3, 67, 7, 'G4', 1),
    (v_chord_382_0, 4, 66, 6, 'F#4', 1),
    (v_chord_382_0, 5, 67, 7, 'G4', 1),
    (v_chord_382_0, 6, 71, 11, 'B4', 1),
    (v_chord_382_0, 7, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_382, 1, 'A7', 2)
  RETURNING id INTO v_chord_382_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_382_1, 0, 78, 6, 'F#5', 1),
    (v_chord_382_1, 1, 81, 9, 'A5', 1),
    (v_chord_382_1, 2, 77, 5, 'F5', 1),
    (v_chord_382_1, 3, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_383 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 383;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_383, 0, 'Em7', 1)
  RETURNING id INTO v_chord_383_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_383_0, 0, 66, 6, 'F#4', 1),
    (v_chord_383_0, 1, 67, 7, 'G4', 1),
    (v_chord_383_0, 2, 71, 11, 'B4', 1),
    (v_chord_383_0, 3, 74, 2, 'D5', 1),
    (v_chord_383_0, 4, 78, 6, 'F#5', 1),
    (v_chord_383_0, 5, 81, 9, 'A5', 1),
    (v_chord_383_0, 6, 79, 7, 'G5', 1),
    (v_chord_383_0, 7, 74, 2, 'D5', 1),
    (v_chord_383_0, 8, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_383, 1, 'A7', 2)
  RETURNING id INTO v_chord_383_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_383_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_383_1, 1, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_385 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 385;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_385, 0, 'Em7', 1)
  RETURNING id INTO v_chord_385_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_385_0, 0, 67, 7, 'G4', 1),
    (v_chord_385_0, 1, 69, 9, 'A4', 1),
    (v_chord_385_0, 2, 67, 7, 'G4', 1),
    (v_chord_385_0, 3, 66, 6, 'F#4', 1),
    (v_chord_385_0, 4, 65, 5, 'F4', 1),
    (v_chord_385_0, 5, 64, 4, 'E4', 1),
    (v_chord_385_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_385_0, 7, 62, 2, 'D4', 1),
    (v_chord_385_0, 8, 60, 0, 'B#3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_385, 1, 'A7', 2)
  RETURNING id INTO v_chord_385_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_385_1, 0, 61, 1, 'C#4', 1),
    (v_chord_385_1, 1, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_386 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 386;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_386, 0, 'Em7', 1)
  RETURNING id INTO v_chord_386_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_386_0, 0, 67, 7, 'G4', 1),
    (v_chord_386_0, 1, 69, 9, 'A4', 1),
    (v_chord_386_0, 2, 67, 7, 'G4', 1),
    (v_chord_386_0, 3, 66, 6, 'F#4', 1),
    (v_chord_386_0, 4, 67, 7, 'G4', 1),
    (v_chord_386_0, 5, 64, 4, 'E4', 1),
    (v_chord_386_0, 6, 66, 6, 'F#4', 1),
    (v_chord_386_0, 7, 67, 7, 'G4', 1),
    (v_chord_386_0, 8, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_386, 1, 'A7', 2)
  RETURNING id INTO v_chord_386_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_386_1, 0, 71, 11, 'B4', 1),
    (v_chord_386_1, 1, 74, 2, 'D5', 1),
    (v_chord_386_1, 2, 71, 11, 'B4', 1),
    (v_chord_386_1, 3, 72, 0, 'B#4', 1),
    (v_chord_386_1, 4, 73, 1, 'C#5', 1),
    (v_chord_386_1, 5, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_387 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 387;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_387, 0, 'Em7', 1)
  RETURNING id INTO v_chord_387_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_387_0, 0, 67, 7, 'G4', 1),
    (v_chord_387_0, 1, 62, 2, 'D4', 1),
    (v_chord_387_0, 2, 63, 3, 'D#4', 1),
    (v_chord_387_0, 3, 66, 6, 'F#4', 1),
    (v_chord_387_0, 4, 64, 4, 'E4', 1),
    (v_chord_387_0, 5, 59, 11, 'B3', 1),
    (v_chord_387_0, 6, 62, 2, 'D4', 1),
    (v_chord_387_0, 7, 60, 0, 'B#3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_387, 1, 'A7', 2)
  RETURNING id INTO v_chord_387_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_387_1, 0, 61, 1, 'C#4', 1),
    (v_chord_387_1, 1, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_388 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 388;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_388, 0, 'Em7', 1)
  RETURNING id INTO v_chord_388_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_388_0, 0, 67, 7, 'G4', 1),
    (v_chord_388_0, 1, 62, 2, 'D4', 1),
    (v_chord_388_0, 2, 63, 3, 'D#4', 1),
    (v_chord_388_0, 3, 66, 6, 'F#4', 1),
    (v_chord_388_0, 4, 65, 5, 'F4', 1),
    (v_chord_388_0, 5, 63, 3, 'D#4', 1),
    (v_chord_388_0, 6, 64, 4, 'E4', 1),
    (v_chord_388_0, 7, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_388, 1, 'A7', 2)
  RETURNING id INTO v_chord_388_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_388_1, 0, 62, 2, 'D4', 1),
    (v_chord_388_1, 1, 60, 0, 'B#3', 1),
    (v_chord_388_1, 2, 61, 1, 'C#4', 1),
    (v_chord_388_1, 3, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_389 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 389;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_389, 0, 'Em7', 1)
  RETURNING id INTO v_chord_389_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_389_0, 0, 59, 11, 'B3', 1),
    (v_chord_389_0, 1, 62, 2, 'D4', 1),
    (v_chord_389_0, 2, 66, 6, 'F#4', 1),
    (v_chord_389_0, 3, 69, 9, 'A4', 1),
    (v_chord_389_0, 4, 66, 6, 'F#4', 1),
    (v_chord_389_0, 5, 67, 7, 'G4', 1),
    (v_chord_389_0, 6, 71, 11, 'B4', 1),
    (v_chord_389_0, 7, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_389, 1, 'A7', 2)
  RETURNING id INTO v_chord_389_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_389_1, 0, 78, 6, 'F#5', 1),
    (v_chord_389_1, 1, 76, 4, 'E5', 1),
    (v_chord_389_1, 2, 71, 11, 'B4', 1),
    (v_chord_389_1, 3, 67, 7, 'G4', 1),
    (v_chord_389_1, 4, 66, 6, 'F#4', 1),
    (v_chord_389_1, 5, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_391 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 391;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_391, 0, 'Em7', 1)
  RETURNING id INTO v_chord_391_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_391_0, 0, 63, 3, 'D#4', 1),
    (v_chord_391_0, 1, 64, 4, 'E4', 1),
    (v_chord_391_0, 2, 66, 6, 'F#4', 1),
    (v_chord_391_0, 3, 67, 7, 'G4', 1),
    (v_chord_391_0, 4, 69, 9, 'A4', 1),
    (v_chord_391_0, 5, 71, 11, 'B4', 1),
    (v_chord_391_0, 6, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_391, 1, 'A7', 2)
  RETURNING id INTO v_chord_391_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_391_1, 0, 73, 1, 'C#5', 1),
    (v_chord_391_1, 1, 74, 2, 'D5', 1),
    (v_chord_391_1, 2, 73, 1, 'C#5', 1),
    (v_chord_391_1, 3, 71, 11, 'B4', 1),
    (v_chord_391_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_391_1, 5, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_392 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 392;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_392, 0, 'Em7', 1)
  RETURNING id INTO v_chord_392_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_392_0, 0, 70, 10, 'A#4', 1),
    (v_chord_392_0, 1, 71, 11, 'B4', 1),
    (v_chord_392_0, 2, 74, 2, 'D5', 1),
    (v_chord_392_0, 3, 78, 6, 'F#5', 1),
    (v_chord_392_0, 4, 81, 9, 'A5', 1),
    (v_chord_392_0, 5, 80, 8, 'Ab5', 1),
    (v_chord_392_0, 6, 78, 6, 'F#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_392, 1, 'A7', 2)
  RETURNING id INTO v_chord_392_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_392_1, 0, 79, 7, 'G5', 1),
    (v_chord_392_1, 1, 71, 11, 'B4', 1),
    (v_chord_392_1, 2, 74, 2, 'D5', 1),
    (v_chord_392_1, 3, 78, 6, 'F#5', 1),
    (v_chord_392_1, 4, 78, 6, 'F#5', 1),
    (v_chord_392_1, 5, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_393 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 393;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_393, 0, 'Em7', 1)
  RETURNING id INTO v_chord_393_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_393_0, 0, 65, 5, 'E#4', 1),
    (v_chord_393_0, 1, 66, 6, 'F#4', 1),
    (v_chord_393_0, 2, 69, 9, 'A4', 1),
    (v_chord_393_0, 3, 66, 6, 'F#4', 1),
    (v_chord_393_0, 4, 67, 7, 'G4', 1),
    (v_chord_393_0, 5, 71, 11, 'B4', 1),
    (v_chord_393_0, 6, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_393, 1, 'A7', 2)
  RETURNING id INTO v_chord_393_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_393_1, 0, 78, 6, 'F#5', 1),
    (v_chord_393_1, 1, 76, 4, 'E5', 1),
    (v_chord_393_1, 2, 75, 3, 'D#5', 1),
    (v_chord_393_1, 3, 73, 1, 'C#5', 1),
    (v_chord_393_1, 4, 72, 0, 'C5', 1),
    (v_chord_393_1, 5, 70, 10, 'Bb4', 1),
    (v_chord_393_1, 6, 69, 9, 'A4', 1),
    (v_chord_393_1, 7, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_394 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 394;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_394, 0, 'Em7', 1)
  RETURNING id INTO v_chord_394_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_394_0, 0, 71, 11, 'B4', 1),
    (v_chord_394_0, 1, 67, 7, 'G4', 1),
    (v_chord_394_0, 2, 66, 6, 'F#4', 1),
    (v_chord_394_0, 3, 64, 4, 'E4', 1),
    (v_chord_394_0, 4, 69, 9, 'A4', 1),
    (v_chord_394_0, 5, 67, 7, 'G4', 1),
    (v_chord_394_0, 6, 62, 2, 'D4', 1),
    (v_chord_394_0, 7, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_394, 1, 'A7', 2)
  RETURNING id INTO v_chord_394_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_394_1, 0, 63, 3, 'D#4', 1),
    (v_chord_394_1, 1, 66, 6, 'F#4', 1),
    (v_chord_394_1, 2, 65, 5, 'F4', 1),
    (v_chord_394_1, 3, 63, 3, 'D#4', 1),
    (v_chord_394_1, 4, 64, 4, 'E4', 1),
    (v_chord_394_1, 5, 66, 6, 'F#4', 1),
    (v_chord_394_1, 6, 67, 7, 'G4', 1),
    (v_chord_394_1, 7, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_395 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 395;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_395, 0, 'Em7', 1)
  RETURNING id INTO v_chord_395_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_395_0, 0, 64, 4, 'E4', 1),
    (v_chord_395_0, 1, 63, 3, 'D#4', 1),
    (v_chord_395_0, 2, 64, 4, 'E4', 1),
    (v_chord_395_0, 3, 66, 6, 'F#4', 1),
    (v_chord_395_0, 4, 67, 7, 'G4', 1),
    (v_chord_395_0, 5, 69, 9, 'A4', 1),
    (v_chord_395_0, 6, 71, 11, 'B4', 1),
    (v_chord_395_0, 7, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_395, 1, 'A7', 2)
  RETURNING id INTO v_chord_395_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_395_1, 0, 73, 1, 'C#5', 1),
    (v_chord_395_1, 1, 74, 2, 'D5', 1),
    (v_chord_395_1, 2, 73, 1, 'C#5', 1),
    (v_chord_395_1, 3, 71, 11, 'B4', 1),
    (v_chord_395_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_395_1, 5, 69, 9, 'A4', 1),
    (v_chord_395_1, 6, 68, 8, 'Ab4', 1),
    (v_chord_395_1, 7, 67, 7, 'G4', 1),
    (v_chord_395_1, 8, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_397 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 397;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_397, 0, 'Em7', 1)
  RETURNING id INTO v_chord_397_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_397_0, 0, 64, 4, 'E4', 1),
    (v_chord_397_0, 1, 63, 3, 'D#4', 1),
    (v_chord_397_0, 2, 64, 4, 'E4', 1),
    (v_chord_397_0, 3, 66, 6, 'F#4', 1),
    (v_chord_397_0, 4, 67, 7, 'G4', 1),
    (v_chord_397_0, 5, 69, 9, 'A4', 1),
    (v_chord_397_0, 6, 71, 11, 'B4', 1),
    (v_chord_397_0, 7, 65, 5, 'E#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_397, 1, 'A7', 2)
  RETURNING id INTO v_chord_397_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_397_1, 0, 66, 6, 'F#4', 1),
    (v_chord_397_1, 1, 69, 9, 'A4', 1),
    (v_chord_397_1, 2, 67, 7, 'G4', 1),
    (v_chord_397_1, 3, 59, 11, 'B3', 1),
    (v_chord_397_1, 4, 62, 2, 'D4', 1),
    (v_chord_397_1, 5, 66, 6, 'F#4', 1),
    (v_chord_397_1, 6, 65, 5, 'F4', 1),
    (v_chord_397_1, 7, 63, 3, 'D#4', 1);
  SELECT id INTO v_phrase_398 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 398;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_398, 0, 'Em7', 1)
  RETURNING id INTO v_chord_398_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_398_0, 0, 81, 9, 'A5', 1),
    (v_chord_398_0, 1, 79, 7, 'G5', 1),
    (v_chord_398_0, 2, 74, 2, 'D5', 1),
    (v_chord_398_0, 3, 71, 11, 'B4', 1),
    (v_chord_398_0, 4, 75, 3, 'D#5', 1),
    (v_chord_398_0, 5, 78, 6, 'F#5', 1),
    (v_chord_398_0, 6, 77, 5, 'F5', 1),
    (v_chord_398_0, 7, 75, 3, 'D#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_398, 1, 'A7', 2)
  RETURNING id INTO v_chord_398_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_398_1, 0, 76, 4, 'E5', 1),
    (v_chord_398_1, 1, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_399 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 399;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_399, 0, 'Em7', 1)
  RETURNING id INTO v_chord_399_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_399_0, 0, 73, 1, 'C#5', 1),
    (v_chord_399_0, 1, 74, 2, 'D5', 1),
    (v_chord_399_0, 2, 71, 11, 'B4', 1),
    (v_chord_399_0, 3, 67, 7, 'G4', 1),
    (v_chord_399_0, 4, 66, 6, 'F#4', 1),
    (v_chord_399_0, 5, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_399, 1, 'A7', 2)
  RETURNING id INTO v_chord_399_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_399_1, 0, 66, 6, 'F#4', 1),
    (v_chord_399_1, 1, 67, 7, 'G4', 1),
    (v_chord_399_1, 2, 69, 9, 'A4', 1),
    (v_chord_399_1, 3, 70, 10, 'A#4', 1),
    (v_chord_399_1, 4, 73, 1, 'C#5', 1),
    (v_chord_399_1, 5, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_400 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 400;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_400, 0, 'Em7', 1)
  RETURNING id INTO v_chord_400_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_400_0, 0, 73, 1, 'C#5', 1),
    (v_chord_400_0, 1, 74, 2, 'D5', 1),
    (v_chord_400_0, 2, 71, 11, 'B4', 1),
    (v_chord_400_0, 3, 67, 7, 'G4', 1),
    (v_chord_400_0, 4, 66, 6, 'F#4', 1),
    (v_chord_400_0, 5, 64, 4, 'E4', 1),
    (v_chord_400_0, 6, 63, 3, 'D#4', 1),
    (v_chord_400_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_400, 1, 'A7', 2)
  RETURNING id INTO v_chord_400_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_400_1, 0, 64, 4, 'E4', 1),
    (v_chord_400_1, 1, 59, 11, 'B3', 1);
  SELECT id INTO v_phrase_401 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 401;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_401, 0, 'Em7', 1)
  RETURNING id INTO v_chord_401_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_401_0, 0, 63, 3, 'D#4', 1),
    (v_chord_401_0, 1, 64, 4, 'E4', 1),
    (v_chord_401_0, 2, 67, 7, 'G4', 1),
    (v_chord_401_0, 3, 71, 11, 'B4', 1),
    (v_chord_401_0, 4, 74, 2, 'D5', 1),
    (v_chord_401_0, 5, 71, 11, 'B4', 1),
    (v_chord_401_0, 6, 67, 7, 'G4', 1),
    (v_chord_401_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_401, 1, 'A7', 2)
  RETURNING id INTO v_chord_401_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_401_1, 0, 66, 6, 'F#4', 1),
    (v_chord_401_1, 1, 69, 9, 'A4', 1);
  SELECT id INTO v_comp_372 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 372;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_372;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_372, 367, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_372, 368, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_372, 369, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_372, 370, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_372, 371, 4);
  SELECT id INTO v_comp_378 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 378;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_378;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_378, 373, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_378, 374, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_378, 375, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_378, 376, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_378, 377, 4);
  SELECT id INTO v_comp_384 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 384;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_384;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_384, 379, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_384, 380, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_384, 381, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_384, 382, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_384, 383, 4);
  SELECT id INTO v_comp_390 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 390;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_390;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_390, 385, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_390, 386, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_390, 387, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_390, 388, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_390, 389, 4);
  SELECT id INTO v_comp_396 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 396;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_396;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_396, 391, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_396, 392, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_396, 393, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_396, 394, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_396, 395, 4);
  SELECT id INTO v_comp_402 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 402;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_402;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_402, 397, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_402, 398, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_402, 399, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_402, 400, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_402, 401, 4);
END $$;

COMMIT;