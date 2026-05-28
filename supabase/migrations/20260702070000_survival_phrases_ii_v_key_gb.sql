BEGIN;

-- Survival Phrases II-V key Gb: stages 223-258
-- MusicXML: 251譜面_+6st_Gb.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 223 AND 258
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 223 AND 258;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 223 AND 258
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 223 AND 258
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 223 AND 258;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 223 AND 258;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_gb_1', 'II-V in Gb 1-5', 'II-V in Gb 1-5', 37)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_gb_2', 'II-V in Gb 6-10', 'II-V in Gb 6-10', 38)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_gb_3', 'II-V in Gb 11-15', 'II-V in Gb 11-15', 39)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_gb_4', 'II-V in Gb 16-20', 'II-V in Gb 16-20', 40)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_gb_5', 'II-V in Gb 21-25', 'II-V in Gb 21-25', 41)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_gb_6', 'II-V in Gb 26-30', 'II-V in Gb 26-30', 42)
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
  223,
  'progression',
  'II-V in Gb · 1',
  'II-V in Gb · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_1',
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
  223,
  'II-V in Gb · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-01.mp3',
  -6
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
  224,
  'progression',
  'II-V in Gb · 2',
  'II-V in Gb · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_1',
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
  224,
  'II-V in Gb · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-02.mp3',
  -6
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
  225,
  'progression',
  'II-V in Gb · 3',
  'II-V in Gb · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_1',
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
  225,
  'II-V in Gb · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-03.mp3',
  -6
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
  226,
  'progression',
  'II-V in Gb · 4',
  'II-V in Gb · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_1',
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
  226,
  'II-V in Gb · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-04.mp3',
  -6
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
  227,
  'progression',
  'II-V in Gb · 5',
  'II-V in Gb · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_1',
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
  227,
  'II-V in Gb · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-05.mp3',
  -6
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
  228,
  'progression',
  '複合フレーズ · II-V in Gb 1-5',
  'Composite · II-V in Gb 1-5',
  'easy',
  '',
  'II-V in Gb 1-5',
  'II-V in Gb 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_1',
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
VALUES ('phrases', 228, 'B', -6, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  229,
  'progression',
  'II-V in Gb · 6',
  'II-V in Gb · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_2',
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
  229,
  'II-V in Gb · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-06.mp3',
  -6
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
  230,
  'progression',
  'II-V in Gb · 7',
  'II-V in Gb · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_2',
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
  230,
  'II-V in Gb · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-07.mp3',
  -6
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
  231,
  'progression',
  'II-V in Gb · 8',
  'II-V in Gb · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_2',
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
  231,
  'II-V in Gb · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-08.mp3',
  -6
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
  232,
  'progression',
  'II-V in Gb · 9',
  'II-V in Gb · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_2',
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
  232,
  'II-V in Gb · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-09.mp3',
  -6
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
  233,
  'progression',
  'II-V in Gb · 10',
  'II-V in Gb · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_2',
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
  233,
  'II-V in Gb · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-10.mp3',
  -6
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
  234,
  'progression',
  '複合フレーズ · II-V in Gb 6-10',
  'Composite · II-V in Gb 6-10',
  'easy',
  '',
  'II-V in Gb 6-10',
  'II-V in Gb 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_2',
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
VALUES ('phrases', 234, 'C', -6, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  235,
  'progression',
  'II-V in Gb · 11',
  'II-V in Gb · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_3',
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
  235,
  'II-V in Gb · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-11.mp3',
  -6
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
  236,
  'progression',
  'II-V in Gb · 12',
  'II-V in Gb · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_3',
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
  236,
  'II-V in Gb · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-12.mp3',
  -6
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
  237,
  'progression',
  'II-V in Gb · 13',
  'II-V in Gb · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_3',
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
  237,
  'II-V in Gb · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-13.mp3',
  -6
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
  238,
  'progression',
  'II-V in Gb · 14',
  'II-V in Gb · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_3',
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
  238,
  'II-V in Gb · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-14.mp3',
  -6
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
  239,
  'progression',
  'II-V in Gb · 15',
  'II-V in Gb · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_3',
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
  239,
  'II-V in Gb · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-15.mp3',
  -6
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
  240,
  'progression',
  '複合フレーズ · II-V in Gb 11-15',
  'Composite · II-V in Gb 11-15',
  'easy',
  '',
  'II-V in Gb 11-15',
  'II-V in Gb 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_3',
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
VALUES ('phrases', 240, 'A', -6, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  241,
  'progression',
  'II-V in Gb · 16',
  'II-V in Gb · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_4',
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
  241,
  'II-V in Gb · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-16.mp3',
  -6
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
  242,
  'progression',
  'II-V in Gb · 17',
  'II-V in Gb · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_4',
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
  242,
  'II-V in Gb · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-17.mp3',
  -6
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
  243,
  'progression',
  'II-V in Gb · 18',
  'II-V in Gb · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_4',
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
  243,
  'II-V in Gb · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-18.mp3',
  -6
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
  244,
  'progression',
  'II-V in Gb · 19',
  'II-V in Gb · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_4',
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
  244,
  'II-V in Gb · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-19.mp3',
  -6
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
  245,
  'progression',
  'II-V in Gb · 20',
  'II-V in Gb · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_4',
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
  245,
  'II-V in Gb · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-20.mp3',
  -6
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
  246,
  'progression',
  '複合フレーズ · II-V in Gb 16-20',
  'Composite · II-V in Gb 16-20',
  'easy',
  '',
  'II-V in Gb 16-20',
  'II-V in Gb 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_4',
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
VALUES ('phrases', 246, 'B', -6, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  247,
  'progression',
  'II-V in Gb · 21',
  'II-V in Gb · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_5',
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
  247,
  'II-V in Gb · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-21.mp3',
  -6
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
  248,
  'progression',
  'II-V in Gb · 22',
  'II-V in Gb · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_5',
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
  248,
  'II-V in Gb · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-22.mp3',
  -6
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
  249,
  'progression',
  'II-V in Gb · 23',
  'II-V in Gb · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_5',
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
  249,
  'II-V in Gb · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-23.mp3',
  -6
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
  250,
  'progression',
  'II-V in Gb · 24',
  'II-V in Gb · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_5',
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
  250,
  'II-V in Gb · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-24.mp3',
  -6
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
  251,
  'progression',
  'II-V in Gb · 25',
  'II-V in Gb · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_5',
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
  251,
  'II-V in Gb · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-25.mp3',
  -6
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
  252,
  'progression',
  '複合フレーズ · II-V in Gb 21-25',
  'Composite · II-V in Gb 21-25',
  'easy',
  '',
  'II-V in Gb 21-25',
  'II-V in Gb 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_5',
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
VALUES ('phrases', 252, 'C', -6, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  253,
  'progression',
  'II-V in Gb · 26',
  'II-V in Gb · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_6',
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
  253,
  'II-V in Gb · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-26.mp3',
  -6
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
  254,
  'progression',
  'II-V in Gb · 27',
  'II-V in Gb · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_6',
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
  254,
  'II-V in Gb · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-27.mp3',
  -6
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
  255,
  'progression',
  'II-V in Gb · 28',
  'II-V in Gb · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_6',
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
  255,
  'II-V in Gb · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-28.mp3',
  -6
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
  256,
  'progression',
  'II-V in Gb · 29',
  'II-V in Gb · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_6',
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
  256,
  'II-V in Gb · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-29.mp3',
  -6
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
  257,
  'progression',
  'II-V in Gb · 30',
  'II-V in Gb · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_6',
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
  257,
  'II-V in Gb · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-gb-30.mp3',
  -6
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
  258,
  'progression',
  '複合フレーズ · II-V in Gb 26-30',
  'Composite · II-V in Gb 26-30',
  'easy',
  '',
  'II-V in Gb 26-30',
  'II-V in Gb 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_gb_6',
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
VALUES ('phrases', 258, 'A', -6, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_223 uuid;
  v_chord_223_0 uuid;
  v_chord_223_1 uuid;
  v_phrase_224 uuid;
  v_chord_224_0 uuid;
  v_chord_224_1 uuid;
  v_phrase_225 uuid;
  v_chord_225_0 uuid;
  v_chord_225_1 uuid;
  v_phrase_226 uuid;
  v_chord_226_0 uuid;
  v_chord_226_1 uuid;
  v_phrase_227 uuid;
  v_chord_227_0 uuid;
  v_chord_227_1 uuid;
  v_phrase_229 uuid;
  v_chord_229_0 uuid;
  v_chord_229_1 uuid;
  v_phrase_230 uuid;
  v_chord_230_0 uuid;
  v_chord_230_1 uuid;
  v_phrase_231 uuid;
  v_chord_231_0 uuid;
  v_chord_231_1 uuid;
  v_phrase_232 uuid;
  v_chord_232_0 uuid;
  v_chord_232_1 uuid;
  v_phrase_233 uuid;
  v_chord_233_0 uuid;
  v_chord_233_1 uuid;
  v_phrase_235 uuid;
  v_chord_235_0 uuid;
  v_chord_235_1 uuid;
  v_phrase_236 uuid;
  v_chord_236_0 uuid;
  v_chord_236_1 uuid;
  v_phrase_237 uuid;
  v_chord_237_0 uuid;
  v_chord_237_1 uuid;
  v_phrase_238 uuid;
  v_chord_238_0 uuid;
  v_chord_238_1 uuid;
  v_phrase_239 uuid;
  v_chord_239_0 uuid;
  v_chord_239_1 uuid;
  v_phrase_241 uuid;
  v_chord_241_0 uuid;
  v_chord_241_1 uuid;
  v_phrase_242 uuid;
  v_chord_242_0 uuid;
  v_chord_242_1 uuid;
  v_phrase_243 uuid;
  v_chord_243_0 uuid;
  v_chord_243_1 uuid;
  v_phrase_244 uuid;
  v_chord_244_0 uuid;
  v_chord_244_1 uuid;
  v_phrase_245 uuid;
  v_chord_245_0 uuid;
  v_chord_245_1 uuid;
  v_phrase_247 uuid;
  v_chord_247_0 uuid;
  v_chord_247_1 uuid;
  v_phrase_248 uuid;
  v_chord_248_0 uuid;
  v_chord_248_1 uuid;
  v_phrase_249 uuid;
  v_chord_249_0 uuid;
  v_chord_249_1 uuid;
  v_phrase_250 uuid;
  v_chord_250_0 uuid;
  v_chord_250_1 uuid;
  v_phrase_251 uuid;
  v_chord_251_0 uuid;
  v_chord_251_1 uuid;
  v_phrase_253 uuid;
  v_chord_253_0 uuid;
  v_chord_253_1 uuid;
  v_phrase_254 uuid;
  v_chord_254_0 uuid;
  v_chord_254_1 uuid;
  v_phrase_255 uuid;
  v_chord_255_0 uuid;
  v_chord_255_1 uuid;
  v_phrase_256 uuid;
  v_chord_256_0 uuid;
  v_chord_256_1 uuid;
  v_phrase_257 uuid;
  v_chord_257_0 uuid;
  v_chord_257_1 uuid;
  v_comp_228 uuid;
  v_comp_234 uuid;
  v_comp_240 uuid;
  v_comp_246 uuid;
  v_comp_252 uuid;
  v_comp_258 uuid;
BEGIN
  SELECT id INTO v_phrase_223 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 223;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_223, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_223_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_223_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_223_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_223_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_223_0, 3, 59, 11, 'Cb4', 1),
    (v_chord_223_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_223_0, 5, 66, 6, 'Gb4', 1),
    (v_chord_223_0, 6, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_223, 1, 'Db7', 2)
  RETURNING id INTO v_chord_223_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_223_1, 0, 73, 1, 'Db5', 1),
    (v_chord_223_1, 1, 71, 11, 'Cb5', 1),
    (v_chord_223_1, 2, 66, 6, 'Gb4', 1),
    (v_chord_223_1, 3, 63, 3, 'Eb4', 1),
    (v_chord_223_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_223_1, 5, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_224 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 224;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_224, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_224_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_224_0, 0, 69, 9, 'A4', 1),
    (v_chord_224_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_224_0, 2, 73, 1, 'Db5', 1),
    (v_chord_224_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_224_0, 4, 71, 11, 'Cb5', 1),
    (v_chord_224_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_224_0, 6, 78, 6, 'Gb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_224, 1, 'Db7', 2)
  RETURNING id INTO v_chord_224_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_224_1, 0, 82, 10, 'Bb5', 1),
    (v_chord_224_1, 1, 80, 8, 'Ab5', 1),
    (v_chord_224_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_224_1, 3, 71, 11, 'Cb5', 1),
    (v_chord_224_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_224_1, 5, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_225 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 225;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_225, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_225_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_225_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_225_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_225_0, 2, 71, 11, 'Cb5', 1),
    (v_chord_225_0, 3, 73, 1, 'Db5', 1),
    (v_chord_225_0, 4, 75, 3, 'Eb5', 1),
    (v_chord_225_0, 5, 78, 6, 'Gb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_225, 1, 'Db7', 2)
  RETURNING id INTO v_chord_225_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_225_1, 0, 77, 5, 'F5', 1),
    (v_chord_225_1, 1, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_226 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 226;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_226, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_226_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_226_0, 0, 73, 1, 'Db5', 1),
    (v_chord_226_0, 1, 71, 11, 'Cb5', 1),
    (v_chord_226_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_226_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_226_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_226_0, 5, 67, 7, 'G4', 1),
    (v_chord_226_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_226_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_226, 1, 'Db7', 2)
  RETURNING id INTO v_chord_226_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_226_1, 0, 71, 11, 'Cb5', 1),
    (v_chord_226_1, 1, 73, 1, 'Db5', 1),
    (v_chord_226_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_226_1, 3, 71, 11, 'Cb5', 1),
    (v_chord_226_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_226_1, 5, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_227 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 227;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_227, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_227_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_227_0, 0, 71, 11, 'Cb5', 1),
    (v_chord_227_0, 1, 73, 1, 'Db5', 1),
    (v_chord_227_0, 2, 75, 3, 'Eb5', 1),
    (v_chord_227_0, 3, 71, 11, 'Cb5', 1),
    (v_chord_227_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_227_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_227_0, 6, 67, 7, 'G4', 1),
    (v_chord_227_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_227, 1, 'Db7', 2)
  RETURNING id INTO v_chord_227_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_227_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_227_1, 1, 66, 6, 'Gb4', 1),
    (v_chord_227_1, 2, 64, 4, 'E4', 1),
    (v_chord_227_1, 3, 65, 5, 'F4', 1),
    (v_chord_227_1, 4, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_229 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 229;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_229, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_229_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_229_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_229_0, 1, 71, 11, 'Cb5', 1),
    (v_chord_229_0, 2, 75, 3, 'Eb5', 1),
    (v_chord_229_0, 3, 78, 6, 'Gb5', 1),
    (v_chord_229_0, 4, 75, 3, 'Eb5', 1),
    (v_chord_229_0, 5, 76, 4, 'E5', 1),
    (v_chord_229_0, 6, 77, 5, 'F5', 1),
    (v_chord_229_0, 7, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_229, 1, 'Db7', 2)
  RETURNING id INTO v_chord_229_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_229_1, 0, 71, 11, 'Cb5', 1),
    (v_chord_229_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_229_1, 2, 74, 2, 'Ebb5', 1),
    (v_chord_229_1, 3, 72, 0, 'C5', 1),
    (v_chord_229_1, 4, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_230 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 230;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_230, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_230_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_230_0, 0, 56, 8, 'Ab3', 1),
    (v_chord_230_0, 1, 58, 10, 'Bb3', 1),
    (v_chord_230_0, 2, 59, 11, 'Cb4', 1),
    (v_chord_230_0, 3, 61, 1, 'Db4', 1),
    (v_chord_230_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_230_0, 5, 65, 5, 'F4', 1),
    (v_chord_230_0, 6, 66, 6, 'Gb4', 1),
    (v_chord_230_0, 7, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_230, 1, 'Db7', 2)
  RETURNING id INTO v_chord_230_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_230_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_230_1, 1, 73, 1, 'Db5', 1),
    (v_chord_230_1, 2, 71, 11, 'Cb5', 1),
    (v_chord_230_1, 3, 63, 3, 'Eb4', 1),
    (v_chord_230_1, 4, 66, 6, 'Gb4', 1),
    (v_chord_230_1, 5, 70, 10, 'Bb4', 1),
    (v_chord_230_1, 6, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_231 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 231;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_231, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_231_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_231_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_231_0, 1, 67, 7, 'G4', 1),
    (v_chord_231_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_231_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_231_0, 4, 71, 11, 'Cb5', 1),
    (v_chord_231_0, 5, 73, 1, 'Db5', 1),
    (v_chord_231_0, 6, 75, 3, 'Eb5', 1),
    (v_chord_231_0, 7, 71, 11, 'Cb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_231, 1, 'Db7', 2)
  RETURNING id INTO v_chord_231_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_231_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_231_1, 1, 66, 6, 'Gb4', 1),
    (v_chord_231_1, 2, 64, 4, 'E4', 1),
    (v_chord_231_1, 3, 65, 5, 'F4', 1),
    (v_chord_231_1, 4, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_232 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 232;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_232, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_232_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_232_0, 0, 59, 11, 'Cb4', 1),
    (v_chord_232_0, 1, 61, 1, 'Db4', 1),
    (v_chord_232_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_232_0, 3, 66, 6, 'Gb4', 1),
    (v_chord_232_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_232_0, 5, 71, 11, 'Cb5', 1),
    (v_chord_232_0, 6, 67, 7, 'G4', 1),
    (v_chord_232_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_232, 1, 'Db7', 2)
  RETURNING id INTO v_chord_232_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_232_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_232_1, 1, 66, 6, 'Gb4', 1),
    (v_chord_232_1, 2, 63, 3, 'Eb4', 1),
    (v_chord_232_1, 3, 64, 4, 'E4', 1),
    (v_chord_232_1, 4, 65, 5, 'F4', 1),
    (v_chord_232_1, 5, 63, 3, 'Eb4', 1),
    (v_chord_232_1, 6, 61, 1, 'Db4', 1),
    (v_chord_232_1, 7, 60, 0, 'Dbb4', 1);
  SELECT id INTO v_phrase_233 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 233;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_233, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_233_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_233_0, 0, 65, 5, 'F4', 1),
    (v_chord_233_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_233_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_233_0, 3, 59, 11, 'Cb4', 1),
    (v_chord_233_0, 4, 58, 10, 'Bb3', 1),
    (v_chord_233_0, 5, 59, 11, 'Cb4', 1),
    (v_chord_233_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_233_0, 7, 66, 6, 'Gb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_233, 1, 'Db7', 2)
  RETURNING id INTO v_chord_233_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_233_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_233_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_233_1, 2, 63, 3, 'Eb4', 1),
    (v_chord_233_1, 3, 59, 11, 'Cb4', 1),
    (v_chord_233_1, 4, 58, 10, 'Bb3', 1),
    (v_chord_233_1, 5, 56, 8, 'Ab3', 1);
  SELECT id INTO v_phrase_235 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 235;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_235, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_235_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_235_0, 0, 59, 11, 'Cb4', 1),
    (v_chord_235_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_235_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_235_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_235_0, 4, 73, 1, 'Db5', 1),
    (v_chord_235_0, 5, 71, 11, 'Cb5', 1),
    (v_chord_235_0, 6, 66, 6, 'Gb4', 1),
    (v_chord_235_0, 7, 63, 3, 'Eb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_235, 1, 'Db7', 2)
  RETURNING id INTO v_chord_235_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_235_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_235_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_235_1, 2, 66, 6, 'Gb4', 1),
    (v_chord_235_1, 3, 65, 5, 'F4', 1),
    (v_chord_235_1, 4, 63, 3, 'Eb4', 1),
    (v_chord_235_1, 5, 61, 1, 'Db4', 1),
    (v_chord_235_1, 6, 60, 0, 'C4', 1);
  SELECT id INTO v_phrase_236 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 236;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_236, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_236_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_236_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_236_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_236_0, 2, 71, 11, 'Cb5', 1),
    (v_chord_236_0, 3, 73, 1, 'Db5', 1),
    (v_chord_236_0, 4, 75, 3, 'Eb5', 1),
    (v_chord_236_0, 5, 71, 11, 'Cb5', 1),
    (v_chord_236_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_236_0, 7, 63, 3, 'Eb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_236, 1, 'Db7', 2)
  RETURNING id INTO v_chord_236_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_236_1, 0, 67, 7, 'G4', 1),
    (v_chord_236_1, 1, 66, 6, 'Gb4', 1),
    (v_chord_236_1, 2, 64, 4, 'E4', 1),
    (v_chord_236_1, 3, 65, 5, 'F4', 1),
    (v_chord_236_1, 4, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_237 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 237;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_237, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_237_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_237_0, 0, 73, 1, 'Db5', 1),
    (v_chord_237_0, 1, 72, 0, 'Dbb5', 1),
    (v_chord_237_0, 2, 71, 11, 'Cb5', 1),
    (v_chord_237_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_237_0, 4, 66, 6, 'Gb4', 1),
    (v_chord_237_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_237_0, 6, 69, 9, 'Bbb4', 1),
    (v_chord_237_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_237, 1, 'Db7', 2)
  RETURNING id INTO v_chord_237_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_237_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_237_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_237_1, 2, 71, 11, 'Cb5', 1),
    (v_chord_237_1, 3, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_238 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 238;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_238, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_238_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_238_0, 0, 61, 1, 'Db4', 1),
    (v_chord_238_0, 1, 59, 11, 'Cb4', 1),
    (v_chord_238_0, 2, 61, 1, 'Db4', 1),
    (v_chord_238_0, 3, 59, 11, 'Cb4', 1),
    (v_chord_238_0, 4, 58, 10, 'Bb3', 1),
    (v_chord_238_0, 5, 59, 11, 'Cb4', 1),
    (v_chord_238_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_238_0, 7, 66, 6, 'Gb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_238, 1, 'Db7', 2)
  RETURNING id INTO v_chord_238_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_238_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_238_1, 1, 73, 1, 'Db5', 1),
    (v_chord_238_1, 2, 69, 9, 'Bbb4', 1),
    (v_chord_238_1, 3, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_239 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 239;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_239, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_239_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_239_0, 0, 58, 10, 'Bb3', 1),
    (v_chord_239_0, 1, 59, 11, 'Cb4', 1),
    (v_chord_239_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_239_0, 3, 66, 6, 'Gb4', 1),
    (v_chord_239_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_239_0, 5, 73, 1, 'Db5', 1),
    (v_chord_239_0, 6, 71, 11, 'Cb5', 1),
    (v_chord_239_0, 7, 66, 6, 'Gb4', 1),
    (v_chord_239_0, 8, 63, 3, 'Eb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_239, 1, 'Db7', 2)
  RETURNING id INTO v_chord_239_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_239_1, 0, 62, 2, 'Ebb4', 1),
    (v_chord_239_1, 1, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_241 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 241;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_241, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_241_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_241_0, 0, 71, 11, 'Cb5', 1),
    (v_chord_241_0, 1, 73, 1, 'Db5', 1),
    (v_chord_241_0, 2, 71, 11, 'Cb5', 1),
    (v_chord_241_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_241_0, 4, 69, 9, 'Bbb4', 1),
    (v_chord_241_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_241_0, 6, 67, 7, 'Abb4', 1),
    (v_chord_241_0, 7, 66, 6, 'Gb4', 1),
    (v_chord_241_0, 8, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_241, 1, 'Db7', 2)
  RETURNING id INTO v_chord_241_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_241_1, 0, 65, 5, 'F4', 1),
    (v_chord_241_1, 1, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_242 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 242;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_242, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_242_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_242_0, 0, 71, 11, 'Cb5', 1),
    (v_chord_242_0, 1, 73, 1, 'Db5', 1),
    (v_chord_242_0, 2, 71, 11, 'Cb5', 1),
    (v_chord_242_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_242_0, 4, 71, 11, 'Cb5', 1),
    (v_chord_242_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_242_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_242_0, 7, 71, 11, 'Cb5', 1),
    (v_chord_242_0, 8, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_242, 1, 'Db7', 2)
  RETURNING id INTO v_chord_242_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_242_1, 0, 75, 3, 'Eb5', 1),
    (v_chord_242_1, 1, 78, 6, 'Gb5', 1),
    (v_chord_242_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_242_1, 3, 76, 4, 'E5', 1),
    (v_chord_242_1, 4, 77, 5, 'F5', 1),
    (v_chord_242_1, 5, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_243 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 243;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_243, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_243_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_243_0, 0, 71, 11, 'Cb5', 1),
    (v_chord_243_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_243_0, 2, 67, 7, 'G4', 1),
    (v_chord_243_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_243_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_243_0, 5, 63, 3, 'Eb4', 1),
    (v_chord_243_0, 6, 66, 6, 'Gb4', 1),
    (v_chord_243_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_243, 1, 'Db7', 2)
  RETURNING id INTO v_chord_243_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_243_1, 0, 65, 5, 'F4', 1),
    (v_chord_243_1, 1, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_244 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 244;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_244, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_244_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_244_0, 0, 71, 11, 'Cb5', 1),
    (v_chord_244_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_244_0, 2, 67, 7, 'G4', 1),
    (v_chord_244_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_244_0, 4, 69, 9, 'Bbb4', 1),
    (v_chord_244_0, 5, 67, 7, 'G4', 1),
    (v_chord_244_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_244_0, 7, 63, 3, 'Eb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_244, 1, 'Db7', 2)
  RETURNING id INTO v_chord_244_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_244_1, 0, 66, 6, 'Gb4', 1),
    (v_chord_244_1, 1, 64, 4, 'E4', 1),
    (v_chord_244_1, 2, 65, 5, 'F4', 1),
    (v_chord_244_1, 3, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_245 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 245;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_245, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_245_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_245_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_245_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_245_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_245_0, 3, 73, 1, 'Db5', 1),
    (v_chord_245_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_245_0, 5, 71, 11, 'Cb5', 1),
    (v_chord_245_0, 6, 75, 3, 'Eb5', 1),
    (v_chord_245_0, 7, 78, 6, 'Gb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_245, 1, 'Db7', 2)
  RETURNING id INTO v_chord_245_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_245_1, 0, 82, 10, 'Bb5', 1),
    (v_chord_245_1, 1, 80, 8, 'Ab5', 1),
    (v_chord_245_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_245_1, 3, 71, 11, 'Cb5', 1),
    (v_chord_245_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_245_1, 5, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_247 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 247;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_247, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_247_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_247_0, 0, 67, 7, 'G4', 1),
    (v_chord_247_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_247_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_247_0, 3, 71, 11, 'Cb5', 1),
    (v_chord_247_0, 4, 73, 1, 'Db5', 1),
    (v_chord_247_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_247_0, 6, 78, 6, 'Gb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_247, 1, 'Db7', 2)
  RETURNING id INTO v_chord_247_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_247_1, 0, 77, 5, 'F5', 1),
    (v_chord_247_1, 1, 78, 6, 'Gb5', 1),
    (v_chord_247_1, 2, 77, 5, 'F5', 1),
    (v_chord_247_1, 3, 75, 3, 'Eb5', 1),
    (v_chord_247_1, 4, 74, 2, 'Ebb5', 1),
    (v_chord_247_1, 5, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_248 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 248;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_248, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_248_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_248_0, 0, 74, 2, 'D5', 1),
    (v_chord_248_0, 1, 75, 3, 'Eb5', 1),
    (v_chord_248_0, 2, 78, 6, 'Gb5', 1),
    (v_chord_248_0, 3, 82, 10, 'Bb5', 1),
    (v_chord_248_0, 4, 85, 1, 'Db6', 1),
    (v_chord_248_0, 5, 84, 0, 'Dbb6', 1),
    (v_chord_248_0, 6, 82, 10, 'Bb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_248, 1, 'Db7', 2)
  RETURNING id INTO v_chord_248_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_248_1, 0, 83, 11, 'Cb6', 1),
    (v_chord_248_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_248_1, 2, 78, 6, 'Gb5', 1),
    (v_chord_248_1, 3, 82, 10, 'Bb5', 1),
    (v_chord_248_1, 4, 82, 10, 'Bb5', 1),
    (v_chord_248_1, 5, 80, 8, 'Ab5', 1);
  SELECT id INTO v_phrase_249 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 249;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_249, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_249_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_249_0, 0, 69, 9, 'A4', 1),
    (v_chord_249_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_249_0, 2, 73, 1, 'Db5', 1),
    (v_chord_249_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_249_0, 4, 71, 11, 'Cb5', 1),
    (v_chord_249_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_249_0, 6, 78, 6, 'Gb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_249, 1, 'Db7', 2)
  RETURNING id INTO v_chord_249_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_249_1, 0, 82, 10, 'Bb5', 1),
    (v_chord_249_1, 1, 80, 8, 'Ab5', 1),
    (v_chord_249_1, 2, 79, 7, 'G5', 1),
    (v_chord_249_1, 3, 77, 5, 'F5', 1),
    (v_chord_249_1, 4, 76, 4, 'Fb5', 1),
    (v_chord_249_1, 5, 74, 2, 'Ebb5', 1),
    (v_chord_249_1, 6, 73, 1, 'Db5', 1),
    (v_chord_249_1, 7, 71, 11, 'Cb5', 1);
  SELECT id INTO v_phrase_250 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 250;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_250, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_250_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_250_0, 0, 75, 3, 'Eb5', 1),
    (v_chord_250_0, 1, 71, 11, 'Cb5', 1),
    (v_chord_250_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_250_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_250_0, 4, 73, 1, 'Db5', 1),
    (v_chord_250_0, 5, 71, 11, 'Cb5', 1),
    (v_chord_250_0, 6, 66, 6, 'Gb4', 1),
    (v_chord_250_0, 7, 63, 3, 'Eb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_250, 1, 'Db7', 2)
  RETURNING id INTO v_chord_250_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_250_1, 0, 67, 7, 'G4', 1),
    (v_chord_250_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_250_1, 2, 69, 9, 'Bbb4', 1),
    (v_chord_250_1, 3, 67, 7, 'G4', 1),
    (v_chord_250_1, 4, 68, 8, 'Ab4', 1),
    (v_chord_250_1, 5, 70, 10, 'Bb4', 1),
    (v_chord_250_1, 6, 71, 11, 'Cb5', 1),
    (v_chord_250_1, 7, 73, 1, 'Db5', 1);
  SELECT id INTO v_phrase_251 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 251;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_251, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_251_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_251_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_251_0, 1, 67, 7, 'G4', 1),
    (v_chord_251_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_251_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_251_0, 4, 71, 11, 'Cb5', 1),
    (v_chord_251_0, 5, 73, 1, 'Db5', 1),
    (v_chord_251_0, 6, 75, 3, 'Eb5', 1),
    (v_chord_251_0, 7, 78, 6, 'Gb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_251, 1, 'Db7', 2)
  RETURNING id INTO v_chord_251_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_251_1, 0, 77, 5, 'F5', 1),
    (v_chord_251_1, 1, 78, 6, 'Gb5', 1),
    (v_chord_251_1, 2, 77, 5, 'F5', 1),
    (v_chord_251_1, 3, 75, 3, 'Eb5', 1),
    (v_chord_251_1, 4, 74, 2, 'Ebb5', 1),
    (v_chord_251_1, 5, 73, 1, 'Db5', 1),
    (v_chord_251_1, 6, 72, 0, 'Dbb5', 1),
    (v_chord_251_1, 7, 71, 11, 'Cb5', 1),
    (v_chord_251_1, 8, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_253 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 253;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_253, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_253_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_253_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_253_0, 1, 67, 7, 'G4', 1),
    (v_chord_253_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_253_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_253_0, 4, 71, 11, 'Cb5', 1),
    (v_chord_253_0, 5, 73, 1, 'Db5', 1),
    (v_chord_253_0, 6, 75, 3, 'Eb5', 1),
    (v_chord_253_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_253, 1, 'Db7', 2)
  RETURNING id INTO v_chord_253_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_253_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_253_1, 1, 73, 1, 'Db5', 1),
    (v_chord_253_1, 2, 71, 11, 'Cb5', 1),
    (v_chord_253_1, 3, 63, 3, 'Eb4', 1),
    (v_chord_253_1, 4, 66, 6, 'Gb4', 1),
    (v_chord_253_1, 5, 70, 10, 'Bb4', 1),
    (v_chord_253_1, 6, 69, 9, 'Bbb4', 1),
    (v_chord_253_1, 7, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_254 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 254;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_254, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_254_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_254_0, 0, 73, 1, 'Db5', 1),
    (v_chord_254_0, 1, 71, 11, 'Cb5', 1),
    (v_chord_254_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_254_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_254_0, 4, 67, 7, 'G4', 1),
    (v_chord_254_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_254_0, 6, 69, 9, 'Bbb4', 1),
    (v_chord_254_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_254, 1, 'Db7', 2)
  RETURNING id INTO v_chord_254_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_254_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_254_1, 1, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_255 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 255;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_255, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_255_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_255_0, 0, 77, 5, 'F5', 1),
    (v_chord_255_0, 1, 78, 6, 'Gb5', 1),
    (v_chord_255_0, 2, 75, 3, 'Eb5', 1),
    (v_chord_255_0, 3, 71, 11, 'Cb5', 1),
    (v_chord_255_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_255_0, 5, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_255, 1, 'Db7', 2)
  RETURNING id INTO v_chord_255_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_255_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_255_1, 1, 71, 11, 'Cb5', 1),
    (v_chord_255_1, 2, 73, 1, 'Db5', 1),
    (v_chord_255_1, 3, 74, 2, 'D5', 1),
    (v_chord_255_1, 4, 77, 5, 'F5', 1),
    (v_chord_255_1, 5, 82, 10, 'Bb5', 1);
  SELECT id INTO v_phrase_256 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 256;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_256, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_256_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_256_0, 0, 77, 5, 'F5', 1),
    (v_chord_256_0, 1, 78, 6, 'Gb5', 1),
    (v_chord_256_0, 2, 75, 3, 'Eb5', 1),
    (v_chord_256_0, 3, 71, 11, 'Cb5', 1),
    (v_chord_256_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_256_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_256_0, 6, 67, 7, 'G4', 1),
    (v_chord_256_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_256, 1, 'Db7', 2)
  RETURNING id INTO v_chord_256_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_256_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_256_1, 1, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_257 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 257;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_257, 0, 'Abm7', 1)
  RETURNING id INTO v_chord_257_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_257_0, 0, 67, 7, 'G4', 1),
    (v_chord_257_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_257_0, 2, 71, 11, 'Cb5', 1),
    (v_chord_257_0, 3, 75, 3, 'Eb5', 1),
    (v_chord_257_0, 4, 78, 6, 'Gb5', 1),
    (v_chord_257_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_257_0, 6, 71, 11, 'Cb5', 1),
    (v_chord_257_0, 7, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_257, 1, 'Db7', 2)
  RETURNING id INTO v_chord_257_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_257_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_257_1, 1, 73, 1, 'Db5', 1);
  SELECT id INTO v_comp_228 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 228;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_228;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_228, 223, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_228, 224, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_228, 225, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_228, 226, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_228, 227, 4);
  SELECT id INTO v_comp_234 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 234;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_234;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_234, 229, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_234, 230, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_234, 231, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_234, 232, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_234, 233, 4);
  SELECT id INTO v_comp_240 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 240;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_240;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_240, 235, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_240, 236, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_240, 237, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_240, 238, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_240, 239, 4);
  SELECT id INTO v_comp_246 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 246;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_246;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_246, 241, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_246, 242, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_246, 243, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_246, 244, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_246, 245, 4);
  SELECT id INTO v_comp_252 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 252;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_252;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_252, 247, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_252, 248, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_252, 249, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_252, 250, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_252, 251, 4);
  SELECT id INTO v_comp_258 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 258;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_258;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_258, 253, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_258, 254, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_258, 255, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_258, 256, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_258, 257, 4);
END $$;

COMMIT;