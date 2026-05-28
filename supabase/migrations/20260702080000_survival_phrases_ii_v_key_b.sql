BEGIN;

-- Survival Phrases II-V key B: stages 259-294
-- MusicXML: 251譜面_-1st_B.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 259 AND 294
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 259 AND 294;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 259 AND 294
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 259 AND 294
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 259 AND 294;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 259 AND 294;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_b_1', 'II-V in B 1-5', 'II-V in B 1-5', 43)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_b_2', 'II-V in B 6-10', 'II-V in B 6-10', 44)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_b_3', 'II-V in B 11-15', 'II-V in B 11-15', 45)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_b_4', 'II-V in B 16-20', 'II-V in B 16-20', 46)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_b_5', 'II-V in B 21-25', 'II-V in B 21-25', 47)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_b_6', 'II-V in B 26-30', 'II-V in B 26-30', 48)
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
  259,
  'progression',
  'II-V in B · 1',
  'II-V in B · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_1',
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
  259,
  'II-V in B · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-01.mp3',
  5
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
  260,
  'progression',
  'II-V in B · 2',
  'II-V in B · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_1',
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
  260,
  'II-V in B · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-02.mp3',
  5
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
  261,
  'progression',
  'II-V in B · 3',
  'II-V in B · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_1',
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
  261,
  'II-V in B · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-03.mp3',
  5
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
  262,
  'progression',
  'II-V in B · 4',
  'II-V in B · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_1',
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
  262,
  'II-V in B · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-04.mp3',
  5
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
  263,
  'progression',
  'II-V in B · 5',
  'II-V in B · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_1',
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
  263,
  'II-V in B · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-05.mp3',
  5
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
  264,
  'progression',
  '複合フレーズ · II-V in B 1-5',
  'Composite · II-V in B 1-5',
  'easy',
  '',
  'II-V in B 1-5',
  'II-V in B 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_1',
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
VALUES ('phrases', 264, 'B', 5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  265,
  'progression',
  'II-V in B · 6',
  'II-V in B · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_2',
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
  265,
  'II-V in B · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-06.mp3',
  5
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
  266,
  'progression',
  'II-V in B · 7',
  'II-V in B · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_2',
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
  266,
  'II-V in B · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-07.mp3',
  5
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
  267,
  'progression',
  'II-V in B · 8',
  'II-V in B · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_2',
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
  267,
  'II-V in B · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-08.mp3',
  5
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
  268,
  'progression',
  'II-V in B · 9',
  'II-V in B · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_2',
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
  268,
  'II-V in B · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-09.mp3',
  5
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
  269,
  'progression',
  'II-V in B · 10',
  'II-V in B · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_2',
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
  269,
  'II-V in B · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-10.mp3',
  5
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
  270,
  'progression',
  '複合フレーズ · II-V in B 6-10',
  'Composite · II-V in B 6-10',
  'easy',
  '',
  'II-V in B 6-10',
  'II-V in B 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_2',
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
VALUES ('phrases', 270, 'C', 5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  271,
  'progression',
  'II-V in B · 11',
  'II-V in B · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_3',
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
  271,
  'II-V in B · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-11.mp3',
  5
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
  272,
  'progression',
  'II-V in B · 12',
  'II-V in B · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_3',
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
  272,
  'II-V in B · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-12.mp3',
  5
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
  273,
  'progression',
  'II-V in B · 13',
  'II-V in B · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_3',
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
  273,
  'II-V in B · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-13.mp3',
  5
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
  274,
  'progression',
  'II-V in B · 14',
  'II-V in B · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_3',
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
  274,
  'II-V in B · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-14.mp3',
  5
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
  275,
  'progression',
  'II-V in B · 15',
  'II-V in B · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_3',
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
  275,
  'II-V in B · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-15.mp3',
  5
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
  276,
  'progression',
  '複合フレーズ · II-V in B 11-15',
  'Composite · II-V in B 11-15',
  'easy',
  '',
  'II-V in B 11-15',
  'II-V in B 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_3',
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
VALUES ('phrases', 276, 'A', 5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  277,
  'progression',
  'II-V in B · 16',
  'II-V in B · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_4',
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
  277,
  'II-V in B · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-16.mp3',
  5
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
  278,
  'progression',
  'II-V in B · 17',
  'II-V in B · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_4',
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
  278,
  'II-V in B · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-17.mp3',
  5
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
  279,
  'progression',
  'II-V in B · 18',
  'II-V in B · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_4',
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
  279,
  'II-V in B · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-18.mp3',
  5
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
  280,
  'progression',
  'II-V in B · 19',
  'II-V in B · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_4',
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
  280,
  'II-V in B · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-19.mp3',
  5
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
  281,
  'progression',
  'II-V in B · 20',
  'II-V in B · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_4',
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
  281,
  'II-V in B · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-20.mp3',
  5
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
  282,
  'progression',
  '複合フレーズ · II-V in B 16-20',
  'Composite · II-V in B 16-20',
  'easy',
  '',
  'II-V in B 16-20',
  'II-V in B 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_4',
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
VALUES ('phrases', 282, 'B', 5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  283,
  'progression',
  'II-V in B · 21',
  'II-V in B · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_5',
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
  283,
  'II-V in B · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-21.mp3',
  5
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
  284,
  'progression',
  'II-V in B · 22',
  'II-V in B · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_5',
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
  284,
  'II-V in B · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-22.mp3',
  5
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
  285,
  'progression',
  'II-V in B · 23',
  'II-V in B · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_5',
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
  285,
  'II-V in B · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-23.mp3',
  5
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
  286,
  'progression',
  'II-V in B · 24',
  'II-V in B · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_5',
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
  286,
  'II-V in B · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-24.mp3',
  5
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
  287,
  'progression',
  'II-V in B · 25',
  'II-V in B · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_5',
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
  287,
  'II-V in B · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-25.mp3',
  5
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
  288,
  'progression',
  '複合フレーズ · II-V in B 21-25',
  'Composite · II-V in B 21-25',
  'easy',
  '',
  'II-V in B 21-25',
  'II-V in B 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_5',
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
VALUES ('phrases', 288, 'C', 5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  289,
  'progression',
  'II-V in B · 26',
  'II-V in B · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_6',
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
  289,
  'II-V in B · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-26.mp3',
  5
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
  290,
  'progression',
  'II-V in B · 27',
  'II-V in B · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_6',
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
  290,
  'II-V in B · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-27.mp3',
  5
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
  291,
  'progression',
  'II-V in B · 28',
  'II-V in B · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_6',
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
  291,
  'II-V in B · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-28.mp3',
  5
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
  292,
  'progression',
  'II-V in B · 29',
  'II-V in B · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_6',
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
  292,
  'II-V in B · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-29.mp3',
  5
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
  293,
  'progression',
  'II-V in B · 30',
  'II-V in B · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_6',
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
  293,
  'II-V in B · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-b-30.mp3',
  5
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
  294,
  'progression',
  '複合フレーズ · II-V in B 26-30',
  'Composite · II-V in B 26-30',
  'easy',
  '',
  'II-V in B 26-30',
  'II-V in B 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_b_6',
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
VALUES ('phrases', 294, 'A', 5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_259 uuid;
  v_chord_259_0 uuid;
  v_chord_259_1 uuid;
  v_phrase_260 uuid;
  v_chord_260_0 uuid;
  v_chord_260_1 uuid;
  v_phrase_261 uuid;
  v_chord_261_0 uuid;
  v_chord_261_1 uuid;
  v_phrase_262 uuid;
  v_chord_262_0 uuid;
  v_chord_262_1 uuid;
  v_phrase_263 uuid;
  v_chord_263_0 uuid;
  v_chord_263_1 uuid;
  v_phrase_265 uuid;
  v_chord_265_0 uuid;
  v_chord_265_1 uuid;
  v_phrase_266 uuid;
  v_chord_266_0 uuid;
  v_chord_266_1 uuid;
  v_phrase_267 uuid;
  v_chord_267_0 uuid;
  v_chord_267_1 uuid;
  v_phrase_268 uuid;
  v_chord_268_0 uuid;
  v_chord_268_1 uuid;
  v_phrase_269 uuid;
  v_chord_269_0 uuid;
  v_chord_269_1 uuid;
  v_phrase_271 uuid;
  v_chord_271_0 uuid;
  v_chord_271_1 uuid;
  v_phrase_272 uuid;
  v_chord_272_0 uuid;
  v_chord_272_1 uuid;
  v_phrase_273 uuid;
  v_chord_273_0 uuid;
  v_chord_273_1 uuid;
  v_phrase_274 uuid;
  v_chord_274_0 uuid;
  v_chord_274_1 uuid;
  v_phrase_275 uuid;
  v_chord_275_0 uuid;
  v_chord_275_1 uuid;
  v_phrase_277 uuid;
  v_chord_277_0 uuid;
  v_chord_277_1 uuid;
  v_phrase_278 uuid;
  v_chord_278_0 uuid;
  v_chord_278_1 uuid;
  v_phrase_279 uuid;
  v_chord_279_0 uuid;
  v_chord_279_1 uuid;
  v_phrase_280 uuid;
  v_chord_280_0 uuid;
  v_chord_280_1 uuid;
  v_phrase_281 uuid;
  v_chord_281_0 uuid;
  v_chord_281_1 uuid;
  v_phrase_283 uuid;
  v_chord_283_0 uuid;
  v_chord_283_1 uuid;
  v_phrase_284 uuid;
  v_chord_284_0 uuid;
  v_chord_284_1 uuid;
  v_phrase_285 uuid;
  v_chord_285_0 uuid;
  v_chord_285_1 uuid;
  v_phrase_286 uuid;
  v_chord_286_0 uuid;
  v_chord_286_1 uuid;
  v_phrase_287 uuid;
  v_chord_287_0 uuid;
  v_chord_287_1 uuid;
  v_phrase_289 uuid;
  v_chord_289_0 uuid;
  v_chord_289_1 uuid;
  v_phrase_290 uuid;
  v_chord_290_0 uuid;
  v_chord_290_1 uuid;
  v_phrase_291 uuid;
  v_chord_291_0 uuid;
  v_chord_291_1 uuid;
  v_phrase_292 uuid;
  v_chord_292_0 uuid;
  v_chord_292_1 uuid;
  v_phrase_293 uuid;
  v_chord_293_0 uuid;
  v_chord_293_1 uuid;
  v_comp_264 uuid;
  v_comp_270 uuid;
  v_comp_276 uuid;
  v_comp_282 uuid;
  v_comp_288 uuid;
  v_comp_294 uuid;
BEGIN
  SELECT id INTO v_phrase_259 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 259;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_259, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_259_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_259_0, 0, 75, 3, 'D#5', 1),
    (v_chord_259_0, 1, 71, 11, 'B4', 1),
    (v_chord_259_0, 2, 68, 8, 'G#4', 1),
    (v_chord_259_0, 3, 64, 4, 'E4', 1),
    (v_chord_259_0, 4, 68, 8, 'G#4', 1),
    (v_chord_259_0, 5, 71, 11, 'B4', 1),
    (v_chord_259_0, 6, 75, 3, 'D#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_259, 1, 'F#7', 2)
  RETURNING id INTO v_chord_259_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_259_1, 0, 78, 6, 'F#5', 1),
    (v_chord_259_1, 1, 76, 4, 'E5', 1),
    (v_chord_259_1, 2, 71, 11, 'B4', 1),
    (v_chord_259_1, 3, 68, 8, 'G#4', 1),
    (v_chord_259_1, 4, 75, 3, 'D#5', 1),
    (v_chord_259_1, 5, 73, 1, 'C#5', 1);
  SELECT id INTO v_phrase_260 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 260;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_260, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_260_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_260_0, 0, 62, 2, 'C##4', 1),
    (v_chord_260_0, 1, 63, 3, 'D#4', 1),
    (v_chord_260_0, 2, 66, 6, 'F#4', 1),
    (v_chord_260_0, 3, 63, 3, 'D#4', 1),
    (v_chord_260_0, 4, 64, 4, 'E4', 1),
    (v_chord_260_0, 5, 68, 8, 'G#4', 1),
    (v_chord_260_0, 6, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_260, 1, 'F#7', 2)
  RETURNING id INTO v_chord_260_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_260_1, 0, 75, 3, 'D#5', 1),
    (v_chord_260_1, 1, 73, 1, 'C#5', 1),
    (v_chord_260_1, 2, 68, 8, 'G#4', 1),
    (v_chord_260_1, 3, 64, 4, 'E4', 1),
    (v_chord_260_1, 4, 63, 3, 'D#4', 1),
    (v_chord_260_1, 5, 61, 1, 'C#4', 1);
  SELECT id INTO v_phrase_261 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 261;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_261, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_261_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_261_0, 0, 61, 1, 'C#4', 1),
    (v_chord_261_0, 1, 63, 3, 'D#4', 1),
    (v_chord_261_0, 2, 64, 4, 'E4', 1),
    (v_chord_261_0, 3, 66, 6, 'F#4', 1),
    (v_chord_261_0, 4, 68, 8, 'G#4', 1),
    (v_chord_261_0, 5, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_261, 1, 'F#7', 2)
  RETURNING id INTO v_chord_261_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_261_1, 0, 70, 10, 'A#4', 1),
    (v_chord_261_1, 1, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_262 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 262;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_262, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_262_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_262_0, 0, 66, 6, 'F#4', 1),
    (v_chord_262_0, 1, 64, 4, 'E4', 1),
    (v_chord_262_0, 2, 59, 11, 'B3', 1),
    (v_chord_262_0, 3, 56, 8, 'G#3', 1),
    (v_chord_262_0, 4, 63, 3, 'D#4', 1),
    (v_chord_262_0, 5, 60, 0, 'B#3', 1),
    (v_chord_262_0, 6, 61, 1, 'C#4', 1),
    (v_chord_262_0, 7, 63, 3, 'D#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_262, 1, 'F#7', 2)
  RETURNING id INTO v_chord_262_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_262_1, 0, 64, 4, 'E4', 1),
    (v_chord_262_1, 1, 66, 6, 'F#4', 1),
    (v_chord_262_1, 2, 68, 8, 'G#4', 1),
    (v_chord_262_1, 3, 64, 4, 'E4', 1),
    (v_chord_262_1, 4, 63, 3, 'D#4', 1),
    (v_chord_262_1, 5, 61, 1, 'C#4', 1);
  SELECT id INTO v_phrase_263 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 263;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_263, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_263_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_263_0, 0, 64, 4, 'E4', 1),
    (v_chord_263_0, 1, 66, 6, 'F#4', 1),
    (v_chord_263_0, 2, 68, 8, 'G#4', 1),
    (v_chord_263_0, 3, 64, 4, 'E4', 1),
    (v_chord_263_0, 4, 63, 3, 'D#4', 1),
    (v_chord_263_0, 5, 61, 1, 'C#4', 1),
    (v_chord_263_0, 6, 60, 0, 'B#3', 1),
    (v_chord_263_0, 7, 63, 3, 'D#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_263, 1, 'F#7', 2)
  RETURNING id INTO v_chord_263_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_263_1, 0, 61, 1, 'C#4', 1),
    (v_chord_263_1, 1, 59, 11, 'B3', 1),
    (v_chord_263_1, 2, 57, 9, 'G##3', 1),
    (v_chord_263_1, 3, 58, 10, 'A#3', 1),
    (v_chord_263_1, 4, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_265 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 265;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_265, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_265_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_265_0, 0, 61, 1, 'C#4', 1),
    (v_chord_265_0, 1, 64, 4, 'E4', 1),
    (v_chord_265_0, 2, 68, 8, 'G#4', 1),
    (v_chord_265_0, 3, 71, 11, 'B4', 1),
    (v_chord_265_0, 4, 68, 8, 'G#4', 1),
    (v_chord_265_0, 5, 69, 9, 'G##4', 1),
    (v_chord_265_0, 6, 70, 10, 'A#4', 1),
    (v_chord_265_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_265, 1, 'F#7', 2)
  RETURNING id INTO v_chord_265_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_265_1, 0, 64, 4, 'E4', 1),
    (v_chord_265_1, 1, 68, 8, 'G#4', 1),
    (v_chord_265_1, 2, 67, 7, 'G4', 1),
    (v_chord_265_1, 3, 65, 5, 'E#4', 1),
    (v_chord_265_1, 4, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_266 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 266;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_266, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_266_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_266_0, 0, 61, 1, 'C#4', 1),
    (v_chord_266_0, 1, 63, 3, 'D#4', 1),
    (v_chord_266_0, 2, 64, 4, 'E4', 1),
    (v_chord_266_0, 3, 66, 6, 'F#4', 1),
    (v_chord_266_0, 4, 68, 8, 'G#4', 1),
    (v_chord_266_0, 5, 70, 10, 'A#4', 1),
    (v_chord_266_0, 6, 71, 11, 'B4', 1),
    (v_chord_266_0, 7, 73, 1, 'C#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_266, 1, 'F#7', 2)
  RETURNING id INTO v_chord_266_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_266_1, 0, 75, 3, 'D#5', 1),
    (v_chord_266_1, 1, 78, 6, 'F#5', 1),
    (v_chord_266_1, 2, 76, 4, 'E5', 1),
    (v_chord_266_1, 3, 68, 8, 'G#4', 1),
    (v_chord_266_1, 4, 71, 11, 'B4', 1),
    (v_chord_266_1, 5, 75, 3, 'D#5', 1),
    (v_chord_266_1, 6, 73, 1, 'C#5', 1);
  SELECT id INTO v_phrase_267 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 267;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_267, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_267_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_267_0, 0, 63, 3, 'D#4', 1),
    (v_chord_267_0, 1, 60, 0, 'B#3', 1),
    (v_chord_267_0, 2, 61, 1, 'C#4', 1),
    (v_chord_267_0, 3, 63, 3, 'D#4', 1),
    (v_chord_267_0, 4, 64, 4, 'E4', 1),
    (v_chord_267_0, 5, 66, 6, 'F#4', 1),
    (v_chord_267_0, 6, 68, 8, 'G#4', 1),
    (v_chord_267_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_267, 1, 'F#7', 2)
  RETURNING id INTO v_chord_267_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_267_1, 0, 61, 1, 'C#4', 1),
    (v_chord_267_1, 1, 59, 11, 'B3', 1),
    (v_chord_267_1, 2, 57, 9, 'G##3', 1),
    (v_chord_267_1, 3, 58, 10, 'A#3', 1),
    (v_chord_267_1, 4, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_268 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 268;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_268, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_268_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_268_0, 0, 64, 4, 'E4', 1),
    (v_chord_268_0, 1, 66, 6, 'F#4', 1),
    (v_chord_268_0, 2, 68, 8, 'G#4', 1),
    (v_chord_268_0, 3, 71, 11, 'B4', 1),
    (v_chord_268_0, 4, 75, 3, 'D#5', 1),
    (v_chord_268_0, 5, 76, 4, 'E5', 1),
    (v_chord_268_0, 6, 72, 0, 'B#4', 1),
    (v_chord_268_0, 7, 75, 3, 'D#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_268, 1, 'F#7', 2)
  RETURNING id INTO v_chord_268_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_268_1, 0, 73, 1, 'C#5', 1),
    (v_chord_268_1, 1, 71, 11, 'B4', 1),
    (v_chord_268_1, 2, 68, 8, 'G#4', 1),
    (v_chord_268_1, 3, 69, 9, 'G##4', 1),
    (v_chord_268_1, 4, 70, 10, 'A#4', 1),
    (v_chord_268_1, 5, 68, 8, 'G#4', 1),
    (v_chord_268_1, 6, 66, 6, 'F#4', 1),
    (v_chord_268_1, 7, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_269 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 269;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_269, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_269_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_269_0, 0, 70, 10, 'A#4', 1),
    (v_chord_269_0, 1, 71, 11, 'B4', 1),
    (v_chord_269_0, 2, 68, 8, 'G#4', 1),
    (v_chord_269_0, 3, 64, 4, 'E4', 1),
    (v_chord_269_0, 4, 63, 3, 'D#4', 1),
    (v_chord_269_0, 5, 64, 4, 'E4', 1),
    (v_chord_269_0, 6, 68, 8, 'G#4', 1),
    (v_chord_269_0, 7, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_269, 1, 'F#7', 2)
  RETURNING id INTO v_chord_269_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_269_1, 0, 75, 3, 'D#5', 1),
    (v_chord_269_1, 1, 73, 1, 'C#5', 1),
    (v_chord_269_1, 2, 68, 8, 'G#4', 1),
    (v_chord_269_1, 3, 64, 4, 'E4', 1),
    (v_chord_269_1, 4, 63, 3, 'D#4', 1),
    (v_chord_269_1, 5, 61, 1, 'C#4', 1);
  SELECT id INTO v_phrase_271 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 271;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_271, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_271_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_271_0, 0, 64, 4, 'E4', 1),
    (v_chord_271_0, 1, 68, 8, 'G#4', 1),
    (v_chord_271_0, 2, 71, 11, 'B4', 1),
    (v_chord_271_0, 3, 75, 3, 'D#5', 1),
    (v_chord_271_0, 4, 78, 6, 'F#5', 1),
    (v_chord_271_0, 5, 76, 4, 'E5', 1),
    (v_chord_271_0, 6, 71, 11, 'B4', 1),
    (v_chord_271_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_271, 1, 'F#7', 2)
  RETURNING id INTO v_chord_271_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_271_1, 0, 75, 3, 'D#5', 1),
    (v_chord_271_1, 1, 73, 1, 'C#5', 1),
    (v_chord_271_1, 2, 71, 11, 'B4', 1),
    (v_chord_271_1, 3, 70, 10, 'A#4', 1),
    (v_chord_271_1, 4, 68, 8, 'G#4', 1),
    (v_chord_271_1, 5, 66, 6, 'F#4', 1),
    (v_chord_271_1, 6, 65, 5, 'E#4', 1);
  SELECT id INTO v_phrase_272 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 272;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_272, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_272_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_272_0, 0, 61, 1, 'C#4', 1),
    (v_chord_272_0, 1, 63, 3, 'D#4', 1),
    (v_chord_272_0, 2, 64, 4, 'E4', 1),
    (v_chord_272_0, 3, 66, 6, 'F#4', 1),
    (v_chord_272_0, 4, 68, 8, 'G#4', 1),
    (v_chord_272_0, 5, 64, 4, 'E4', 1),
    (v_chord_272_0, 6, 61, 1, 'C#4', 1),
    (v_chord_272_0, 7, 56, 8, 'G#3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_272, 1, 'F#7', 2)
  RETURNING id INTO v_chord_272_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_272_1, 0, 60, 0, 'B#3', 1),
    (v_chord_272_1, 1, 59, 11, 'B3', 1),
    (v_chord_272_1, 2, 57, 9, 'G##3', 1),
    (v_chord_272_1, 3, 58, 10, 'A#3', 1),
    (v_chord_272_1, 4, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_273 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 273;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_273, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_273_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_273_0, 0, 66, 6, 'F#4', 1),
    (v_chord_273_0, 1, 65, 5, 'F4', 1),
    (v_chord_273_0, 2, 64, 4, 'E4', 1),
    (v_chord_273_0, 3, 56, 8, 'G#3', 1),
    (v_chord_273_0, 4, 59, 11, 'B3', 1),
    (v_chord_273_0, 5, 63, 3, 'D#4', 1),
    (v_chord_273_0, 6, 62, 2, 'D4', 1),
    (v_chord_273_0, 7, 60, 0, 'B#3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_273, 1, 'F#7', 2)
  RETURNING id INTO v_chord_273_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_273_1, 0, 61, 1, 'C#4', 1),
    (v_chord_273_1, 1, 63, 3, 'D#4', 1),
    (v_chord_273_1, 2, 64, 4, 'E4', 1),
    (v_chord_273_1, 3, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_274 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 274;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_274, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_274_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_274_0, 0, 66, 6, 'F#4', 1),
    (v_chord_274_0, 1, 64, 4, 'E4', 1),
    (v_chord_274_0, 2, 66, 6, 'F#4', 1),
    (v_chord_274_0, 3, 64, 4, 'E4', 1),
    (v_chord_274_0, 4, 63, 3, 'D#4', 1),
    (v_chord_274_0, 5, 64, 4, 'E4', 1),
    (v_chord_274_0, 6, 68, 8, 'G#4', 1),
    (v_chord_274_0, 7, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_274, 1, 'F#7', 2)
  RETURNING id INTO v_chord_274_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_274_1, 0, 75, 3, 'D#5', 1),
    (v_chord_274_1, 1, 78, 6, 'F#5', 1),
    (v_chord_274_1, 2, 74, 2, 'D5', 1),
    (v_chord_274_1, 3, 73, 1, 'C#5', 1);
  SELECT id INTO v_phrase_275 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 275;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_275, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_275_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_275_0, 0, 63, 3, 'D#4', 1),
    (v_chord_275_0, 1, 64, 4, 'E4', 1),
    (v_chord_275_0, 2, 68, 8, 'G#4', 1),
    (v_chord_275_0, 3, 71, 11, 'B4', 1),
    (v_chord_275_0, 4, 75, 3, 'D#5', 1),
    (v_chord_275_0, 5, 78, 6, 'F#5', 1),
    (v_chord_275_0, 6, 76, 4, 'E5', 1),
    (v_chord_275_0, 7, 71, 11, 'B4', 1),
    (v_chord_275_0, 8, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_275, 1, 'F#7', 2)
  RETURNING id INTO v_chord_275_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_275_1, 0, 67, 7, 'G4', 1),
    (v_chord_275_1, 1, 75, 3, 'D#5', 1);
  SELECT id INTO v_phrase_277 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 277;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_277, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_277_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_277_0, 0, 76, 4, 'E5', 1),
    (v_chord_277_0, 1, 78, 6, 'F#5', 1),
    (v_chord_277_0, 2, 76, 4, 'E5', 1),
    (v_chord_277_0, 3, 75, 3, 'D#5', 1),
    (v_chord_277_0, 4, 74, 2, 'D5', 1),
    (v_chord_277_0, 5, 73, 1, 'C#5', 1),
    (v_chord_277_0, 6, 72, 0, 'C5', 1),
    (v_chord_277_0, 7, 71, 11, 'B4', 1),
    (v_chord_277_0, 8, 69, 9, 'G##4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_277, 1, 'F#7', 2)
  RETURNING id INTO v_chord_277_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_277_1, 0, 70, 10, 'A#4', 1),
    (v_chord_277_1, 1, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_278 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 278;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_278, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_278_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_278_0, 0, 64, 4, 'E4', 1),
    (v_chord_278_0, 1, 66, 6, 'F#4', 1),
    (v_chord_278_0, 2, 64, 4, 'E4', 1),
    (v_chord_278_0, 3, 63, 3, 'D#4', 1),
    (v_chord_278_0, 4, 64, 4, 'E4', 1),
    (v_chord_278_0, 5, 61, 1, 'C#4', 1),
    (v_chord_278_0, 6, 63, 3, 'D#4', 1),
    (v_chord_278_0, 7, 64, 4, 'E4', 1),
    (v_chord_278_0, 8, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_278, 1, 'F#7', 2)
  RETURNING id INTO v_chord_278_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_278_1, 0, 68, 8, 'G#4', 1),
    (v_chord_278_1, 1, 71, 11, 'B4', 1),
    (v_chord_278_1, 2, 68, 8, 'G#4', 1),
    (v_chord_278_1, 3, 69, 9, 'G##4', 1),
    (v_chord_278_1, 4, 70, 10, 'A#4', 1),
    (v_chord_278_1, 5, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_279 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 279;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_279, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_279_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_279_0, 0, 76, 4, 'E5', 1),
    (v_chord_279_0, 1, 71, 11, 'B4', 1),
    (v_chord_279_0, 2, 72, 0, 'B#4', 1),
    (v_chord_279_0, 3, 75, 3, 'D#5', 1),
    (v_chord_279_0, 4, 73, 1, 'C#5', 1),
    (v_chord_279_0, 5, 68, 8, 'G#4', 1),
    (v_chord_279_0, 6, 71, 11, 'B4', 1),
    (v_chord_279_0, 7, 69, 9, 'G##4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_279, 1, 'F#7', 2)
  RETURNING id INTO v_chord_279_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_279_1, 0, 70, 10, 'A#4', 1),
    (v_chord_279_1, 1, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_280 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 280;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_280, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_280_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_280_0, 0, 76, 4, 'E5', 1),
    (v_chord_280_0, 1, 71, 11, 'B4', 1),
    (v_chord_280_0, 2, 72, 0, 'B#4', 1),
    (v_chord_280_0, 3, 75, 3, 'D#5', 1),
    (v_chord_280_0, 4, 74, 2, 'D5', 1),
    (v_chord_280_0, 5, 72, 0, 'B#4', 1),
    (v_chord_280_0, 6, 73, 1, 'C#5', 1),
    (v_chord_280_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_280, 1, 'F#7', 2)
  RETURNING id INTO v_chord_280_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_280_1, 0, 71, 11, 'B4', 1),
    (v_chord_280_1, 1, 69, 9, 'G##4', 1),
    (v_chord_280_1, 2, 70, 10, 'A#4', 1),
    (v_chord_280_1, 3, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_281 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 281;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_281, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_281_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_281_0, 0, 68, 8, 'G#4', 1),
    (v_chord_281_0, 1, 71, 11, 'B4', 1),
    (v_chord_281_0, 2, 75, 3, 'D#5', 1),
    (v_chord_281_0, 3, 78, 6, 'F#5', 1),
    (v_chord_281_0, 4, 75, 3, 'D#5', 1),
    (v_chord_281_0, 5, 76, 4, 'E5', 1),
    (v_chord_281_0, 6, 80, 8, 'G#5', 1),
    (v_chord_281_0, 7, 83, 11, 'B5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_281, 1, 'F#7', 2)
  RETURNING id INTO v_chord_281_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_281_1, 0, 87, 3, 'D#6', 1),
    (v_chord_281_1, 1, 85, 1, 'C#6', 1),
    (v_chord_281_1, 2, 80, 8, 'G#5', 1),
    (v_chord_281_1, 3, 76, 4, 'E5', 1),
    (v_chord_281_1, 4, 75, 3, 'D#5', 1),
    (v_chord_281_1, 5, 73, 1, 'C#5', 1);
  SELECT id INTO v_phrase_283 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 283;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_283, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_283_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_283_0, 0, 60, 0, 'B#3', 1),
    (v_chord_283_0, 1, 61, 1, 'C#4', 1),
    (v_chord_283_0, 2, 63, 3, 'D#4', 1),
    (v_chord_283_0, 3, 64, 4, 'E4', 1),
    (v_chord_283_0, 4, 66, 6, 'F#4', 1),
    (v_chord_283_0, 5, 68, 8, 'G#4', 1),
    (v_chord_283_0, 6, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_283, 1, 'F#7', 2)
  RETURNING id INTO v_chord_283_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_283_1, 0, 70, 10, 'A#4', 1),
    (v_chord_283_1, 1, 71, 11, 'B4', 1),
    (v_chord_283_1, 2, 70, 10, 'A#4', 1),
    (v_chord_283_1, 3, 68, 8, 'G#4', 1),
    (v_chord_283_1, 4, 67, 7, 'G4', 1),
    (v_chord_283_1, 5, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_284 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 284;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_284, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_284_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_284_0, 0, 67, 7, 'F##4', 1),
    (v_chord_284_0, 1, 68, 8, 'G#4', 1),
    (v_chord_284_0, 2, 71, 11, 'B4', 1),
    (v_chord_284_0, 3, 75, 3, 'D#5', 1),
    (v_chord_284_0, 4, 78, 6, 'F#5', 1),
    (v_chord_284_0, 5, 77, 5, 'F5', 1),
    (v_chord_284_0, 6, 75, 3, 'D#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_284, 1, 'F#7', 2)
  RETURNING id INTO v_chord_284_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_284_1, 0, 76, 4, 'E5', 1),
    (v_chord_284_1, 1, 68, 8, 'G#4', 1),
    (v_chord_284_1, 2, 71, 11, 'B4', 1),
    (v_chord_284_1, 3, 75, 3, 'D#5', 1),
    (v_chord_284_1, 4, 75, 3, 'D#5', 1),
    (v_chord_284_1, 5, 73, 1, 'C#5', 1);
  SELECT id INTO v_phrase_285 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 285;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_285, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_285_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_285_0, 0, 62, 2, 'C##4', 1),
    (v_chord_285_0, 1, 63, 3, 'D#4', 1),
    (v_chord_285_0, 2, 66, 6, 'F#4', 1),
    (v_chord_285_0, 3, 63, 3, 'D#4', 1),
    (v_chord_285_0, 4, 64, 4, 'E4', 1),
    (v_chord_285_0, 5, 68, 8, 'G#4', 1),
    (v_chord_285_0, 6, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_285, 1, 'F#7', 2)
  RETURNING id INTO v_chord_285_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_285_1, 0, 75, 3, 'D#5', 1),
    (v_chord_285_1, 1, 73, 1, 'C#5', 1),
    (v_chord_285_1, 2, 72, 0, 'B#4', 1),
    (v_chord_285_1, 3, 70, 10, 'A#4', 1),
    (v_chord_285_1, 4, 69, 9, 'A4', 1),
    (v_chord_285_1, 5, 67, 7, 'G4', 1),
    (v_chord_285_1, 6, 66, 6, 'F#4', 1),
    (v_chord_285_1, 7, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_286 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 286;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_286, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_286_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_286_0, 0, 80, 8, 'G#5', 1),
    (v_chord_286_0, 1, 76, 4, 'E5', 1),
    (v_chord_286_0, 2, 75, 3, 'D#5', 1),
    (v_chord_286_0, 3, 73, 1, 'C#5', 1),
    (v_chord_286_0, 4, 78, 6, 'F#5', 1),
    (v_chord_286_0, 5, 76, 4, 'E5', 1),
    (v_chord_286_0, 6, 71, 11, 'B4', 1),
    (v_chord_286_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_286, 1, 'F#7', 2)
  RETURNING id INTO v_chord_286_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_286_1, 0, 72, 0, 'B#4', 1),
    (v_chord_286_1, 1, 75, 3, 'D#5', 1),
    (v_chord_286_1, 2, 74, 2, 'D5', 1),
    (v_chord_286_1, 3, 72, 0, 'B#4', 1),
    (v_chord_286_1, 4, 73, 1, 'C#5', 1),
    (v_chord_286_1, 5, 75, 3, 'D#5', 1),
    (v_chord_286_1, 6, 76, 4, 'E5', 1),
    (v_chord_286_1, 7, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_287 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 287;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_287, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_287_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_287_0, 0, 61, 1, 'C#4', 1),
    (v_chord_287_0, 1, 60, 0, 'B#3', 1),
    (v_chord_287_0, 2, 61, 1, 'C#4', 1),
    (v_chord_287_0, 3, 63, 3, 'D#4', 1),
    (v_chord_287_0, 4, 64, 4, 'E4', 1),
    (v_chord_287_0, 5, 66, 6, 'F#4', 1),
    (v_chord_287_0, 6, 68, 8, 'G#4', 1),
    (v_chord_287_0, 7, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_287, 1, 'F#7', 2)
  RETURNING id INTO v_chord_287_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_287_1, 0, 70, 10, 'A#4', 1),
    (v_chord_287_1, 1, 71, 11, 'B4', 1),
    (v_chord_287_1, 2, 70, 10, 'A#4', 1),
    (v_chord_287_1, 3, 68, 8, 'G#4', 1),
    (v_chord_287_1, 4, 67, 7, 'G4', 1),
    (v_chord_287_1, 5, 66, 6, 'F#4', 1),
    (v_chord_287_1, 6, 65, 5, 'F4', 1),
    (v_chord_287_1, 7, 64, 4, 'E4', 1),
    (v_chord_287_1, 8, 63, 3, 'D#4', 1);
  SELECT id INTO v_phrase_289 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 289;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_289, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_289_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_289_0, 0, 61, 1, 'C#4', 1),
    (v_chord_289_0, 1, 60, 0, 'B#3', 1),
    (v_chord_289_0, 2, 61, 1, 'C#4', 1),
    (v_chord_289_0, 3, 63, 3, 'D#4', 1),
    (v_chord_289_0, 4, 64, 4, 'E4', 1),
    (v_chord_289_0, 5, 66, 6, 'F#4', 1),
    (v_chord_289_0, 6, 68, 8, 'G#4', 1),
    (v_chord_289_0, 7, 62, 2, 'C##4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_289, 1, 'F#7', 2)
  RETURNING id INTO v_chord_289_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_289_1, 0, 63, 3, 'D#4', 1),
    (v_chord_289_1, 1, 66, 6, 'F#4', 1),
    (v_chord_289_1, 2, 64, 4, 'E4', 1),
    (v_chord_289_1, 3, 56, 8, 'G#3', 1),
    (v_chord_289_1, 4, 59, 11, 'B3', 1),
    (v_chord_289_1, 5, 63, 3, 'D#4', 1),
    (v_chord_289_1, 6, 62, 2, 'D4', 1),
    (v_chord_289_1, 7, 60, 0, 'B#3', 1);
  SELECT id INTO v_phrase_290 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 290;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_290, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_290_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_290_0, 0, 78, 6, 'F#5', 1),
    (v_chord_290_0, 1, 76, 4, 'E5', 1),
    (v_chord_290_0, 2, 71, 11, 'B4', 1),
    (v_chord_290_0, 3, 68, 8, 'G#4', 1),
    (v_chord_290_0, 4, 72, 0, 'B#4', 1),
    (v_chord_290_0, 5, 75, 3, 'D#5', 1),
    (v_chord_290_0, 6, 74, 2, 'D5', 1),
    (v_chord_290_0, 7, 72, 0, 'B#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_290, 1, 'F#7', 2)
  RETURNING id INTO v_chord_290_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_290_1, 0, 73, 1, 'C#5', 1),
    (v_chord_290_1, 1, 68, 8, 'G#4', 1);
  SELECT id INTO v_phrase_291 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 291;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_291, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_291_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_291_0, 0, 70, 10, 'A#4', 1),
    (v_chord_291_0, 1, 71, 11, 'B4', 1),
    (v_chord_291_0, 2, 68, 8, 'G#4', 1),
    (v_chord_291_0, 3, 64, 4, 'E4', 1),
    (v_chord_291_0, 4, 63, 3, 'D#4', 1),
    (v_chord_291_0, 5, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_291, 1, 'F#7', 2)
  RETURNING id INTO v_chord_291_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_291_1, 0, 63, 3, 'D#4', 1),
    (v_chord_291_1, 1, 64, 4, 'E4', 1),
    (v_chord_291_1, 2, 66, 6, 'F#4', 1),
    (v_chord_291_1, 3, 67, 7, 'F##4', 1),
    (v_chord_291_1, 4, 70, 10, 'A#4', 1),
    (v_chord_291_1, 5, 75, 3, 'D#5', 1);
  SELECT id INTO v_phrase_292 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 292;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_292, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_292_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_292_0, 0, 70, 10, 'A#4', 1),
    (v_chord_292_0, 1, 71, 11, 'B4', 1),
    (v_chord_292_0, 2, 68, 8, 'G#4', 1),
    (v_chord_292_0, 3, 64, 4, 'E4', 1),
    (v_chord_292_0, 4, 63, 3, 'D#4', 1),
    (v_chord_292_0, 5, 61, 1, 'C#4', 1),
    (v_chord_292_0, 6, 60, 0, 'B#3', 1),
    (v_chord_292_0, 7, 63, 3, 'D#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_292, 1, 'F#7', 2)
  RETURNING id INTO v_chord_292_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_292_1, 0, 61, 1, 'C#4', 1),
    (v_chord_292_1, 1, 56, 8, 'G#3', 1);
  SELECT id INTO v_phrase_293 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 293;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_293, 0, 'C#m7', 1)
  RETURNING id INTO v_chord_293_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_293_0, 0, 60, 0, 'B#3', 1),
    (v_chord_293_0, 1, 61, 1, 'C#4', 1),
    (v_chord_293_0, 2, 64, 4, 'E4', 1),
    (v_chord_293_0, 3, 68, 8, 'G#4', 1),
    (v_chord_293_0, 4, 71, 11, 'B4', 1),
    (v_chord_293_0, 5, 68, 8, 'G#4', 1),
    (v_chord_293_0, 6, 64, 4, 'E4', 1),
    (v_chord_293_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_293, 1, 'F#7', 2)
  RETURNING id INTO v_chord_293_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_293_1, 0, 63, 3, 'D#4', 1),
    (v_chord_293_1, 1, 66, 6, 'F#4', 1);
  SELECT id INTO v_comp_264 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 264;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_264;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_264, 259, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_264, 260, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_264, 261, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_264, 262, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_264, 263, 4);
  SELECT id INTO v_comp_270 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 270;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_270;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_270, 265, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_270, 266, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_270, 267, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_270, 268, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_270, 269, 4);
  SELECT id INTO v_comp_276 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 276;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_276;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_276, 271, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_276, 272, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_276, 273, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_276, 274, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_276, 275, 4);
  SELECT id INTO v_comp_282 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 282;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_282;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_282, 277, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_282, 278, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_282, 279, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_282, 280, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_282, 281, 4);
  SELECT id INTO v_comp_288 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 288;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_288;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_288, 283, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_288, 284, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_288, 285, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_288, 286, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_288, 287, 4);
  SELECT id INTO v_comp_294 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 294;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_294;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_294, 289, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_294, 290, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_294, 291, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_294, 292, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_294, 293, 4);
END $$;

COMMIT;