BEGIN;

-- Survival Phrases II-V key Eb: stages 115-150
-- MusicXML: 251譜面_+3st_Eb.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 115 AND 150
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 115 AND 150;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 115 AND 150
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 115 AND 150
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 115 AND 150;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 115 AND 150;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_eb_1', 'II-V in Eb 1-5', 'II-V in Eb 1-5', 19)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_eb_2', 'II-V in Eb 6-10', 'II-V in Eb 6-10', 20)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_eb_3', 'II-V in Eb 11-15', 'II-V in Eb 11-15', 21)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_eb_4', 'II-V in Eb 16-20', 'II-V in Eb 16-20', 22)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_eb_5', 'II-V in Eb 21-25', 'II-V in Eb 21-25', 23)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_eb_6', 'II-V in Eb 26-30', 'II-V in Eb 26-30', 24)
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
  115,
  'progression',
  'II-V in Eb · 1',
  'II-V in Eb · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_1',
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
  115,
  'II-V in Eb · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-01.mp3',
  -3
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
  116,
  'progression',
  'II-V in Eb · 2',
  'II-V in Eb · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_1',
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
  116,
  'II-V in Eb · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-02.mp3',
  -3
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
  117,
  'progression',
  'II-V in Eb · 3',
  'II-V in Eb · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_1',
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
  117,
  'II-V in Eb · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-03.mp3',
  -3
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
  118,
  'progression',
  'II-V in Eb · 4',
  'II-V in Eb · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_1',
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
  118,
  'II-V in Eb · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-04.mp3',
  -3
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
  119,
  'progression',
  'II-V in Eb · 5',
  'II-V in Eb · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_1',
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
  119,
  'II-V in Eb · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-05.mp3',
  -3
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
  120,
  'progression',
  '複合フレーズ · II-V in Eb 1-5',
  'Composite · II-V in Eb 1-5',
  'easy',
  '',
  'II-V in Eb 1-5',
  'II-V in Eb 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_1',
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
VALUES ('phrases', 120, 'B', -3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  121,
  'progression',
  'II-V in Eb · 6',
  'II-V in Eb · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_2',
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
  121,
  'II-V in Eb · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-06.mp3',
  -3
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
  122,
  'progression',
  'II-V in Eb · 7',
  'II-V in Eb · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_2',
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
  122,
  'II-V in Eb · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-07.mp3',
  -3
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
  123,
  'progression',
  'II-V in Eb · 8',
  'II-V in Eb · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_2',
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
  123,
  'II-V in Eb · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-08.mp3',
  -3
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
  124,
  'progression',
  'II-V in Eb · 9',
  'II-V in Eb · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_2',
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
  124,
  'II-V in Eb · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-09.mp3',
  -3
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
  125,
  'progression',
  'II-V in Eb · 10',
  'II-V in Eb · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_2',
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
  125,
  'II-V in Eb · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-10.mp3',
  -3
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
  126,
  'progression',
  '複合フレーズ · II-V in Eb 6-10',
  'Composite · II-V in Eb 6-10',
  'easy',
  '',
  'II-V in Eb 6-10',
  'II-V in Eb 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_2',
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
VALUES ('phrases', 126, 'C', -3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  127,
  'progression',
  'II-V in Eb · 11',
  'II-V in Eb · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_3',
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
  127,
  'II-V in Eb · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-11.mp3',
  -3
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
  128,
  'progression',
  'II-V in Eb · 12',
  'II-V in Eb · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_3',
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
  128,
  'II-V in Eb · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-12.mp3',
  -3
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
  129,
  'progression',
  'II-V in Eb · 13',
  'II-V in Eb · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_3',
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
  129,
  'II-V in Eb · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-13.mp3',
  -3
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
  130,
  'progression',
  'II-V in Eb · 14',
  'II-V in Eb · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_3',
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
  130,
  'II-V in Eb · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-14.mp3',
  -3
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
  131,
  'progression',
  'II-V in Eb · 15',
  'II-V in Eb · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_3',
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
  131,
  'II-V in Eb · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-15.mp3',
  -3
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
  132,
  'progression',
  '複合フレーズ · II-V in Eb 11-15',
  'Composite · II-V in Eb 11-15',
  'easy',
  '',
  'II-V in Eb 11-15',
  'II-V in Eb 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_3',
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
VALUES ('phrases', 132, 'A', -3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  133,
  'progression',
  'II-V in Eb · 16',
  'II-V in Eb · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_4',
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
  133,
  'II-V in Eb · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-16.mp3',
  -3
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
  134,
  'progression',
  'II-V in Eb · 17',
  'II-V in Eb · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_4',
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
  134,
  'II-V in Eb · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-17.mp3',
  -3
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
  135,
  'progression',
  'II-V in Eb · 18',
  'II-V in Eb · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_4',
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
  135,
  'II-V in Eb · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-18.mp3',
  -3
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
  136,
  'progression',
  'II-V in Eb · 19',
  'II-V in Eb · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_4',
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
  136,
  'II-V in Eb · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-19.mp3',
  -3
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
  137,
  'progression',
  'II-V in Eb · 20',
  'II-V in Eb · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_4',
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
  137,
  'II-V in Eb · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-20.mp3',
  -3
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
  138,
  'progression',
  '複合フレーズ · II-V in Eb 16-20',
  'Composite · II-V in Eb 16-20',
  'easy',
  '',
  'II-V in Eb 16-20',
  'II-V in Eb 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_4',
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
VALUES ('phrases', 138, 'B', -3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  139,
  'progression',
  'II-V in Eb · 21',
  'II-V in Eb · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_5',
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
  139,
  'II-V in Eb · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-21.mp3',
  -3
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
  140,
  'progression',
  'II-V in Eb · 22',
  'II-V in Eb · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_5',
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
  140,
  'II-V in Eb · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-22.mp3',
  -3
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
  141,
  'progression',
  'II-V in Eb · 23',
  'II-V in Eb · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_5',
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
  141,
  'II-V in Eb · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-23.mp3',
  -3
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
  142,
  'progression',
  'II-V in Eb · 24',
  'II-V in Eb · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_5',
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
  142,
  'II-V in Eb · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-24.mp3',
  -3
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
  143,
  'progression',
  'II-V in Eb · 25',
  'II-V in Eb · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_5',
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
  143,
  'II-V in Eb · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-25.mp3',
  -3
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
  144,
  'progression',
  '複合フレーズ · II-V in Eb 21-25',
  'Composite · II-V in Eb 21-25',
  'easy',
  '',
  'II-V in Eb 21-25',
  'II-V in Eb 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_5',
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
VALUES ('phrases', 144, 'C', -3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  145,
  'progression',
  'II-V in Eb · 26',
  'II-V in Eb · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_6',
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
  145,
  'II-V in Eb · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-26.mp3',
  -3
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
  146,
  'progression',
  'II-V in Eb · 27',
  'II-V in Eb · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_6',
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
  146,
  'II-V in Eb · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-27.mp3',
  -3
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
  147,
  'progression',
  'II-V in Eb · 28',
  'II-V in Eb · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_6',
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
  147,
  'II-V in Eb · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-28.mp3',
  -3
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
  148,
  'progression',
  'II-V in Eb · 29',
  'II-V in Eb · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_6',
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
  148,
  'II-V in Eb · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-29.mp3',
  -3
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
  149,
  'progression',
  'II-V in Eb · 30',
  'II-V in Eb · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_6',
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
  149,
  'II-V in Eb · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-eb-30.mp3',
  -3
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
  150,
  'progression',
  '複合フレーズ · II-V in Eb 26-30',
  'Composite · II-V in Eb 26-30',
  'easy',
  '',
  'II-V in Eb 26-30',
  'II-V in Eb 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_eb_6',
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
VALUES ('phrases', 150, 'A', -3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_115 uuid;
  v_chord_115_0 uuid;
  v_chord_115_1 uuid;
  v_phrase_116 uuid;
  v_chord_116_0 uuid;
  v_chord_116_1 uuid;
  v_phrase_117 uuid;
  v_chord_117_0 uuid;
  v_chord_117_1 uuid;
  v_phrase_118 uuid;
  v_chord_118_0 uuid;
  v_chord_118_1 uuid;
  v_phrase_119 uuid;
  v_chord_119_0 uuid;
  v_chord_119_1 uuid;
  v_phrase_121 uuid;
  v_chord_121_0 uuid;
  v_chord_121_1 uuid;
  v_phrase_122 uuid;
  v_chord_122_0 uuid;
  v_chord_122_1 uuid;
  v_phrase_123 uuid;
  v_chord_123_0 uuid;
  v_chord_123_1 uuid;
  v_phrase_124 uuid;
  v_chord_124_0 uuid;
  v_chord_124_1 uuid;
  v_phrase_125 uuid;
  v_chord_125_0 uuid;
  v_chord_125_1 uuid;
  v_phrase_127 uuid;
  v_chord_127_0 uuid;
  v_chord_127_1 uuid;
  v_phrase_128 uuid;
  v_chord_128_0 uuid;
  v_chord_128_1 uuid;
  v_phrase_129 uuid;
  v_chord_129_0 uuid;
  v_chord_129_1 uuid;
  v_phrase_130 uuid;
  v_chord_130_0 uuid;
  v_chord_130_1 uuid;
  v_phrase_131 uuid;
  v_chord_131_0 uuid;
  v_chord_131_1 uuid;
  v_phrase_133 uuid;
  v_chord_133_0 uuid;
  v_chord_133_1 uuid;
  v_phrase_134 uuid;
  v_chord_134_0 uuid;
  v_chord_134_1 uuid;
  v_phrase_135 uuid;
  v_chord_135_0 uuid;
  v_chord_135_1 uuid;
  v_phrase_136 uuid;
  v_chord_136_0 uuid;
  v_chord_136_1 uuid;
  v_phrase_137 uuid;
  v_chord_137_0 uuid;
  v_chord_137_1 uuid;
  v_phrase_139 uuid;
  v_chord_139_0 uuid;
  v_chord_139_1 uuid;
  v_phrase_140 uuid;
  v_chord_140_0 uuid;
  v_chord_140_1 uuid;
  v_phrase_141 uuid;
  v_chord_141_0 uuid;
  v_chord_141_1 uuid;
  v_phrase_142 uuid;
  v_chord_142_0 uuid;
  v_chord_142_1 uuid;
  v_phrase_143 uuid;
  v_chord_143_0 uuid;
  v_chord_143_1 uuid;
  v_phrase_145 uuid;
  v_chord_145_0 uuid;
  v_chord_145_1 uuid;
  v_phrase_146 uuid;
  v_chord_146_0 uuid;
  v_chord_146_1 uuid;
  v_phrase_147 uuid;
  v_chord_147_0 uuid;
  v_chord_147_1 uuid;
  v_phrase_148 uuid;
  v_chord_148_0 uuid;
  v_chord_148_1 uuid;
  v_phrase_149 uuid;
  v_chord_149_0 uuid;
  v_chord_149_1 uuid;
  v_comp_120 uuid;
  v_comp_126 uuid;
  v_comp_132 uuid;
  v_comp_138 uuid;
  v_comp_144 uuid;
  v_comp_150 uuid;
BEGIN
  SELECT id INTO v_phrase_115 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 115;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_115, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_115_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_115_0, 0, 79, 7, 'G5', 1),
    (v_chord_115_0, 1, 75, 3, 'Eb5', 1),
    (v_chord_115_0, 2, 72, 0, 'C5', 1),
    (v_chord_115_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_115_0, 4, 72, 0, 'C5', 1),
    (v_chord_115_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_115_0, 6, 79, 7, 'G5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_115, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_115_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_115_1, 0, 82, 10, 'Bb5', 1),
    (v_chord_115_1, 1, 80, 8, 'Ab5', 1),
    (v_chord_115_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_115_1, 3, 72, 0, 'C5', 1),
    (v_chord_115_1, 4, 79, 7, 'G5', 1),
    (v_chord_115_1, 5, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_116 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 116;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_116, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_116_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_116_0, 0, 66, 6, 'F#4', 1),
    (v_chord_116_0, 1, 67, 7, 'G4', 1),
    (v_chord_116_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_116_0, 3, 67, 7, 'G4', 1),
    (v_chord_116_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_116_0, 5, 72, 0, 'C5', 1),
    (v_chord_116_0, 6, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_116, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_116_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_116_1, 0, 79, 7, 'G5', 1),
    (v_chord_116_1, 1, 77, 5, 'F5', 1),
    (v_chord_116_1, 2, 72, 0, 'C5', 1),
    (v_chord_116_1, 3, 68, 8, 'Ab4', 1),
    (v_chord_116_1, 4, 67, 7, 'G4', 1),
    (v_chord_116_1, 5, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_117 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 117;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_117, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_117_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_117_0, 0, 65, 5, 'F4', 1),
    (v_chord_117_0, 1, 67, 7, 'G4', 1),
    (v_chord_117_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_117_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_117_0, 4, 72, 0, 'C5', 1),
    (v_chord_117_0, 5, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_117, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_117_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_117_1, 0, 74, 2, 'D5', 1),
    (v_chord_117_1, 1, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_118 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 118;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_118, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_118_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_118_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_118_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_118_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_118_0, 3, 60, 0, 'C4', 1),
    (v_chord_118_0, 4, 67, 7, 'G4', 1),
    (v_chord_118_0, 5, 64, 4, 'E4', 1),
    (v_chord_118_0, 6, 65, 5, 'F4', 1),
    (v_chord_118_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_118, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_118_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_118_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_118_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_118_1, 2, 72, 0, 'C5', 1),
    (v_chord_118_1, 3, 68, 8, 'Ab4', 1),
    (v_chord_118_1, 4, 67, 7, 'G4', 1),
    (v_chord_118_1, 5, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_119 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 119;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_119, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_119_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_119_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_119_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_119_0, 2, 72, 0, 'C5', 1),
    (v_chord_119_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_119_0, 4, 67, 7, 'G4', 1),
    (v_chord_119_0, 5, 65, 5, 'F4', 1),
    (v_chord_119_0, 6, 64, 4, 'E4', 1),
    (v_chord_119_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_119, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_119_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_119_1, 0, 65, 5, 'F4', 1),
    (v_chord_119_1, 1, 63, 3, 'Eb4', 1),
    (v_chord_119_1, 2, 61, 1, 'C#4', 1),
    (v_chord_119_1, 3, 62, 2, 'D4', 1),
    (v_chord_119_1, 4, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_121 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 121;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_121, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_121_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_121_0, 0, 65, 5, 'F4', 1),
    (v_chord_121_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_121_0, 2, 72, 0, 'C5', 1),
    (v_chord_121_0, 3, 75, 3, 'Eb5', 1),
    (v_chord_121_0, 4, 72, 0, 'C5', 1),
    (v_chord_121_0, 5, 73, 1, 'C#5', 1),
    (v_chord_121_0, 6, 74, 2, 'D5', 1),
    (v_chord_121_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_121, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_121_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_121_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_121_1, 1, 72, 0, 'C5', 1),
    (v_chord_121_1, 2, 71, 11, 'Cb5', 1),
    (v_chord_121_1, 3, 69, 9, 'A4', 1),
    (v_chord_121_1, 4, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_122 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 122;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_122, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_122_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_122_0, 0, 65, 5, 'F4', 1),
    (v_chord_122_0, 1, 67, 7, 'G4', 1),
    (v_chord_122_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_122_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_122_0, 4, 72, 0, 'C5', 1),
    (v_chord_122_0, 5, 74, 2, 'D5', 1),
    (v_chord_122_0, 6, 75, 3, 'Eb5', 1),
    (v_chord_122_0, 7, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_122, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_122_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_122_1, 0, 79, 7, 'G5', 1),
    (v_chord_122_1, 1, 82, 10, 'Bb5', 1),
    (v_chord_122_1, 2, 80, 8, 'Ab5', 1),
    (v_chord_122_1, 3, 72, 0, 'C5', 1),
    (v_chord_122_1, 4, 75, 3, 'Eb5', 1),
    (v_chord_122_1, 5, 79, 7, 'G5', 1),
    (v_chord_122_1, 6, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_123 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 123;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_123, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_123_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_123_0, 0, 67, 7, 'G4', 1),
    (v_chord_123_0, 1, 64, 4, 'E4', 1),
    (v_chord_123_0, 2, 65, 5, 'F4', 1),
    (v_chord_123_0, 3, 67, 7, 'G4', 1),
    (v_chord_123_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_123_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_123_0, 6, 72, 0, 'C5', 1),
    (v_chord_123_0, 7, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_123, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_123_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_123_1, 0, 65, 5, 'F4', 1),
    (v_chord_123_1, 1, 63, 3, 'Eb4', 1),
    (v_chord_123_1, 2, 61, 1, 'C#4', 1),
    (v_chord_123_1, 3, 62, 2, 'D4', 1),
    (v_chord_123_1, 4, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_124 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 124;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_124, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_124_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_124_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_124_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_124_0, 2, 72, 0, 'C5', 1),
    (v_chord_124_0, 3, 75, 3, 'Eb5', 1),
    (v_chord_124_0, 4, 79, 7, 'G5', 1),
    (v_chord_124_0, 5, 80, 8, 'Ab5', 1),
    (v_chord_124_0, 6, 76, 4, 'E5', 1),
    (v_chord_124_0, 7, 79, 7, 'G5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_124, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_124_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_124_1, 0, 77, 5, 'F5', 1),
    (v_chord_124_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_124_1, 2, 72, 0, 'C5', 1),
    (v_chord_124_1, 3, 73, 1, 'C#5', 1),
    (v_chord_124_1, 4, 74, 2, 'D5', 1),
    (v_chord_124_1, 5, 72, 0, 'C5', 1),
    (v_chord_124_1, 6, 70, 10, 'Bb4', 1),
    (v_chord_124_1, 7, 69, 9, 'Bbb4', 1);
  SELECT id INTO v_phrase_125 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 125;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_125, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_125_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_125_0, 0, 74, 2, 'D5', 1),
    (v_chord_125_0, 1, 75, 3, 'Eb5', 1),
    (v_chord_125_0, 2, 72, 0, 'C5', 1),
    (v_chord_125_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_125_0, 4, 67, 7, 'G4', 1),
    (v_chord_125_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_125_0, 6, 72, 0, 'C5', 1),
    (v_chord_125_0, 7, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_125, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_125_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_125_1, 0, 79, 7, 'G5', 1),
    (v_chord_125_1, 1, 77, 5, 'F5', 1),
    (v_chord_125_1, 2, 72, 0, 'C5', 1),
    (v_chord_125_1, 3, 68, 8, 'Ab4', 1),
    (v_chord_125_1, 4, 67, 7, 'G4', 1),
    (v_chord_125_1, 5, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_127 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 127;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_127, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_127_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_127_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_127_0, 1, 72, 0, 'C5', 1),
    (v_chord_127_0, 2, 75, 3, 'Eb5', 1),
    (v_chord_127_0, 3, 79, 7, 'G5', 1),
    (v_chord_127_0, 4, 82, 10, 'Bb5', 1),
    (v_chord_127_0, 5, 80, 8, 'Ab5', 1),
    (v_chord_127_0, 6, 75, 3, 'Eb5', 1),
    (v_chord_127_0, 7, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_127, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_127_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_127_1, 0, 79, 7, 'G5', 1),
    (v_chord_127_1, 1, 77, 5, 'F5', 1),
    (v_chord_127_1, 2, 75, 3, 'Eb5', 1),
    (v_chord_127_1, 3, 74, 2, 'D5', 1),
    (v_chord_127_1, 4, 72, 0, 'C5', 1),
    (v_chord_127_1, 5, 70, 10, 'Bb4', 1),
    (v_chord_127_1, 6, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_128 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 128;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_128, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_128_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_128_0, 0, 65, 5, 'F4', 1),
    (v_chord_128_0, 1, 67, 7, 'G4', 1),
    (v_chord_128_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_128_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_128_0, 4, 72, 0, 'C5', 1),
    (v_chord_128_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_128_0, 6, 65, 5, 'F4', 1),
    (v_chord_128_0, 7, 60, 0, 'C4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_128, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_128_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_128_1, 0, 64, 4, 'E4', 1),
    (v_chord_128_1, 1, 63, 3, 'Eb4', 1),
    (v_chord_128_1, 2, 61, 1, 'C#4', 1),
    (v_chord_128_1, 3, 62, 2, 'D4', 1),
    (v_chord_128_1, 4, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_129 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 129;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_129, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_129_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_129_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_129_0, 1, 69, 9, 'Bbb4', 1),
    (v_chord_129_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_129_0, 3, 60, 0, 'C4', 1),
    (v_chord_129_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_129_0, 5, 67, 7, 'G4', 1),
    (v_chord_129_0, 6, 66, 6, 'Gb4', 1),
    (v_chord_129_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_129, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_129_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_129_1, 0, 65, 5, 'F4', 1),
    (v_chord_129_1, 1, 67, 7, 'G4', 1),
    (v_chord_129_1, 2, 68, 8, 'Ab4', 1),
    (v_chord_129_1, 3, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_130 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 130;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_130, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_130_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_130_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_130_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_130_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_130_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_130_0, 4, 67, 7, 'G4', 1),
    (v_chord_130_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_130_0, 6, 72, 0, 'C5', 1),
    (v_chord_130_0, 7, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_130, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_130_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_130_1, 0, 79, 7, 'G5', 1),
    (v_chord_130_1, 1, 82, 10, 'Bb5', 1),
    (v_chord_130_1, 2, 78, 6, 'Gb5', 1),
    (v_chord_130_1, 3, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_131 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 131;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_131, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_131_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_131_0, 0, 67, 7, 'G4', 1),
    (v_chord_131_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_131_0, 2, 72, 0, 'C5', 1),
    (v_chord_131_0, 3, 75, 3, 'Eb5', 1),
    (v_chord_131_0, 4, 79, 7, 'G5', 1),
    (v_chord_131_0, 5, 82, 10, 'Bb5', 1),
    (v_chord_131_0, 6, 80, 8, 'Ab5', 1),
    (v_chord_131_0, 7, 75, 3, 'Eb5', 1),
    (v_chord_131_0, 8, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_131, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_131_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_131_1, 0, 71, 11, 'Cb5', 1),
    (v_chord_131_1, 1, 79, 7, 'G5', 1);
  SELECT id INTO v_phrase_133 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 133;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_133, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_133_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_133_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_133_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_133_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_133_0, 3, 67, 7, 'G4', 1),
    (v_chord_133_0, 4, 66, 6, 'Gb4', 1),
    (v_chord_133_0, 5, 65, 5, 'F4', 1),
    (v_chord_133_0, 6, 64, 4, 'Fb4', 1),
    (v_chord_133_0, 7, 63, 3, 'Eb4', 1),
    (v_chord_133_0, 8, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_133, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_133_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_133_1, 0, 62, 2, 'D4', 1),
    (v_chord_133_1, 1, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_134 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 134;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_134, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_134_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_134_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_134_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_134_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_134_0, 3, 67, 7, 'G4', 1),
    (v_chord_134_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_134_0, 5, 65, 5, 'F4', 1),
    (v_chord_134_0, 6, 67, 7, 'G4', 1),
    (v_chord_134_0, 7, 68, 8, 'Ab4', 1),
    (v_chord_134_0, 8, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_134, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_134_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_134_1, 0, 72, 0, 'C5', 1),
    (v_chord_134_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_134_1, 2, 72, 0, 'C5', 1),
    (v_chord_134_1, 3, 73, 1, 'C#5', 1),
    (v_chord_134_1, 4, 74, 2, 'D5', 1),
    (v_chord_134_1, 5, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_135 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 135;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_135, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_135_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_135_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_135_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_135_0, 2, 64, 4, 'E4', 1),
    (v_chord_135_0, 3, 67, 7, 'G4', 1),
    (v_chord_135_0, 4, 65, 5, 'F4', 1),
    (v_chord_135_0, 5, 60, 0, 'C4', 1),
    (v_chord_135_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_135_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_135, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_135_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_135_1, 0, 62, 2, 'D4', 1),
    (v_chord_135_1, 1, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_136 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 136;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_136, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_136_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_136_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_136_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_136_0, 2, 64, 4, 'E4', 1),
    (v_chord_136_0, 3, 67, 7, 'G4', 1),
    (v_chord_136_0, 4, 66, 6, 'Gb4', 1),
    (v_chord_136_0, 5, 64, 4, 'E4', 1),
    (v_chord_136_0, 6, 65, 5, 'F4', 1),
    (v_chord_136_0, 7, 60, 0, 'C4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_136, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_136_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_136_1, 0, 63, 3, 'Eb4', 1),
    (v_chord_136_1, 1, 61, 1, 'C#4', 1),
    (v_chord_136_1, 2, 62, 2, 'D4', 1),
    (v_chord_136_1, 3, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_137 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 137;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_137, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_137_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_137_0, 0, 60, 0, 'C4', 1),
    (v_chord_137_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_137_0, 2, 67, 7, 'G4', 1),
    (v_chord_137_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_137_0, 4, 67, 7, 'G4', 1),
    (v_chord_137_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_137_0, 6, 72, 0, 'C5', 1),
    (v_chord_137_0, 7, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_137, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_137_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_137_1, 0, 79, 7, 'G5', 1),
    (v_chord_137_1, 1, 77, 5, 'F5', 1),
    (v_chord_137_1, 2, 72, 0, 'C5', 1),
    (v_chord_137_1, 3, 68, 8, 'Ab4', 1),
    (v_chord_137_1, 4, 67, 7, 'G4', 1),
    (v_chord_137_1, 5, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_139 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 139;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_139, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_139_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_139_0, 0, 64, 4, 'E4', 1),
    (v_chord_139_0, 1, 65, 5, 'F4', 1),
    (v_chord_139_0, 2, 67, 7, 'G4', 1),
    (v_chord_139_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_139_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_139_0, 5, 72, 0, 'C5', 1),
    (v_chord_139_0, 6, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_139, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_139_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_139_1, 0, 74, 2, 'D5', 1),
    (v_chord_139_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_139_1, 2, 74, 2, 'D5', 1),
    (v_chord_139_1, 3, 72, 0, 'C5', 1),
    (v_chord_139_1, 4, 71, 11, 'Cb5', 1),
    (v_chord_139_1, 5, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_140 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 140;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_140, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_140_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_140_0, 0, 59, 11, 'B3', 1),
    (v_chord_140_0, 1, 60, 0, 'C4', 1),
    (v_chord_140_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_140_0, 3, 67, 7, 'G4', 1),
    (v_chord_140_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_140_0, 5, 69, 9, 'Bbb4', 1),
    (v_chord_140_0, 6, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_140, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_140_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_140_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_140_1, 1, 60, 0, 'C4', 1),
    (v_chord_140_1, 2, 63, 3, 'Eb4', 1),
    (v_chord_140_1, 3, 67, 7, 'G4', 1),
    (v_chord_140_1, 4, 67, 7, 'G4', 1),
    (v_chord_140_1, 5, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_141 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 141;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_141, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_141_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_141_0, 0, 66, 6, 'F#4', 1),
    (v_chord_141_0, 1, 67, 7, 'G4', 1),
    (v_chord_141_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_141_0, 3, 67, 7, 'G4', 1),
    (v_chord_141_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_141_0, 5, 72, 0, 'C5', 1),
    (v_chord_141_0, 6, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_141, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_141_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_141_1, 0, 79, 7, 'G5', 1),
    (v_chord_141_1, 1, 77, 5, 'F5', 1),
    (v_chord_141_1, 2, 76, 4, 'E5', 1),
    (v_chord_141_1, 3, 74, 2, 'D5', 1),
    (v_chord_141_1, 4, 73, 1, 'Db5', 1),
    (v_chord_141_1, 5, 71, 11, 'Cb5', 1),
    (v_chord_141_1, 6, 70, 10, 'Bb4', 1),
    (v_chord_141_1, 7, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_142 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 142;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_142, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_142_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_142_0, 0, 72, 0, 'C5', 1),
    (v_chord_142_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_142_0, 2, 67, 7, 'G4', 1),
    (v_chord_142_0, 3, 65, 5, 'F4', 1),
    (v_chord_142_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_142_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_142_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_142_0, 7, 60, 0, 'C4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_142, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_142_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_142_1, 0, 64, 4, 'E4', 1),
    (v_chord_142_1, 1, 67, 7, 'G4', 1),
    (v_chord_142_1, 2, 66, 6, 'Gb4', 1),
    (v_chord_142_1, 3, 64, 4, 'E4', 1),
    (v_chord_142_1, 4, 65, 5, 'F4', 1),
    (v_chord_142_1, 5, 67, 7, 'G4', 1),
    (v_chord_142_1, 6, 68, 8, 'Ab4', 1),
    (v_chord_142_1, 7, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_143 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 143;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_143, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_143_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_143_0, 0, 65, 5, 'F4', 1),
    (v_chord_143_0, 1, 64, 4, 'E4', 1),
    (v_chord_143_0, 2, 65, 5, 'F4', 1),
    (v_chord_143_0, 3, 67, 7, 'G4', 1),
    (v_chord_143_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_143_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_143_0, 6, 72, 0, 'C5', 1),
    (v_chord_143_0, 7, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_143, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_143_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_143_1, 0, 74, 2, 'D5', 1),
    (v_chord_143_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_143_1, 2, 74, 2, 'D5', 1),
    (v_chord_143_1, 3, 72, 0, 'C5', 1),
    (v_chord_143_1, 4, 71, 11, 'Cb5', 1),
    (v_chord_143_1, 5, 70, 10, 'Bb4', 1),
    (v_chord_143_1, 6, 69, 9, 'Bbb4', 1),
    (v_chord_143_1, 7, 68, 8, 'Ab4', 1),
    (v_chord_143_1, 8, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_145 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 145;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_145, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_145_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_145_0, 0, 65, 5, 'F4', 1),
    (v_chord_145_0, 1, 64, 4, 'E4', 1),
    (v_chord_145_0, 2, 65, 5, 'F4', 1),
    (v_chord_145_0, 3, 67, 7, 'G4', 1),
    (v_chord_145_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_145_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_145_0, 6, 72, 0, 'C5', 1),
    (v_chord_145_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_145, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_145_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_145_1, 0, 67, 7, 'G4', 1),
    (v_chord_145_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_145_1, 2, 68, 8, 'Ab4', 1),
    (v_chord_145_1, 3, 60, 0, 'C4', 1),
    (v_chord_145_1, 4, 63, 3, 'Eb4', 1),
    (v_chord_145_1, 5, 67, 7, 'G4', 1),
    (v_chord_145_1, 6, 66, 6, 'Gb4', 1),
    (v_chord_145_1, 7, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_146 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 146;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_146, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_146_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_146_0, 0, 82, 10, 'Bb5', 1),
    (v_chord_146_0, 1, 80, 8, 'Ab5', 1),
    (v_chord_146_0, 2, 75, 3, 'Eb5', 1),
    (v_chord_146_0, 3, 72, 0, 'C5', 1),
    (v_chord_146_0, 4, 76, 4, 'E5', 1),
    (v_chord_146_0, 5, 79, 7, 'G5', 1),
    (v_chord_146_0, 6, 78, 6, 'Gb5', 1),
    (v_chord_146_0, 7, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_146, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_146_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_146_1, 0, 77, 5, 'F5', 1),
    (v_chord_146_1, 1, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_147 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 147;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_147, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_147_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_147_0, 0, 74, 2, 'D5', 1),
    (v_chord_147_0, 1, 75, 3, 'Eb5', 1),
    (v_chord_147_0, 2, 72, 0, 'C5', 1),
    (v_chord_147_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_147_0, 4, 67, 7, 'G4', 1),
    (v_chord_147_0, 5, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_147, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_147_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_147_1, 0, 67, 7, 'G4', 1),
    (v_chord_147_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_147_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_147_1, 3, 71, 11, 'B4', 1),
    (v_chord_147_1, 4, 74, 2, 'D5', 1),
    (v_chord_147_1, 5, 79, 7, 'G5', 1);
  SELECT id INTO v_phrase_148 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 148;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_148, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_148_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_148_0, 0, 74, 2, 'D5', 1),
    (v_chord_148_0, 1, 75, 3, 'Eb5', 1),
    (v_chord_148_0, 2, 72, 0, 'C5', 1),
    (v_chord_148_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_148_0, 4, 67, 7, 'G4', 1),
    (v_chord_148_0, 5, 65, 5, 'F4', 1),
    (v_chord_148_0, 6, 64, 4, 'E4', 1),
    (v_chord_148_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_148, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_148_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_148_1, 0, 65, 5, 'F4', 1),
    (v_chord_148_1, 1, 60, 0, 'C4', 1);
  SELECT id INTO v_phrase_149 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 149;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_149, 0, 'Fm7', 1)
  RETURNING id INTO v_chord_149_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_149_0, 0, 64, 4, 'E4', 1),
    (v_chord_149_0, 1, 65, 5, 'F4', 1),
    (v_chord_149_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_149_0, 3, 72, 0, 'C5', 1),
    (v_chord_149_0, 4, 75, 3, 'Eb5', 1),
    (v_chord_149_0, 5, 72, 0, 'C5', 1),
    (v_chord_149_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_149_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_149, 1, 'Bb7', 2)
  RETURNING id INTO v_chord_149_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_149_1, 0, 67, 7, 'G4', 1),
    (v_chord_149_1, 1, 70, 10, 'Bb4', 1);
  SELECT id INTO v_comp_120 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 120;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_120;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_120, 115, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_120, 116, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_120, 117, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_120, 118, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_120, 119, 4);
  SELECT id INTO v_comp_126 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 126;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_126;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_126, 121, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_126, 122, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_126, 123, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_126, 124, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_126, 125, 4);
  SELECT id INTO v_comp_132 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 132;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_132;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_132, 127, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_132, 128, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_132, 129, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_132, 130, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_132, 131, 4);
  SELECT id INTO v_comp_138 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 138;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_138;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_138, 133, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_138, 134, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_138, 135, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_138, 136, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_138, 137, 4);
  SELECT id INTO v_comp_144 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 144;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_144;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_144, 139, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_144, 140, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_144, 141, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_144, 142, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_144, 143, 4);
  SELECT id INTO v_comp_150 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 150;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_150;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_150, 145, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_150, 146, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_150, 147, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_150, 148, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_150, 149, 4);
END $$;

COMMIT;