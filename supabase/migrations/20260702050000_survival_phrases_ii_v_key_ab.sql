BEGIN;

-- Survival Phrases II-V key Ab: stages 151-186
-- MusicXML: 251譜面_-4st_Ab.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 151 AND 186
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 151 AND 186;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 151 AND 186
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 151 AND 186
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 151 AND 186;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 151 AND 186;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_ab_1', 'II-V in Ab 1-5', 'II-V in Ab 1-5', 25)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_ab_2', 'II-V in Ab 6-10', 'II-V in Ab 6-10', 26)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_ab_3', 'II-V in Ab 11-15', 'II-V in Ab 11-15', 27)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_ab_4', 'II-V in Ab 16-20', 'II-V in Ab 16-20', 28)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_ab_5', 'II-V in Ab 21-25', 'II-V in Ab 21-25', 29)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_ab_6', 'II-V in Ab 26-30', 'II-V in Ab 26-30', 30)
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
  151,
  'progression',
  'II-V in Ab · 1',
  'II-V in Ab · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_1',
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
  151,
  'II-V in Ab · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-01.mp3',
  -4
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
  152,
  'progression',
  'II-V in Ab · 2',
  'II-V in Ab · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_1',
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
  152,
  'II-V in Ab · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-02.mp3',
  -4
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
  153,
  'progression',
  'II-V in Ab · 3',
  'II-V in Ab · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_1',
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
  153,
  'II-V in Ab · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-03.mp3',
  -4
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
  154,
  'progression',
  'II-V in Ab · 4',
  'II-V in Ab · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_1',
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
  154,
  'II-V in Ab · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-04.mp3',
  -4
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
  155,
  'progression',
  'II-V in Ab · 5',
  'II-V in Ab · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_1',
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
  155,
  'II-V in Ab · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-05.mp3',
  -4
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
  156,
  'progression',
  '複合フレーズ · II-V in Ab 1-5',
  'Composite · II-V in Ab 1-5',
  'easy',
  '',
  'II-V in Ab 1-5',
  'II-V in Ab 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_1',
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
VALUES ('phrases', 156, 'B', -4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  157,
  'progression',
  'II-V in Ab · 6',
  'II-V in Ab · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_2',
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
  157,
  'II-V in Ab · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-06.mp3',
  -4
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
  158,
  'progression',
  'II-V in Ab · 7',
  'II-V in Ab · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_2',
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
  158,
  'II-V in Ab · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-07.mp3',
  -4
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
  159,
  'progression',
  'II-V in Ab · 8',
  'II-V in Ab · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_2',
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
  159,
  'II-V in Ab · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-08.mp3',
  -4
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
  160,
  'progression',
  'II-V in Ab · 9',
  'II-V in Ab · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_2',
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
  160,
  'II-V in Ab · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-09.mp3',
  -4
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
  161,
  'progression',
  'II-V in Ab · 10',
  'II-V in Ab · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_2',
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
  161,
  'II-V in Ab · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-10.mp3',
  -4
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
  162,
  'progression',
  '複合フレーズ · II-V in Ab 6-10',
  'Composite · II-V in Ab 6-10',
  'easy',
  '',
  'II-V in Ab 6-10',
  'II-V in Ab 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_2',
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
VALUES ('phrases', 162, 'C', -4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  163,
  'progression',
  'II-V in Ab · 11',
  'II-V in Ab · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_3',
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
  163,
  'II-V in Ab · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-11.mp3',
  -4
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
  164,
  'progression',
  'II-V in Ab · 12',
  'II-V in Ab · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_3',
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
  164,
  'II-V in Ab · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-12.mp3',
  -4
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
  165,
  'progression',
  'II-V in Ab · 13',
  'II-V in Ab · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_3',
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
  165,
  'II-V in Ab · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-13.mp3',
  -4
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
  166,
  'progression',
  'II-V in Ab · 14',
  'II-V in Ab · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_3',
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
  166,
  'II-V in Ab · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-14.mp3',
  -4
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
  167,
  'progression',
  'II-V in Ab · 15',
  'II-V in Ab · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_3',
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
  167,
  'II-V in Ab · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-15.mp3',
  -4
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
  168,
  'progression',
  '複合フレーズ · II-V in Ab 11-15',
  'Composite · II-V in Ab 11-15',
  'easy',
  '',
  'II-V in Ab 11-15',
  'II-V in Ab 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_3',
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
VALUES ('phrases', 168, 'A', -4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  169,
  'progression',
  'II-V in Ab · 16',
  'II-V in Ab · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_4',
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
  169,
  'II-V in Ab · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-16.mp3',
  -4
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
  170,
  'progression',
  'II-V in Ab · 17',
  'II-V in Ab · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_4',
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
  170,
  'II-V in Ab · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-17.mp3',
  -4
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
  171,
  'progression',
  'II-V in Ab · 18',
  'II-V in Ab · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_4',
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
  171,
  'II-V in Ab · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-18.mp3',
  -4
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
  172,
  'progression',
  'II-V in Ab · 19',
  'II-V in Ab · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_4',
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
  172,
  'II-V in Ab · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-19.mp3',
  -4
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
  173,
  'progression',
  'II-V in Ab · 20',
  'II-V in Ab · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_4',
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
  173,
  'II-V in Ab · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-20.mp3',
  -4
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
  174,
  'progression',
  '複合フレーズ · II-V in Ab 16-20',
  'Composite · II-V in Ab 16-20',
  'easy',
  '',
  'II-V in Ab 16-20',
  'II-V in Ab 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_4',
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
VALUES ('phrases', 174, 'B', -4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  175,
  'progression',
  'II-V in Ab · 21',
  'II-V in Ab · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_5',
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
  175,
  'II-V in Ab · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-21.mp3',
  -4
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
  176,
  'progression',
  'II-V in Ab · 22',
  'II-V in Ab · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_5',
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
  176,
  'II-V in Ab · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-22.mp3',
  -4
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
  177,
  'progression',
  'II-V in Ab · 23',
  'II-V in Ab · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_5',
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
  177,
  'II-V in Ab · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-23.mp3',
  -4
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
  178,
  'progression',
  'II-V in Ab · 24',
  'II-V in Ab · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_5',
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
  178,
  'II-V in Ab · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-24.mp3',
  -4
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
  179,
  'progression',
  'II-V in Ab · 25',
  'II-V in Ab · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_5',
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
  179,
  'II-V in Ab · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-25.mp3',
  -4
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
  180,
  'progression',
  '複合フレーズ · II-V in Ab 21-25',
  'Composite · II-V in Ab 21-25',
  'easy',
  '',
  'II-V in Ab 21-25',
  'II-V in Ab 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_5',
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
VALUES ('phrases', 180, 'C', -4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  181,
  'progression',
  'II-V in Ab · 26',
  'II-V in Ab · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_6',
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
  181,
  'II-V in Ab · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-26.mp3',
  -4
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
  182,
  'progression',
  'II-V in Ab · 27',
  'II-V in Ab · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_6',
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
  182,
  'II-V in Ab · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-27.mp3',
  -4
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
  183,
  'progression',
  'II-V in Ab · 28',
  'II-V in Ab · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_6',
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
  183,
  'II-V in Ab · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-28.mp3',
  -4
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
  184,
  'progression',
  'II-V in Ab · 29',
  'II-V in Ab · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_6',
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
  184,
  'II-V in Ab · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-29.mp3',
  -4
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
  185,
  'progression',
  'II-V in Ab · 30',
  'II-V in Ab · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_6',
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
  185,
  'II-V in Ab · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-ab-30.mp3',
  -4
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
  186,
  'progression',
  '複合フレーズ · II-V in Ab 26-30',
  'Composite · II-V in Ab 26-30',
  'easy',
  '',
  'II-V in Ab 26-30',
  'II-V in Ab 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_ab_6',
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
VALUES ('phrases', 186, 'A', -4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_151 uuid;
  v_chord_151_0 uuid;
  v_chord_151_1 uuid;
  v_phrase_152 uuid;
  v_chord_152_0 uuid;
  v_chord_152_1 uuid;
  v_phrase_153 uuid;
  v_chord_153_0 uuid;
  v_chord_153_1 uuid;
  v_phrase_154 uuid;
  v_chord_154_0 uuid;
  v_chord_154_1 uuid;
  v_phrase_155 uuid;
  v_chord_155_0 uuid;
  v_chord_155_1 uuid;
  v_phrase_157 uuid;
  v_chord_157_0 uuid;
  v_chord_157_1 uuid;
  v_phrase_158 uuid;
  v_chord_158_0 uuid;
  v_chord_158_1 uuid;
  v_phrase_159 uuid;
  v_chord_159_0 uuid;
  v_chord_159_1 uuid;
  v_phrase_160 uuid;
  v_chord_160_0 uuid;
  v_chord_160_1 uuid;
  v_phrase_161 uuid;
  v_chord_161_0 uuid;
  v_chord_161_1 uuid;
  v_phrase_163 uuid;
  v_chord_163_0 uuid;
  v_chord_163_1 uuid;
  v_phrase_164 uuid;
  v_chord_164_0 uuid;
  v_chord_164_1 uuid;
  v_phrase_165 uuid;
  v_chord_165_0 uuid;
  v_chord_165_1 uuid;
  v_phrase_166 uuid;
  v_chord_166_0 uuid;
  v_chord_166_1 uuid;
  v_phrase_167 uuid;
  v_chord_167_0 uuid;
  v_chord_167_1 uuid;
  v_phrase_169 uuid;
  v_chord_169_0 uuid;
  v_chord_169_1 uuid;
  v_phrase_170 uuid;
  v_chord_170_0 uuid;
  v_chord_170_1 uuid;
  v_phrase_171 uuid;
  v_chord_171_0 uuid;
  v_chord_171_1 uuid;
  v_phrase_172 uuid;
  v_chord_172_0 uuid;
  v_chord_172_1 uuid;
  v_phrase_173 uuid;
  v_chord_173_0 uuid;
  v_chord_173_1 uuid;
  v_phrase_175 uuid;
  v_chord_175_0 uuid;
  v_chord_175_1 uuid;
  v_phrase_176 uuid;
  v_chord_176_0 uuid;
  v_chord_176_1 uuid;
  v_phrase_177 uuid;
  v_chord_177_0 uuid;
  v_chord_177_1 uuid;
  v_phrase_178 uuid;
  v_chord_178_0 uuid;
  v_chord_178_1 uuid;
  v_phrase_179 uuid;
  v_chord_179_0 uuid;
  v_chord_179_1 uuid;
  v_phrase_181 uuid;
  v_chord_181_0 uuid;
  v_chord_181_1 uuid;
  v_phrase_182 uuid;
  v_chord_182_0 uuid;
  v_chord_182_1 uuid;
  v_phrase_183 uuid;
  v_chord_183_0 uuid;
  v_chord_183_1 uuid;
  v_phrase_184 uuid;
  v_chord_184_0 uuid;
  v_chord_184_1 uuid;
  v_phrase_185 uuid;
  v_chord_185_0 uuid;
  v_chord_185_1 uuid;
  v_comp_156 uuid;
  v_comp_162 uuid;
  v_comp_168 uuid;
  v_comp_174 uuid;
  v_comp_180 uuid;
  v_comp_186 uuid;
BEGIN
  SELECT id INTO v_phrase_151 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 151;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_151, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_151_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_151_0, 0, 72, 0, 'C5', 1),
    (v_chord_151_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_151_0, 2, 65, 5, 'F4', 1),
    (v_chord_151_0, 3, 61, 1, 'Db4', 1),
    (v_chord_151_0, 4, 65, 5, 'F4', 1),
    (v_chord_151_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_151_0, 6, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_151, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_151_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_151_1, 0, 75, 3, 'Eb5', 1),
    (v_chord_151_1, 1, 73, 1, 'Db5', 1),
    (v_chord_151_1, 2, 68, 8, 'Ab4', 1),
    (v_chord_151_1, 3, 65, 5, 'F4', 1),
    (v_chord_151_1, 4, 72, 0, 'C5', 1),
    (v_chord_151_1, 5, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_152 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 152;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_152, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_152_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_152_0, 0, 59, 11, 'B3', 1),
    (v_chord_152_0, 1, 60, 0, 'C4', 1),
    (v_chord_152_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_152_0, 3, 60, 0, 'C4', 1),
    (v_chord_152_0, 4, 61, 1, 'Db4', 1),
    (v_chord_152_0, 5, 65, 5, 'F4', 1),
    (v_chord_152_0, 6, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_152, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_152_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_152_1, 0, 72, 0, 'C5', 1),
    (v_chord_152_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_152_1, 2, 65, 5, 'F4', 1),
    (v_chord_152_1, 3, 61, 1, 'Db4', 1),
    (v_chord_152_1, 4, 60, 0, 'C4', 1),
    (v_chord_152_1, 5, 58, 10, 'Bb3', 1);
  SELECT id INTO v_phrase_153 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 153;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_153, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_153_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_153_0, 0, 58, 10, 'Bb3', 1),
    (v_chord_153_0, 1, 60, 0, 'C4', 1),
    (v_chord_153_0, 2, 61, 1, 'Db4', 1),
    (v_chord_153_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_153_0, 4, 65, 5, 'F4', 1),
    (v_chord_153_0, 5, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_153, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_153_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_153_1, 0, 67, 7, 'G4', 1),
    (v_chord_153_1, 1, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_154 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 154;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_154, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_154_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_154_0, 0, 75, 3, 'Eb5', 1),
    (v_chord_154_0, 1, 73, 1, 'Db5', 1),
    (v_chord_154_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_154_0, 3, 65, 5, 'F4', 1),
    (v_chord_154_0, 4, 72, 0, 'C5', 1),
    (v_chord_154_0, 5, 69, 9, 'A4', 1),
    (v_chord_154_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_154_0, 7, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_154, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_154_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_154_1, 0, 73, 1, 'Db5', 1),
    (v_chord_154_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_154_1, 2, 77, 5, 'F5', 1),
    (v_chord_154_1, 3, 73, 1, 'Db5', 1),
    (v_chord_154_1, 4, 72, 0, 'C5', 1),
    (v_chord_154_1, 5, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_155 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 155;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_155, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_155_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_155_0, 0, 61, 1, 'Db4', 1),
    (v_chord_155_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_155_0, 2, 65, 5, 'F4', 1),
    (v_chord_155_0, 3, 61, 1, 'Db4', 1),
    (v_chord_155_0, 4, 60, 0, 'C4', 1),
    (v_chord_155_0, 5, 58, 10, 'Bb3', 1),
    (v_chord_155_0, 6, 57, 9, 'A3', 1),
    (v_chord_155_0, 7, 60, 0, 'C4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_155, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_155_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_155_1, 0, 58, 10, 'Bb3', 1),
    (v_chord_155_1, 1, 56, 8, 'Ab3', 1),
    (v_chord_155_1, 2, 54, 6, 'F#3', 1),
    (v_chord_155_1, 3, 55, 7, 'G3', 1),
    (v_chord_155_1, 4, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_157 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 157;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_157, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_157_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_157_0, 0, 58, 10, 'Bb3', 1),
    (v_chord_157_0, 1, 61, 1, 'Db4', 1),
    (v_chord_157_0, 2, 65, 5, 'F4', 1),
    (v_chord_157_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_157_0, 4, 65, 5, 'F4', 1),
    (v_chord_157_0, 5, 66, 6, 'F#4', 1),
    (v_chord_157_0, 6, 67, 7, 'G4', 1),
    (v_chord_157_0, 7, 58, 10, 'Bb3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_157, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_157_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_157_1, 0, 61, 1, 'Db4', 1),
    (v_chord_157_1, 1, 65, 5, 'F4', 1),
    (v_chord_157_1, 2, 64, 4, 'Fb4', 1),
    (v_chord_157_1, 3, 62, 2, 'D4', 1),
    (v_chord_157_1, 4, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_158 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 158;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_158, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_158_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_158_0, 0, 58, 10, 'Bb3', 1),
    (v_chord_158_0, 1, 60, 0, 'C4', 1),
    (v_chord_158_0, 2, 61, 1, 'Db4', 1),
    (v_chord_158_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_158_0, 4, 65, 5, 'F4', 1),
    (v_chord_158_0, 5, 67, 7, 'G4', 1),
    (v_chord_158_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_158_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_158, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_158_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_158_1, 0, 72, 0, 'C5', 1),
    (v_chord_158_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_158_1, 2, 73, 1, 'Db5', 1),
    (v_chord_158_1, 3, 65, 5, 'F4', 1),
    (v_chord_158_1, 4, 68, 8, 'Ab4', 1),
    (v_chord_158_1, 5, 72, 0, 'C5', 1),
    (v_chord_158_1, 6, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_159 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 159;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_159, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_159_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_159_0, 0, 72, 0, 'C5', 1),
    (v_chord_159_0, 1, 69, 9, 'A4', 1),
    (v_chord_159_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_159_0, 3, 72, 0, 'C5', 1),
    (v_chord_159_0, 4, 73, 1, 'Db5', 1),
    (v_chord_159_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_159_0, 6, 77, 5, 'F5', 1),
    (v_chord_159_0, 7, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_159, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_159_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_159_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_159_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_159_1, 2, 66, 6, 'F#4', 1),
    (v_chord_159_1, 3, 67, 7, 'G4', 1),
    (v_chord_159_1, 4, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_160 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 160;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_160, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_160_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_160_0, 0, 61, 1, 'Db4', 1),
    (v_chord_160_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_160_0, 2, 65, 5, 'F4', 1),
    (v_chord_160_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_160_0, 4, 72, 0, 'C5', 1),
    (v_chord_160_0, 5, 73, 1, 'Db5', 1),
    (v_chord_160_0, 6, 69, 9, 'A4', 1),
    (v_chord_160_0, 7, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_160, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_160_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_160_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_160_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_160_1, 2, 65, 5, 'F4', 1),
    (v_chord_160_1, 3, 66, 6, 'F#4', 1),
    (v_chord_160_1, 4, 67, 7, 'G4', 1),
    (v_chord_160_1, 5, 65, 5, 'F4', 1),
    (v_chord_160_1, 6, 63, 3, 'Eb4', 1),
    (v_chord_160_1, 7, 62, 2, 'Ebb4', 1);
  SELECT id INTO v_phrase_161 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 161;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_161, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_161_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_161_0, 0, 67, 7, 'G4', 1),
    (v_chord_161_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_161_0, 2, 65, 5, 'F4', 1),
    (v_chord_161_0, 3, 61, 1, 'Db4', 1),
    (v_chord_161_0, 4, 60, 0, 'C4', 1),
    (v_chord_161_0, 5, 61, 1, 'Db4', 1),
    (v_chord_161_0, 6, 65, 5, 'F4', 1),
    (v_chord_161_0, 7, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_161, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_161_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_161_1, 0, 72, 0, 'C5', 1),
    (v_chord_161_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_161_1, 2, 65, 5, 'F4', 1),
    (v_chord_161_1, 3, 61, 1, 'Db4', 1),
    (v_chord_161_1, 4, 60, 0, 'C4', 1),
    (v_chord_161_1, 5, 58, 10, 'Bb3', 1);
  SELECT id INTO v_phrase_163 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 163;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_163, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_163_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_163_0, 0, 61, 1, 'Db4', 1),
    (v_chord_163_0, 1, 65, 5, 'F4', 1),
    (v_chord_163_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_163_0, 3, 72, 0, 'C5', 1),
    (v_chord_163_0, 4, 75, 3, 'Eb5', 1),
    (v_chord_163_0, 5, 73, 1, 'Db5', 1),
    (v_chord_163_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_163_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_163, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_163_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_163_1, 0, 72, 0, 'C5', 1),
    (v_chord_163_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_163_1, 2, 68, 8, 'Ab4', 1),
    (v_chord_163_1, 3, 67, 7, 'G4', 1),
    (v_chord_163_1, 4, 65, 5, 'F4', 1),
    (v_chord_163_1, 5, 63, 3, 'Eb4', 1),
    (v_chord_163_1, 6, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_164 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 164;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_164, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_164_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_164_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_164_0, 1, 72, 0, 'C5', 1),
    (v_chord_164_0, 2, 73, 1, 'Db5', 1),
    (v_chord_164_0, 3, 75, 3, 'Eb5', 1),
    (v_chord_164_0, 4, 77, 5, 'F5', 1),
    (v_chord_164_0, 5, 73, 1, 'Db5', 1),
    (v_chord_164_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_164_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_164, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_164_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_164_1, 0, 69, 9, 'A4', 1),
    (v_chord_164_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_164_1, 2, 66, 6, 'F#4', 1),
    (v_chord_164_1, 3, 67, 7, 'G4', 1),
    (v_chord_164_1, 4, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_165 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 165;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_165, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_165_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_165_0, 0, 75, 3, 'Eb5', 1),
    (v_chord_165_0, 1, 74, 2, 'Ebb5', 1),
    (v_chord_165_0, 2, 73, 1, 'Db5', 1),
    (v_chord_165_0, 3, 65, 5, 'F4', 1),
    (v_chord_165_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_165_0, 5, 72, 0, 'C5', 1),
    (v_chord_165_0, 6, 71, 11, 'Cb5', 1),
    (v_chord_165_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_165, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_165_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_165_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_165_1, 1, 72, 0, 'C5', 1),
    (v_chord_165_1, 2, 73, 1, 'Db5', 1),
    (v_chord_165_1, 3, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_166 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 166;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_166, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_166_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_166_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_166_0, 1, 61, 1, 'Db4', 1),
    (v_chord_166_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_166_0, 3, 61, 1, 'Db4', 1),
    (v_chord_166_0, 4, 60, 0, 'C4', 1),
    (v_chord_166_0, 5, 61, 1, 'Db4', 1),
    (v_chord_166_0, 6, 65, 5, 'F4', 1),
    (v_chord_166_0, 7, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_166, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_166_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_166_1, 0, 72, 0, 'C5', 1),
    (v_chord_166_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_166_1, 2, 71, 11, 'Cb5', 1),
    (v_chord_166_1, 3, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_167 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 167;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_167, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_167_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_167_0, 0, 60, 0, 'C4', 1),
    (v_chord_167_0, 1, 61, 1, 'Db4', 1),
    (v_chord_167_0, 2, 65, 5, 'F4', 1),
    (v_chord_167_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_167_0, 4, 72, 0, 'C5', 1),
    (v_chord_167_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_167_0, 6, 73, 1, 'Db5', 1),
    (v_chord_167_0, 7, 68, 8, 'Ab4', 1),
    (v_chord_167_0, 8, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_167, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_167_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_167_1, 0, 64, 4, 'Fb4', 1),
    (v_chord_167_1, 1, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_169 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 169;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_169, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_169_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_169_0, 0, 73, 1, 'Db5', 1),
    (v_chord_169_0, 1, 75, 3, 'Eb5', 1),
    (v_chord_169_0, 2, 73, 1, 'Db5', 1),
    (v_chord_169_0, 3, 72, 0, 'C5', 1),
    (v_chord_169_0, 4, 71, 11, 'Cb5', 1),
    (v_chord_169_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_169_0, 6, 69, 9, 'Bbb4', 1),
    (v_chord_169_0, 7, 68, 8, 'Ab4', 1),
    (v_chord_169_0, 8, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_169, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_169_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_169_1, 0, 67, 7, 'G4', 1),
    (v_chord_169_1, 1, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_170 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 170;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_170, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_170_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_170_0, 0, 61, 1, 'Db4', 1),
    (v_chord_170_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_170_0, 2, 61, 1, 'Db4', 1),
    (v_chord_170_0, 3, 60, 0, 'C4', 1),
    (v_chord_170_0, 4, 61, 1, 'Db4', 1),
    (v_chord_170_0, 5, 58, 10, 'Bb3', 1),
    (v_chord_170_0, 6, 60, 0, 'C4', 1),
    (v_chord_170_0, 7, 61, 1, 'Db4', 1),
    (v_chord_170_0, 8, 63, 3, 'Eb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_170, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_170_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_170_1, 0, 65, 5, 'F4', 1),
    (v_chord_170_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_170_1, 2, 65, 5, 'F4', 1),
    (v_chord_170_1, 3, 66, 6, 'F#4', 1),
    (v_chord_170_1, 4, 67, 7, 'G4', 1),
    (v_chord_170_1, 5, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_171 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 171;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_171, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_171_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_171_0, 0, 73, 1, 'Db5', 1),
    (v_chord_171_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_171_0, 2, 69, 9, 'A4', 1),
    (v_chord_171_0, 3, 72, 0, 'C5', 1),
    (v_chord_171_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_171_0, 5, 65, 5, 'F4', 1),
    (v_chord_171_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_171_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_171, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_171_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_171_1, 0, 67, 7, 'G4', 1),
    (v_chord_171_1, 1, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_172 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 172;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_172, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_172_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_172_0, 0, 73, 1, 'Db5', 1),
    (v_chord_172_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_172_0, 2, 69, 9, 'A4', 1),
    (v_chord_172_0, 3, 72, 0, 'C5', 1),
    (v_chord_172_0, 4, 71, 11, 'Cb5', 1),
    (v_chord_172_0, 5, 69, 9, 'A4', 1),
    (v_chord_172_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_172_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_172, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_172_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_172_1, 0, 68, 8, 'Ab4', 1),
    (v_chord_172_1, 1, 66, 6, 'F#4', 1),
    (v_chord_172_1, 2, 67, 7, 'G4', 1),
    (v_chord_172_1, 3, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_173 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 173;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_173, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_173_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_173_0, 0, 65, 5, 'F4', 1),
    (v_chord_173_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_173_0, 2, 72, 0, 'C5', 1),
    (v_chord_173_0, 3, 75, 3, 'Eb5', 1),
    (v_chord_173_0, 4, 72, 0, 'C5', 1),
    (v_chord_173_0, 5, 73, 1, 'Db5', 1),
    (v_chord_173_0, 6, 77, 5, 'F5', 1),
    (v_chord_173_0, 7, 80, 8, 'Ab5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_173, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_173_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_173_1, 0, 84, 0, 'C6', 1),
    (v_chord_173_1, 1, 82, 10, 'Bb5', 1),
    (v_chord_173_1, 2, 77, 5, 'F5', 1),
    (v_chord_173_1, 3, 73, 1, 'Db5', 1),
    (v_chord_173_1, 4, 72, 0, 'C5', 1),
    (v_chord_173_1, 5, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_175 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 175;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_175, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_175_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_175_0, 0, 57, 9, 'A3', 1),
    (v_chord_175_0, 1, 58, 10, 'Bb3', 1),
    (v_chord_175_0, 2, 60, 0, 'C4', 1),
    (v_chord_175_0, 3, 61, 1, 'Db4', 1),
    (v_chord_175_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_175_0, 5, 65, 5, 'F4', 1),
    (v_chord_175_0, 6, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_175, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_175_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_175_1, 0, 67, 7, 'G4', 1),
    (v_chord_175_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_175_1, 2, 67, 7, 'G4', 1),
    (v_chord_175_1, 3, 65, 5, 'F4', 1),
    (v_chord_175_1, 4, 64, 4, 'Fb4', 1),
    (v_chord_175_1, 5, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_176 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 176;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_176, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_176_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_176_0, 0, 64, 4, 'E4', 1),
    (v_chord_176_0, 1, 65, 5, 'F4', 1),
    (v_chord_176_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_176_0, 3, 72, 0, 'C5', 1),
    (v_chord_176_0, 4, 75, 3, 'Eb5', 1),
    (v_chord_176_0, 5, 74, 2, 'Ebb5', 1),
    (v_chord_176_0, 6, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_176, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_176_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_176_1, 0, 73, 1, 'Db5', 1),
    (v_chord_176_1, 1, 65, 5, 'F4', 1),
    (v_chord_176_1, 2, 68, 8, 'Ab4', 1),
    (v_chord_176_1, 3, 72, 0, 'C5', 1),
    (v_chord_176_1, 4, 72, 0, 'C5', 1),
    (v_chord_176_1, 5, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_177 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 177;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_177, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_177_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_177_0, 0, 59, 11, 'B3', 1),
    (v_chord_177_0, 1, 60, 0, 'C4', 1),
    (v_chord_177_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_177_0, 3, 60, 0, 'C4', 1),
    (v_chord_177_0, 4, 61, 1, 'Db4', 1),
    (v_chord_177_0, 5, 65, 5, 'F4', 1),
    (v_chord_177_0, 6, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_177, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_177_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_177_1, 0, 72, 0, 'C5', 1),
    (v_chord_177_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_177_1, 2, 69, 9, 'A4', 1),
    (v_chord_177_1, 3, 67, 7, 'G4', 1),
    (v_chord_177_1, 4, 66, 6, 'Gb4', 1),
    (v_chord_177_1, 5, 64, 4, 'Fb4', 1),
    (v_chord_177_1, 6, 63, 3, 'Eb4', 1),
    (v_chord_177_1, 7, 61, 1, 'Db4', 1);
  SELECT id INTO v_phrase_178 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 178;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_178, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_178_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_178_0, 0, 77, 5, 'F5', 1),
    (v_chord_178_0, 1, 73, 1, 'Db5', 1),
    (v_chord_178_0, 2, 72, 0, 'C5', 1),
    (v_chord_178_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_178_0, 4, 75, 3, 'Eb5', 1),
    (v_chord_178_0, 5, 73, 1, 'Db5', 1),
    (v_chord_178_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_178_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_178, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_178_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_178_1, 0, 69, 9, 'A4', 1),
    (v_chord_178_1, 1, 72, 0, 'C5', 1),
    (v_chord_178_1, 2, 71, 11, 'Cb5', 1),
    (v_chord_178_1, 3, 69, 9, 'A4', 1),
    (v_chord_178_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_178_1, 5, 72, 0, 'C5', 1),
    (v_chord_178_1, 6, 73, 1, 'Db5', 1),
    (v_chord_178_1, 7, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_179 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 179;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_179, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_179_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_179_0, 0, 58, 10, 'Bb3', 1),
    (v_chord_179_0, 1, 57, 9, 'A3', 1),
    (v_chord_179_0, 2, 58, 10, 'Bb3', 1),
    (v_chord_179_0, 3, 60, 0, 'C4', 1),
    (v_chord_179_0, 4, 61, 1, 'Db4', 1),
    (v_chord_179_0, 5, 63, 3, 'Eb4', 1),
    (v_chord_179_0, 6, 65, 5, 'F4', 1),
    (v_chord_179_0, 7, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_179, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_179_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_179_1, 0, 67, 7, 'G4', 1),
    (v_chord_179_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_179_1, 2, 67, 7, 'G4', 1),
    (v_chord_179_1, 3, 65, 5, 'F4', 1),
    (v_chord_179_1, 4, 64, 4, 'Fb4', 1),
    (v_chord_179_1, 5, 63, 3, 'Eb4', 1),
    (v_chord_179_1, 6, 62, 2, 'Ebb4', 1),
    (v_chord_179_1, 7, 61, 1, 'Db4', 1),
    (v_chord_179_1, 8, 60, 0, 'C4', 1);
  SELECT id INTO v_phrase_181 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 181;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_181, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_181_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_181_0, 0, 58, 10, 'Bb3', 1),
    (v_chord_181_0, 1, 57, 9, 'A3', 1),
    (v_chord_181_0, 2, 58, 10, 'Bb3', 1),
    (v_chord_181_0, 3, 60, 0, 'C4', 1),
    (v_chord_181_0, 4, 61, 1, 'Db4', 1),
    (v_chord_181_0, 5, 63, 3, 'Eb4', 1),
    (v_chord_181_0, 6, 65, 5, 'F4', 1),
    (v_chord_181_0, 7, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_181, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_181_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_181_1, 0, 60, 0, 'C4', 1),
    (v_chord_181_1, 1, 63, 3, 'Eb4', 1),
    (v_chord_181_1, 2, 61, 1, 'Db4', 1),
    (v_chord_181_1, 3, 53, 5, 'F3', 1),
    (v_chord_181_1, 4, 56, 8, 'Ab3', 1),
    (v_chord_181_1, 5, 60, 0, 'C4', 1),
    (v_chord_181_1, 6, 59, 11, 'Cb4', 1),
    (v_chord_181_1, 7, 57, 9, 'A3', 1);
  SELECT id INTO v_phrase_182 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 182;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_182, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_182_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_182_0, 0, 75, 3, 'Eb5', 1),
    (v_chord_182_0, 1, 73, 1, 'Db5', 1),
    (v_chord_182_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_182_0, 3, 65, 5, 'F4', 1),
    (v_chord_182_0, 4, 69, 9, 'A4', 1),
    (v_chord_182_0, 5, 72, 0, 'C5', 1),
    (v_chord_182_0, 6, 71, 11, 'Cb5', 1),
    (v_chord_182_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_182, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_182_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_182_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_182_1, 1, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_183 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 183;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_183, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_183_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_183_0, 0, 67, 7, 'G4', 1),
    (v_chord_183_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_183_0, 2, 65, 5, 'F4', 1),
    (v_chord_183_0, 3, 61, 1, 'Db4', 1),
    (v_chord_183_0, 4, 60, 0, 'C4', 1),
    (v_chord_183_0, 5, 58, 10, 'Bb3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_183, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_183_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_183_1, 0, 60, 0, 'C4', 1),
    (v_chord_183_1, 1, 61, 1, 'Db4', 1),
    (v_chord_183_1, 2, 63, 3, 'Eb4', 1),
    (v_chord_183_1, 3, 64, 4, 'E4', 1),
    (v_chord_183_1, 4, 67, 7, 'G4', 1),
    (v_chord_183_1, 5, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_184 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 184;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_184, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_184_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_184_0, 0, 67, 7, 'G4', 1),
    (v_chord_184_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_184_0, 2, 65, 5, 'F4', 1),
    (v_chord_184_0, 3, 61, 1, 'Db4', 1),
    (v_chord_184_0, 4, 60, 0, 'C4', 1),
    (v_chord_184_0, 5, 58, 10, 'Bb3', 1),
    (v_chord_184_0, 6, 57, 9, 'A3', 1),
    (v_chord_184_0, 7, 60, 0, 'C4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_184, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_184_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_184_1, 0, 58, 10, 'Bb3', 1),
    (v_chord_184_1, 1, 53, 5, 'F3', 1);
  SELECT id INTO v_phrase_185 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 185;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_185, 0, 'Bbm7', 1)
  RETURNING id INTO v_chord_185_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_185_0, 0, 57, 9, 'A3', 1),
    (v_chord_185_0, 1, 58, 10, 'Bb3', 1),
    (v_chord_185_0, 2, 61, 1, 'Db4', 1),
    (v_chord_185_0, 3, 65, 5, 'F4', 1),
    (v_chord_185_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_185_0, 5, 65, 5, 'F4', 1),
    (v_chord_185_0, 6, 61, 1, 'Db4', 1),
    (v_chord_185_0, 7, 58, 10, 'Bb3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_185, 1, 'Eb7', 2)
  RETURNING id INTO v_chord_185_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_185_1, 0, 60, 0, 'C4', 1),
    (v_chord_185_1, 1, 63, 3, 'Eb4', 1);
  SELECT id INTO v_comp_156 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 156;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_156;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_156, 151, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_156, 152, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_156, 153, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_156, 154, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_156, 155, 4);
  SELECT id INTO v_comp_162 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 162;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_162;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_162, 157, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_162, 158, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_162, 159, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_162, 160, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_162, 161, 4);
  SELECT id INTO v_comp_168 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 168;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_168;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_168, 163, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_168, 164, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_168, 165, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_168, 166, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_168, 167, 4);
  SELECT id INTO v_comp_174 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 174;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_174;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_174, 169, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_174, 170, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_174, 171, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_174, 172, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_174, 173, 4);
  SELECT id INTO v_comp_180 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 180;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_180;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_180, 175, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_180, 176, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_180, 177, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_180, 178, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_180, 179, 4);
  SELECT id INTO v_comp_186 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 186;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_186;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_186, 181, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_186, 182, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_186, 183, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_186, 184, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_186, 185, 4);
END $$;

COMMIT;