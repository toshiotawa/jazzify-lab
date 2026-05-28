BEGIN;

-- Survival Phrases II-V key E: stages 295-330
-- MusicXML: 251譜面_+4st_E.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 295 AND 330
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 295 AND 330;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 295 AND 330
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 295 AND 330
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 295 AND 330;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 295 AND 330;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_e_1', 'II-V in E 1-5', 'II-V in E 1-5', 49)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_e_2', 'II-V in E 6-10', 'II-V in E 6-10', 50)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_e_3', 'II-V in E 11-15', 'II-V in E 11-15', 51)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_e_4', 'II-V in E 16-20', 'II-V in E 16-20', 52)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_e_5', 'II-V in E 21-25', 'II-V in E 21-25', 53)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_e_6', 'II-V in E 26-30', 'II-V in E 26-30', 54)
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
  295,
  'progression',
  'II-V in E · 1',
  'II-V in E · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_1',
  false,
  NULL,
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
  295,
  'II-V in E · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-01.mp3',
  4
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
  296,
  'progression',
  'II-V in E · 2',
  'II-V in E · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_1',
  false,
  NULL,
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
  296,
  'II-V in E · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-02.mp3',
  4
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
  297,
  'progression',
  'II-V in E · 3',
  'II-V in E · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_1',
  false,
  NULL,
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
  297,
  'II-V in E · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-03.mp3',
  4
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
  298,
  'progression',
  'II-V in E · 4',
  'II-V in E · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_1',
  false,
  NULL,
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
  298,
  'II-V in E · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-04.mp3',
  4
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
  299,
  'progression',
  'II-V in E · 5',
  'II-V in E · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_1',
  false,
  NULL,
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
  299,
  'II-V in E · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-05.mp3',
  4
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
  300,
  'progression',
  '複合フレーズ · II-V in E 1-5',
  'Composite · II-V in E 1-5',
  'easy',
  '',
  'II-V in E 1-5',
  'II-V in E 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_1',
  false,
  NULL,
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
VALUES ('phrases', 300, 'B', 4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  301,
  'progression',
  'II-V in E · 6',
  'II-V in E · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_2',
  false,
  NULL,
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
  301,
  'II-V in E · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-06.mp3',
  4
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
  302,
  'progression',
  'II-V in E · 7',
  'II-V in E · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_2',
  false,
  NULL,
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
  302,
  'II-V in E · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-07.mp3',
  4
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
  303,
  'progression',
  'II-V in E · 8',
  'II-V in E · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_2',
  false,
  NULL,
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
  303,
  'II-V in E · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-08.mp3',
  4
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
  304,
  'progression',
  'II-V in E · 9',
  'II-V in E · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_2',
  false,
  NULL,
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
  304,
  'II-V in E · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-09.mp3',
  4
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
  305,
  'progression',
  'II-V in E · 10',
  'II-V in E · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_2',
  false,
  NULL,
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
  305,
  'II-V in E · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-10.mp3',
  4
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
  306,
  'progression',
  '複合フレーズ · II-V in E 6-10',
  'Composite · II-V in E 6-10',
  'easy',
  '',
  'II-V in E 6-10',
  'II-V in E 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_2',
  false,
  NULL,
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
VALUES ('phrases', 306, 'C', 4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  307,
  'progression',
  'II-V in E · 11',
  'II-V in E · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_3',
  false,
  NULL,
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
  307,
  'II-V in E · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-11.mp3',
  4
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
  308,
  'progression',
  'II-V in E · 12',
  'II-V in E · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_3',
  false,
  NULL,
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
  308,
  'II-V in E · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-12.mp3',
  4
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
  309,
  'progression',
  'II-V in E · 13',
  'II-V in E · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_3',
  false,
  NULL,
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
  309,
  'II-V in E · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-13.mp3',
  4
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
  310,
  'progression',
  'II-V in E · 14',
  'II-V in E · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_3',
  false,
  NULL,
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
  310,
  'II-V in E · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-14.mp3',
  4
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
  311,
  'progression',
  'II-V in E · 15',
  'II-V in E · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_3',
  false,
  NULL,
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
  311,
  'II-V in E · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-15.mp3',
  4
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
  312,
  'progression',
  '複合フレーズ · II-V in E 11-15',
  'Composite · II-V in E 11-15',
  'easy',
  '',
  'II-V in E 11-15',
  'II-V in E 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_3',
  false,
  NULL,
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
VALUES ('phrases', 312, 'A', 4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  313,
  'progression',
  'II-V in E · 16',
  'II-V in E · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_4',
  false,
  NULL,
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
  313,
  'II-V in E · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-16.mp3',
  4
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
  314,
  'progression',
  'II-V in E · 17',
  'II-V in E · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_4',
  false,
  NULL,
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
  314,
  'II-V in E · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-17.mp3',
  4
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
  315,
  'progression',
  'II-V in E · 18',
  'II-V in E · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_4',
  false,
  NULL,
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
  315,
  'II-V in E · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-18.mp3',
  4
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
  316,
  'progression',
  'II-V in E · 19',
  'II-V in E · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_4',
  false,
  NULL,
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
  316,
  'II-V in E · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-19.mp3',
  4
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
  317,
  'progression',
  'II-V in E · 20',
  'II-V in E · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_4',
  false,
  NULL,
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
  317,
  'II-V in E · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-20.mp3',
  4
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
  318,
  'progression',
  '複合フレーズ · II-V in E 16-20',
  'Composite · II-V in E 16-20',
  'easy',
  '',
  'II-V in E 16-20',
  'II-V in E 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_4',
  false,
  NULL,
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
VALUES ('phrases', 318, 'B', 4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  319,
  'progression',
  'II-V in E · 21',
  'II-V in E · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_5',
  false,
  NULL,
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
  319,
  'II-V in E · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-21.mp3',
  4
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
  320,
  'progression',
  'II-V in E · 22',
  'II-V in E · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_5',
  false,
  NULL,
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
  320,
  'II-V in E · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-22.mp3',
  4
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
  321,
  'progression',
  'II-V in E · 23',
  'II-V in E · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_5',
  false,
  NULL,
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
  321,
  'II-V in E · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-23.mp3',
  4
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
  322,
  'progression',
  'II-V in E · 24',
  'II-V in E · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_5',
  false,
  NULL,
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
  322,
  'II-V in E · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-24.mp3',
  4
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
  323,
  'progression',
  'II-V in E · 25',
  'II-V in E · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_5',
  false,
  NULL,
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
  323,
  'II-V in E · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-25.mp3',
  4
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
  324,
  'progression',
  '複合フレーズ · II-V in E 21-25',
  'Composite · II-V in E 21-25',
  'easy',
  '',
  'II-V in E 21-25',
  'II-V in E 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_5',
  false,
  NULL,
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
VALUES ('phrases', 324, 'C', 4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  325,
  'progression',
  'II-V in E · 26',
  'II-V in E · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_6',
  false,
  NULL,
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
  325,
  'II-V in E · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-26.mp3',
  4
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
  326,
  'progression',
  'II-V in E · 27',
  'II-V in E · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_6',
  false,
  NULL,
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
  326,
  'II-V in E · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-27.mp3',
  4
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
  327,
  'progression',
  'II-V in E · 28',
  'II-V in E · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_6',
  false,
  NULL,
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
  327,
  'II-V in E · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-28.mp3',
  4
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
  328,
  'progression',
  'II-V in E · 29',
  'II-V in E · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_6',
  false,
  NULL,
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
  328,
  'II-V in E · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-29.mp3',
  4
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
  329,
  'progression',
  'II-V in E · 30',
  'II-V in E · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_6',
  false,
  NULL,
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
  329,
  'II-V in E · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-e-30.mp3',
  4
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
  330,
  'progression',
  '複合フレーズ · II-V in E 26-30',
  'Composite · II-V in E 26-30',
  'easy',
  '',
  'II-V in E 26-30',
  'II-V in E 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_e_6',
  false,
  NULL,
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
VALUES ('phrases', 330, 'A', 4, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_295 uuid;
  v_chord_295_0 uuid;
  v_chord_295_1 uuid;
  v_phrase_296 uuid;
  v_chord_296_0 uuid;
  v_chord_296_1 uuid;
  v_phrase_297 uuid;
  v_chord_297_0 uuid;
  v_chord_297_1 uuid;
  v_phrase_298 uuid;
  v_chord_298_0 uuid;
  v_chord_298_1 uuid;
  v_phrase_299 uuid;
  v_chord_299_0 uuid;
  v_chord_299_1 uuid;
  v_phrase_301 uuid;
  v_chord_301_0 uuid;
  v_chord_301_1 uuid;
  v_phrase_302 uuid;
  v_chord_302_0 uuid;
  v_chord_302_1 uuid;
  v_phrase_303 uuid;
  v_chord_303_0 uuid;
  v_chord_303_1 uuid;
  v_phrase_304 uuid;
  v_chord_304_0 uuid;
  v_chord_304_1 uuid;
  v_phrase_305 uuid;
  v_chord_305_0 uuid;
  v_chord_305_1 uuid;
  v_phrase_307 uuid;
  v_chord_307_0 uuid;
  v_chord_307_1 uuid;
  v_phrase_308 uuid;
  v_chord_308_0 uuid;
  v_chord_308_1 uuid;
  v_phrase_309 uuid;
  v_chord_309_0 uuid;
  v_chord_309_1 uuid;
  v_phrase_310 uuid;
  v_chord_310_0 uuid;
  v_chord_310_1 uuid;
  v_phrase_311 uuid;
  v_chord_311_0 uuid;
  v_chord_311_1 uuid;
  v_phrase_313 uuid;
  v_chord_313_0 uuid;
  v_chord_313_1 uuid;
  v_phrase_314 uuid;
  v_chord_314_0 uuid;
  v_chord_314_1 uuid;
  v_phrase_315 uuid;
  v_chord_315_0 uuid;
  v_chord_315_1 uuid;
  v_phrase_316 uuid;
  v_chord_316_0 uuid;
  v_chord_316_1 uuid;
  v_phrase_317 uuid;
  v_chord_317_0 uuid;
  v_chord_317_1 uuid;
  v_phrase_319 uuid;
  v_chord_319_0 uuid;
  v_chord_319_1 uuid;
  v_phrase_320 uuid;
  v_chord_320_0 uuid;
  v_chord_320_1 uuid;
  v_phrase_321 uuid;
  v_chord_321_0 uuid;
  v_chord_321_1 uuid;
  v_phrase_322 uuid;
  v_chord_322_0 uuid;
  v_chord_322_1 uuid;
  v_phrase_323 uuid;
  v_chord_323_0 uuid;
  v_chord_323_1 uuid;
  v_phrase_325 uuid;
  v_chord_325_0 uuid;
  v_chord_325_1 uuid;
  v_phrase_326 uuid;
  v_chord_326_0 uuid;
  v_chord_326_1 uuid;
  v_phrase_327 uuid;
  v_chord_327_0 uuid;
  v_chord_327_1 uuid;
  v_phrase_328 uuid;
  v_chord_328_0 uuid;
  v_chord_328_1 uuid;
  v_phrase_329 uuid;
  v_chord_329_0 uuid;
  v_chord_329_1 uuid;
  v_comp_300 uuid;
  v_comp_306 uuid;
  v_comp_312 uuid;
  v_comp_318 uuid;
  v_comp_324 uuid;
  v_comp_330 uuid;
BEGIN
  SELECT id INTO v_phrase_295 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 295;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_295, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_295_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_295_0, 0, 80, 8, 'G#5', 1),
    (v_chord_295_0, 1, 76, 4, 'E5', 1),
    (v_chord_295_0, 2, 73, 1, 'C#5', 1),
    (v_chord_295_0, 3, 69, 9, 'A4', 1),
    (v_chord_295_0, 4, 73, 1, 'C#5', 1),
    (v_chord_295_0, 5, 76, 4, 'E5', 1),
    (v_chord_295_0, 6, 80, 8, 'G#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_295, 1, 'B7', 2)
  RETURNING id INTO v_chord_295_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_295_1, 0, 83, 11, 'B5', 1),
    (v_chord_295_1, 1, 81, 9, 'A5', 1),
    (v_chord_295_1, 2, 76, 4, 'E5', 1),
    (v_chord_295_1, 3, 73, 1, 'C#5', 1),
    (v_chord_295_1, 4, 80, 8, 'G#5', 1),
    (v_chord_295_1, 5, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_296 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 296;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_296, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_296_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_296_0, 0, 67, 7, 'F##4', 1),
    (v_chord_296_0, 1, 68, 8, 'G#4', 1),
    (v_chord_296_0, 2, 71, 11, 'B4', 1),
    (v_chord_296_0, 3, 68, 8, 'G#4', 1),
    (v_chord_296_0, 4, 69, 9, 'A4', 1),
    (v_chord_296_0, 5, 73, 1, 'C#5', 1),
    (v_chord_296_0, 6, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_296, 1, 'B7', 2)
  RETURNING id INTO v_chord_296_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_296_1, 0, 80, 8, 'G#5', 1),
    (v_chord_296_1, 1, 78, 6, 'F#5', 1),
    (v_chord_296_1, 2, 73, 1, 'C#5', 1),
    (v_chord_296_1, 3, 69, 9, 'A4', 1),
    (v_chord_296_1, 4, 68, 8, 'G#4', 1),
    (v_chord_296_1, 5, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_297 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 297;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_297, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_297_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_297_0, 0, 66, 6, 'F#4', 1),
    (v_chord_297_0, 1, 68, 8, 'G#4', 1),
    (v_chord_297_0, 2, 69, 9, 'A4', 1),
    (v_chord_297_0, 3, 71, 11, 'B4', 1),
    (v_chord_297_0, 4, 73, 1, 'C#5', 1),
    (v_chord_297_0, 5, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_297, 1, 'B7', 2)
  RETURNING id INTO v_chord_297_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_297_1, 0, 75, 3, 'D#5', 1),
    (v_chord_297_1, 1, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_298 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 298;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_298, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_298_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_298_0, 0, 71, 11, 'B4', 1),
    (v_chord_298_0, 1, 69, 9, 'A4', 1),
    (v_chord_298_0, 2, 64, 4, 'E4', 1),
    (v_chord_298_0, 3, 61, 1, 'C#4', 1),
    (v_chord_298_0, 4, 68, 8, 'G#4', 1),
    (v_chord_298_0, 5, 65, 5, 'E#4', 1),
    (v_chord_298_0, 6, 66, 6, 'F#4', 1),
    (v_chord_298_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_298, 1, 'B7', 2)
  RETURNING id INTO v_chord_298_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_298_1, 0, 69, 9, 'A4', 1),
    (v_chord_298_1, 1, 71, 11, 'B4', 1),
    (v_chord_298_1, 2, 73, 1, 'C#5', 1),
    (v_chord_298_1, 3, 69, 9, 'A4', 1),
    (v_chord_298_1, 4, 68, 8, 'G#4', 1),
    (v_chord_298_1, 5, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_299 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 299;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_299, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_299_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_299_0, 0, 69, 9, 'A4', 1),
    (v_chord_299_0, 1, 71, 11, 'B4', 1),
    (v_chord_299_0, 2, 73, 1, 'C#5', 1),
    (v_chord_299_0, 3, 69, 9, 'A4', 1),
    (v_chord_299_0, 4, 68, 8, 'G#4', 1),
    (v_chord_299_0, 5, 66, 6, 'F#4', 1),
    (v_chord_299_0, 6, 65, 5, 'E#4', 1),
    (v_chord_299_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_299, 1, 'B7', 2)
  RETURNING id INTO v_chord_299_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_299_1, 0, 66, 6, 'F#4', 1),
    (v_chord_299_1, 1, 64, 4, 'E4', 1),
    (v_chord_299_1, 2, 62, 2, 'C##4', 1),
    (v_chord_299_1, 3, 63, 3, 'D#4', 1),
    (v_chord_299_1, 4, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_301 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 301;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_301, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_301_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_301_0, 0, 66, 6, 'F#4', 1),
    (v_chord_301_0, 1, 69, 9, 'A4', 1),
    (v_chord_301_0, 2, 73, 1, 'C#5', 1),
    (v_chord_301_0, 3, 76, 4, 'E5', 1),
    (v_chord_301_0, 4, 73, 1, 'C#5', 1),
    (v_chord_301_0, 5, 74, 2, 'C##5', 1),
    (v_chord_301_0, 6, 75, 3, 'D#5', 1),
    (v_chord_301_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_301, 1, 'B7', 2)
  RETURNING id INTO v_chord_301_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_301_1, 0, 69, 9, 'A4', 1),
    (v_chord_301_1, 1, 73, 1, 'C#5', 1),
    (v_chord_301_1, 2, 72, 0, 'C5', 1),
    (v_chord_301_1, 3, 70, 10, 'A#4', 1),
    (v_chord_301_1, 4, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_302 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 302;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_302, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_302_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_302_0, 0, 66, 6, 'F#4', 1),
    (v_chord_302_0, 1, 68, 8, 'G#4', 1),
    (v_chord_302_0, 2, 69, 9, 'A4', 1),
    (v_chord_302_0, 3, 71, 11, 'B4', 1),
    (v_chord_302_0, 4, 73, 1, 'C#5', 1),
    (v_chord_302_0, 5, 75, 3, 'D#5', 1),
    (v_chord_302_0, 6, 76, 4, 'E5', 1),
    (v_chord_302_0, 7, 78, 6, 'F#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_302, 1, 'B7', 2)
  RETURNING id INTO v_chord_302_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_302_1, 0, 80, 8, 'G#5', 1),
    (v_chord_302_1, 1, 83, 11, 'B5', 1),
    (v_chord_302_1, 2, 81, 9, 'A5', 1),
    (v_chord_302_1, 3, 73, 1, 'C#5', 1),
    (v_chord_302_1, 4, 76, 4, 'E5', 1),
    (v_chord_302_1, 5, 80, 8, 'G#5', 1),
    (v_chord_302_1, 6, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_303 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 303;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_303, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_303_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_303_0, 0, 68, 8, 'G#4', 1),
    (v_chord_303_0, 1, 65, 5, 'E#4', 1),
    (v_chord_303_0, 2, 66, 6, 'F#4', 1),
    (v_chord_303_0, 3, 68, 8, 'G#4', 1),
    (v_chord_303_0, 4, 69, 9, 'A4', 1),
    (v_chord_303_0, 5, 71, 11, 'B4', 1),
    (v_chord_303_0, 6, 73, 1, 'C#5', 1),
    (v_chord_303_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_303, 1, 'B7', 2)
  RETURNING id INTO v_chord_303_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_303_1, 0, 66, 6, 'F#4', 1),
    (v_chord_303_1, 1, 64, 4, 'E4', 1),
    (v_chord_303_1, 2, 62, 2, 'C##4', 1),
    (v_chord_303_1, 3, 63, 3, 'D#4', 1),
    (v_chord_303_1, 4, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_304 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 304;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_304, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_304_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_304_0, 0, 69, 9, 'A4', 1),
    (v_chord_304_0, 1, 71, 11, 'B4', 1),
    (v_chord_304_0, 2, 73, 1, 'C#5', 1),
    (v_chord_304_0, 3, 76, 4, 'E5', 1),
    (v_chord_304_0, 4, 80, 8, 'G#5', 1),
    (v_chord_304_0, 5, 81, 9, 'A5', 1),
    (v_chord_304_0, 6, 77, 5, 'E#5', 1),
    (v_chord_304_0, 7, 80, 8, 'G#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_304, 1, 'B7', 2)
  RETURNING id INTO v_chord_304_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_304_1, 0, 78, 6, 'F#5', 1),
    (v_chord_304_1, 1, 76, 4, 'E5', 1),
    (v_chord_304_1, 2, 73, 1, 'C#5', 1),
    (v_chord_304_1, 3, 74, 2, 'C##5', 1),
    (v_chord_304_1, 4, 75, 3, 'D#5', 1),
    (v_chord_304_1, 5, 73, 1, 'C#5', 1),
    (v_chord_304_1, 6, 71, 11, 'B4', 1),
    (v_chord_304_1, 7, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_305 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 305;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_305, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_305_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_305_0, 0, 75, 3, 'D#5', 1),
    (v_chord_305_0, 1, 76, 4, 'E5', 1),
    (v_chord_305_0, 2, 73, 1, 'C#5', 1),
    (v_chord_305_0, 3, 69, 9, 'A4', 1),
    (v_chord_305_0, 4, 68, 8, 'G#4', 1),
    (v_chord_305_0, 5, 69, 9, 'A4', 1),
    (v_chord_305_0, 6, 73, 1, 'C#5', 1),
    (v_chord_305_0, 7, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_305, 1, 'B7', 2)
  RETURNING id INTO v_chord_305_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_305_1, 0, 80, 8, 'G#5', 1),
    (v_chord_305_1, 1, 78, 6, 'F#5', 1),
    (v_chord_305_1, 2, 73, 1, 'C#5', 1),
    (v_chord_305_1, 3, 69, 9, 'A4', 1),
    (v_chord_305_1, 4, 68, 8, 'G#4', 1),
    (v_chord_305_1, 5, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_307 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 307;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_307, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_307_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_307_0, 0, 69, 9, 'A4', 1),
    (v_chord_307_0, 1, 73, 1, 'C#5', 1),
    (v_chord_307_0, 2, 76, 4, 'E5', 1),
    (v_chord_307_0, 3, 80, 8, 'G#5', 1),
    (v_chord_307_0, 4, 83, 11, 'B5', 1),
    (v_chord_307_0, 5, 81, 9, 'A5', 1),
    (v_chord_307_0, 6, 76, 4, 'E5', 1),
    (v_chord_307_0, 7, 73, 1, 'C#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_307, 1, 'B7', 2)
  RETURNING id INTO v_chord_307_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_307_1, 0, 80, 8, 'G#5', 1),
    (v_chord_307_1, 1, 78, 6, 'F#5', 1),
    (v_chord_307_1, 2, 76, 4, 'E5', 1),
    (v_chord_307_1, 3, 75, 3, 'D#5', 1),
    (v_chord_307_1, 4, 73, 1, 'C#5', 1),
    (v_chord_307_1, 5, 71, 11, 'B4', 1),
    (v_chord_307_1, 6, 70, 10, 'A#4', 1);
  SELECT id INTO v_phrase_308 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 308;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_308, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_308_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_308_0, 0, 66, 6, 'F#4', 1),
    (v_chord_308_0, 1, 68, 8, 'G#4', 1),
    (v_chord_308_0, 2, 69, 9, 'A4', 1),
    (v_chord_308_0, 3, 71, 11, 'B4', 1),
    (v_chord_308_0, 4, 73, 1, 'C#5', 1),
    (v_chord_308_0, 5, 69, 9, 'A4', 1),
    (v_chord_308_0, 6, 66, 6, 'F#4', 1),
    (v_chord_308_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_308, 1, 'B7', 2)
  RETURNING id INTO v_chord_308_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_308_1, 0, 65, 5, 'E#4', 1),
    (v_chord_308_1, 1, 64, 4, 'E4', 1),
    (v_chord_308_1, 2, 62, 2, 'C##4', 1),
    (v_chord_308_1, 3, 63, 3, 'D#4', 1),
    (v_chord_308_1, 4, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_309 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 309;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_309, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_309_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_309_0, 0, 71, 11, 'B4', 1),
    (v_chord_309_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_309_0, 2, 69, 9, 'A4', 1),
    (v_chord_309_0, 3, 61, 1, 'C#4', 1),
    (v_chord_309_0, 4, 64, 4, 'E4', 1),
    (v_chord_309_0, 5, 68, 8, 'G#4', 1),
    (v_chord_309_0, 6, 67, 7, 'G4', 1),
    (v_chord_309_0, 7, 65, 5, 'E#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_309, 1, 'B7', 2)
  RETURNING id INTO v_chord_309_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_309_1, 0, 66, 6, 'F#4', 1),
    (v_chord_309_1, 1, 68, 8, 'G#4', 1),
    (v_chord_309_1, 2, 69, 9, 'A4', 1),
    (v_chord_309_1, 3, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_310 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 310;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_310, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_310_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_310_0, 0, 71, 11, 'B4', 1),
    (v_chord_310_0, 1, 69, 9, 'A4', 1),
    (v_chord_310_0, 2, 71, 11, 'B4', 1),
    (v_chord_310_0, 3, 69, 9, 'A4', 1),
    (v_chord_310_0, 4, 68, 8, 'G#4', 1),
    (v_chord_310_0, 5, 69, 9, 'A4', 1),
    (v_chord_310_0, 6, 73, 1, 'C#5', 1),
    (v_chord_310_0, 7, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_310, 1, 'B7', 2)
  RETURNING id INTO v_chord_310_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_310_1, 0, 80, 8, 'G#5', 1),
    (v_chord_310_1, 1, 83, 11, 'B5', 1),
    (v_chord_310_1, 2, 79, 7, 'G5', 1),
    (v_chord_310_1, 3, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_311 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 311;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_311, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_311_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_311_0, 0, 68, 8, 'G#4', 1),
    (v_chord_311_0, 1, 69, 9, 'A4', 1),
    (v_chord_311_0, 2, 73, 1, 'C#5', 1),
    (v_chord_311_0, 3, 76, 4, 'E5', 1),
    (v_chord_311_0, 4, 80, 8, 'G#5', 1),
    (v_chord_311_0, 5, 83, 11, 'B5', 1),
    (v_chord_311_0, 6, 81, 9, 'A5', 1),
    (v_chord_311_0, 7, 76, 4, 'E5', 1),
    (v_chord_311_0, 8, 73, 1, 'C#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_311, 1, 'B7', 2)
  RETURNING id INTO v_chord_311_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_311_1, 0, 72, 0, 'C5', 1),
    (v_chord_311_1, 1, 80, 8, 'G#5', 1);
  SELECT id INTO v_phrase_313 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 313;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_313, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_313_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_313_0, 0, 69, 9, 'A4', 1),
    (v_chord_313_0, 1, 71, 11, 'B4', 1),
    (v_chord_313_0, 2, 69, 9, 'A4', 1),
    (v_chord_313_0, 3, 68, 8, 'G#4', 1),
    (v_chord_313_0, 4, 67, 7, 'G4', 1),
    (v_chord_313_0, 5, 66, 6, 'F#4', 1),
    (v_chord_313_0, 6, 65, 5, 'F4', 1),
    (v_chord_313_0, 7, 64, 4, 'E4', 1),
    (v_chord_313_0, 8, 62, 2, 'C##4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_313, 1, 'B7', 2)
  RETURNING id INTO v_chord_313_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_313_1, 0, 63, 3, 'D#4', 1),
    (v_chord_313_1, 1, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_314 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 314;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_314, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_314_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_314_0, 0, 69, 9, 'A4', 1),
    (v_chord_314_0, 1, 71, 11, 'B4', 1),
    (v_chord_314_0, 2, 69, 9, 'A4', 1),
    (v_chord_314_0, 3, 68, 8, 'G#4', 1),
    (v_chord_314_0, 4, 69, 9, 'A4', 1),
    (v_chord_314_0, 5, 66, 6, 'F#4', 1),
    (v_chord_314_0, 6, 68, 8, 'G#4', 1),
    (v_chord_314_0, 7, 69, 9, 'A4', 1),
    (v_chord_314_0, 8, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_314, 1, 'B7', 2)
  RETURNING id INTO v_chord_314_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_314_1, 0, 73, 1, 'C#5', 1),
    (v_chord_314_1, 1, 76, 4, 'E5', 1),
    (v_chord_314_1, 2, 73, 1, 'C#5', 1),
    (v_chord_314_1, 3, 74, 2, 'C##5', 1),
    (v_chord_314_1, 4, 75, 3, 'D#5', 1),
    (v_chord_314_1, 5, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_315 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 315;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_315, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_315_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_315_0, 0, 69, 9, 'A4', 1),
    (v_chord_315_0, 1, 64, 4, 'E4', 1),
    (v_chord_315_0, 2, 65, 5, 'E#4', 1),
    (v_chord_315_0, 3, 68, 8, 'G#4', 1),
    (v_chord_315_0, 4, 66, 6, 'F#4', 1),
    (v_chord_315_0, 5, 61, 1, 'C#4', 1),
    (v_chord_315_0, 6, 64, 4, 'E4', 1),
    (v_chord_315_0, 7, 62, 2, 'C##4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_315, 1, 'B7', 2)
  RETURNING id INTO v_chord_315_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_315_1, 0, 63, 3, 'D#4', 1),
    (v_chord_315_1, 1, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_316 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 316;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_316, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_316_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_316_0, 0, 69, 9, 'A4', 1),
    (v_chord_316_0, 1, 64, 4, 'E4', 1),
    (v_chord_316_0, 2, 65, 5, 'E#4', 1),
    (v_chord_316_0, 3, 68, 8, 'G#4', 1),
    (v_chord_316_0, 4, 67, 7, 'G4', 1),
    (v_chord_316_0, 5, 65, 5, 'E#4', 1),
    (v_chord_316_0, 6, 66, 6, 'F#4', 1),
    (v_chord_316_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_316, 1, 'B7', 2)
  RETURNING id INTO v_chord_316_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_316_1, 0, 64, 4, 'E4', 1),
    (v_chord_316_1, 1, 62, 2, 'C##4', 1),
    (v_chord_316_1, 2, 63, 3, 'D#4', 1),
    (v_chord_316_1, 3, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_317 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 317;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_317, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_317_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_317_0, 0, 61, 1, 'C#4', 1),
    (v_chord_317_0, 1, 64, 4, 'E4', 1),
    (v_chord_317_0, 2, 68, 8, 'G#4', 1),
    (v_chord_317_0, 3, 71, 11, 'B4', 1),
    (v_chord_317_0, 4, 68, 8, 'G#4', 1),
    (v_chord_317_0, 5, 69, 9, 'A4', 1),
    (v_chord_317_0, 6, 73, 1, 'C#5', 1),
    (v_chord_317_0, 7, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_317, 1, 'B7', 2)
  RETURNING id INTO v_chord_317_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_317_1, 0, 80, 8, 'G#5', 1),
    (v_chord_317_1, 1, 78, 6, 'F#5', 1),
    (v_chord_317_1, 2, 73, 1, 'C#5', 1),
    (v_chord_317_1, 3, 69, 9, 'A4', 1),
    (v_chord_317_1, 4, 68, 8, 'G#4', 1),
    (v_chord_317_1, 5, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_319 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 319;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_319, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_319_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_319_0, 0, 65, 5, 'E#4', 1),
    (v_chord_319_0, 1, 66, 6, 'F#4', 1),
    (v_chord_319_0, 2, 68, 8, 'G#4', 1),
    (v_chord_319_0, 3, 69, 9, 'A4', 1),
    (v_chord_319_0, 4, 71, 11, 'B4', 1),
    (v_chord_319_0, 5, 73, 1, 'C#5', 1),
    (v_chord_319_0, 6, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_319, 1, 'B7', 2)
  RETURNING id INTO v_chord_319_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_319_1, 0, 75, 3, 'D#5', 1),
    (v_chord_319_1, 1, 76, 4, 'E5', 1),
    (v_chord_319_1, 2, 75, 3, 'D#5', 1),
    (v_chord_319_1, 3, 73, 1, 'C#5', 1),
    (v_chord_319_1, 4, 72, 0, 'C5', 1),
    (v_chord_319_1, 5, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_320 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 320;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_320, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_320_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_320_0, 0, 72, 0, 'B#4', 1),
    (v_chord_320_0, 1, 73, 1, 'C#5', 1),
    (v_chord_320_0, 2, 76, 4, 'E5', 1),
    (v_chord_320_0, 3, 80, 8, 'G#5', 1),
    (v_chord_320_0, 4, 83, 11, 'B5', 1),
    (v_chord_320_0, 5, 82, 10, 'Bb5', 1),
    (v_chord_320_0, 6, 80, 8, 'G#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_320, 1, 'B7', 2)
  RETURNING id INTO v_chord_320_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_320_1, 0, 81, 9, 'A5', 1),
    (v_chord_320_1, 1, 73, 1, 'C#5', 1),
    (v_chord_320_1, 2, 76, 4, 'E5', 1),
    (v_chord_320_1, 3, 80, 8, 'G#5', 1),
    (v_chord_320_1, 4, 80, 8, 'G#5', 1),
    (v_chord_320_1, 5, 78, 6, 'F#5', 1);
  SELECT id INTO v_phrase_321 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 321;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_321, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_321_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_321_0, 0, 67, 7, 'F##4', 1),
    (v_chord_321_0, 1, 68, 8, 'G#4', 1),
    (v_chord_321_0, 2, 71, 11, 'B4', 1),
    (v_chord_321_0, 3, 68, 8, 'G#4', 1),
    (v_chord_321_0, 4, 69, 9, 'A4', 1),
    (v_chord_321_0, 5, 73, 1, 'C#5', 1),
    (v_chord_321_0, 6, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_321, 1, 'B7', 2)
  RETURNING id INTO v_chord_321_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_321_1, 0, 80, 8, 'G#5', 1),
    (v_chord_321_1, 1, 78, 6, 'F#5', 1),
    (v_chord_321_1, 2, 77, 5, 'E#5', 1),
    (v_chord_321_1, 3, 75, 3, 'D#5', 1),
    (v_chord_321_1, 4, 74, 2, 'D5', 1),
    (v_chord_321_1, 5, 72, 0, 'C5', 1),
    (v_chord_321_1, 6, 71, 11, 'B4', 1),
    (v_chord_321_1, 7, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_322 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 322;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_322, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_322_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_322_0, 0, 73, 1, 'C#5', 1),
    (v_chord_322_0, 1, 69, 9, 'A4', 1),
    (v_chord_322_0, 2, 68, 8, 'G#4', 1),
    (v_chord_322_0, 3, 66, 6, 'F#4', 1),
    (v_chord_322_0, 4, 71, 11, 'B4', 1),
    (v_chord_322_0, 5, 69, 9, 'A4', 1),
    (v_chord_322_0, 6, 64, 4, 'E4', 1),
    (v_chord_322_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_322, 1, 'B7', 2)
  RETURNING id INTO v_chord_322_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_322_1, 0, 65, 5, 'E#4', 1),
    (v_chord_322_1, 1, 68, 8, 'G#4', 1),
    (v_chord_322_1, 2, 67, 7, 'G4', 1),
    (v_chord_322_1, 3, 65, 5, 'E#4', 1),
    (v_chord_322_1, 4, 66, 6, 'F#4', 1),
    (v_chord_322_1, 5, 68, 8, 'G#4', 1),
    (v_chord_322_1, 6, 69, 9, 'A4', 1),
    (v_chord_322_1, 7, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_323 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 323;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_323, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_323_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_323_0, 0, 66, 6, 'F#4', 1),
    (v_chord_323_0, 1, 65, 5, 'E#4', 1),
    (v_chord_323_0, 2, 66, 6, 'F#4', 1),
    (v_chord_323_0, 3, 68, 8, 'G#4', 1),
    (v_chord_323_0, 4, 69, 9, 'A4', 1),
    (v_chord_323_0, 5, 71, 11, 'B4', 1),
    (v_chord_323_0, 6, 73, 1, 'C#5', 1),
    (v_chord_323_0, 7, 76, 4, 'E5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_323, 1, 'B7', 2)
  RETURNING id INTO v_chord_323_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_323_1, 0, 75, 3, 'D#5', 1),
    (v_chord_323_1, 1, 76, 4, 'E5', 1),
    (v_chord_323_1, 2, 75, 3, 'D#5', 1),
    (v_chord_323_1, 3, 73, 1, 'C#5', 1),
    (v_chord_323_1, 4, 72, 0, 'C5', 1),
    (v_chord_323_1, 5, 71, 11, 'B4', 1),
    (v_chord_323_1, 6, 70, 10, 'Bb4', 1),
    (v_chord_323_1, 7, 69, 9, 'A4', 1),
    (v_chord_323_1, 8, 68, 8, 'G#4', 1);
  SELECT id INTO v_phrase_325 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 325;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_325, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_325_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_325_0, 0, 66, 6, 'F#4', 1),
    (v_chord_325_0, 1, 65, 5, 'E#4', 1),
    (v_chord_325_0, 2, 66, 6, 'F#4', 1),
    (v_chord_325_0, 3, 68, 8, 'G#4', 1),
    (v_chord_325_0, 4, 69, 9, 'A4', 1),
    (v_chord_325_0, 5, 71, 11, 'B4', 1),
    (v_chord_325_0, 6, 73, 1, 'C#5', 1),
    (v_chord_325_0, 7, 67, 7, 'F##4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_325, 1, 'B7', 2)
  RETURNING id INTO v_chord_325_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_325_1, 0, 68, 8, 'G#4', 1),
    (v_chord_325_1, 1, 71, 11, 'B4', 1),
    (v_chord_325_1, 2, 69, 9, 'A4', 1),
    (v_chord_325_1, 3, 61, 1, 'C#4', 1),
    (v_chord_325_1, 4, 64, 4, 'E4', 1),
    (v_chord_325_1, 5, 68, 8, 'G#4', 1),
    (v_chord_325_1, 6, 67, 7, 'G4', 1),
    (v_chord_325_1, 7, 65, 5, 'E#4', 1);
  SELECT id INTO v_phrase_326 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 326;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_326, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_326_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_326_0, 0, 83, 11, 'B5', 1),
    (v_chord_326_0, 1, 81, 9, 'A5', 1),
    (v_chord_326_0, 2, 76, 4, 'E5', 1),
    (v_chord_326_0, 3, 73, 1, 'C#5', 1),
    (v_chord_326_0, 4, 77, 5, 'E#5', 1),
    (v_chord_326_0, 5, 80, 8, 'G#5', 1),
    (v_chord_326_0, 6, 79, 7, 'G5', 1),
    (v_chord_326_0, 7, 77, 5, 'E#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_326, 1, 'B7', 2)
  RETURNING id INTO v_chord_326_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_326_1, 0, 78, 6, 'F#5', 1),
    (v_chord_326_1, 1, 73, 1, 'C#5', 1);
  SELECT id INTO v_phrase_327 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 327;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_327, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_327_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_327_0, 0, 75, 3, 'D#5', 1),
    (v_chord_327_0, 1, 76, 4, 'E5', 1),
    (v_chord_327_0, 2, 73, 1, 'C#5', 1),
    (v_chord_327_0, 3, 69, 9, 'A4', 1),
    (v_chord_327_0, 4, 68, 8, 'G#4', 1),
    (v_chord_327_0, 5, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_327, 1, 'B7', 2)
  RETURNING id INTO v_chord_327_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_327_1, 0, 68, 8, 'G#4', 1),
    (v_chord_327_1, 1, 69, 9, 'A4', 1),
    (v_chord_327_1, 2, 71, 11, 'B4', 1),
    (v_chord_327_1, 3, 72, 0, 'B#4', 1),
    (v_chord_327_1, 4, 75, 3, 'D#5', 1),
    (v_chord_327_1, 5, 80, 8, 'G#5', 1);
  SELECT id INTO v_phrase_328 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 328;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_328, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_328_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_328_0, 0, 75, 3, 'D#5', 1),
    (v_chord_328_0, 1, 76, 4, 'E5', 1),
    (v_chord_328_0, 2, 73, 1, 'C#5', 1),
    (v_chord_328_0, 3, 69, 9, 'A4', 1),
    (v_chord_328_0, 4, 68, 8, 'G#4', 1),
    (v_chord_328_0, 5, 66, 6, 'F#4', 1),
    (v_chord_328_0, 6, 65, 5, 'E#4', 1),
    (v_chord_328_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_328, 1, 'B7', 2)
  RETURNING id INTO v_chord_328_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_328_1, 0, 66, 6, 'F#4', 1),
    (v_chord_328_1, 1, 61, 1, 'C#4', 1);
  SELECT id INTO v_phrase_329 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 329;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_329, 0, 'F#m7', 1)
  RETURNING id INTO v_chord_329_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_329_0, 0, 65, 5, 'E#4', 1),
    (v_chord_329_0, 1, 66, 6, 'F#4', 1),
    (v_chord_329_0, 2, 69, 9, 'A4', 1),
    (v_chord_329_0, 3, 73, 1, 'C#5', 1),
    (v_chord_329_0, 4, 76, 4, 'E5', 1),
    (v_chord_329_0, 5, 73, 1, 'C#5', 1),
    (v_chord_329_0, 6, 69, 9, 'A4', 1),
    (v_chord_329_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_329, 1, 'B7', 2)
  RETURNING id INTO v_chord_329_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_329_1, 0, 68, 8, 'G#4', 1),
    (v_chord_329_1, 1, 71, 11, 'B4', 1);
  SELECT id INTO v_comp_300 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 300;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_300;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_300, 295, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_300, 296, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_300, 297, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_300, 298, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_300, 299, 4);
  SELECT id INTO v_comp_306 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 306;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_306;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_306, 301, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_306, 302, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_306, 303, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_306, 304, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_306, 305, 4);
  SELECT id INTO v_comp_312 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 312;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_312;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_312, 307, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_312, 308, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_312, 309, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_312, 310, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_312, 311, 4);
  SELECT id INTO v_comp_318 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 318;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_318;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_318, 313, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_318, 314, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_318, 315, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_318, 316, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_318, 317, 4);
  SELECT id INTO v_comp_324 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 324;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_324;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_324, 319, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_324, 320, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_324, 321, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_324, 322, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_324, 323, 4);
  SELECT id INTO v_comp_330 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 330;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_330;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_330, 325, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_330, 326, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_330, 327, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_330, 328, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_330, 329, 4);
END $$;

COMMIT;