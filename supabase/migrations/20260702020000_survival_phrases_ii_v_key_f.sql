BEGIN;

-- Survival Phrases II-V key F: stages 43-78
-- MusicXML: 251譜面_+5st_F.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 43 AND 78
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 43 AND 78;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 43 AND 78
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 43 AND 78
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 43 AND 78;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 43 AND 78;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_f_1', 'II-V in F 1-5', 'II-V in F 1-5', 7)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_f_2', 'II-V in F 6-10', 'II-V in F 6-10', 8)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_f_3', 'II-V in F 11-15', 'II-V in F 11-15', 9)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_f_4', 'II-V in F 16-20', 'II-V in F 16-20', 10)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_f_5', 'II-V in F 21-25', 'II-V in F 21-25', 11)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_f_6', 'II-V in F 26-30', 'II-V in F 26-30', 12)
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
  43,
  'progression',
  'II-V in F · 1',
  'II-V in F · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  43,
  'II-V in F · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-01.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  44,
  'progression',
  'II-V in F · 2',
  'II-V in F · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  44,
  'II-V in F · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-02.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  45,
  'progression',
  'II-V in F · 3',
  'II-V in F · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  45,
  'II-V in F · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-03.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  46,
  'progression',
  'II-V in F · 4',
  'II-V in F · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  46,
  'II-V in F · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-04.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  47,
  'progression',
  'II-V in F · 5',
  'II-V in F · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  47,
  'II-V in F · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-05.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  48,
  'progression',
  '複合フレーズ · II-V in F 1-5',
  'Composite · II-V in F 1-5',
  'easy',
  '',
  'II-V in F 1-5',
  'II-V in F 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_1',
  false,
  NULL,
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
VALUES ('phrases', 48, 'B', -1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  49,
  'progression',
  'II-V in F · 6',
  'II-V in F · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  49,
  'II-V in F · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-06.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  50,
  'progression',
  'II-V in F · 7',
  'II-V in F · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  50,
  'II-V in F · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-07.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  51,
  'progression',
  'II-V in F · 8',
  'II-V in F · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  51,
  'II-V in F · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-08.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  52,
  'progression',
  'II-V in F · 9',
  'II-V in F · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  52,
  'II-V in F · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-09.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  53,
  'progression',
  'II-V in F · 10',
  'II-V in F · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  53,
  'II-V in F · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-10.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  54,
  'progression',
  '複合フレーズ · II-V in F 6-10',
  'Composite · II-V in F 6-10',
  'easy',
  '',
  'II-V in F 6-10',
  'II-V in F 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_2',
  false,
  NULL,
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
VALUES ('phrases', 54, 'C', -1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  55,
  'progression',
  'II-V in F · 11',
  'II-V in F · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  55,
  'II-V in F · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-11.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  56,
  'progression',
  'II-V in F · 12',
  'II-V in F · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  56,
  'II-V in F · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-12.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  57,
  'progression',
  'II-V in F · 13',
  'II-V in F · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  57,
  'II-V in F · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-13.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  58,
  'progression',
  'II-V in F · 14',
  'II-V in F · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  58,
  'II-V in F · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-14.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  59,
  'progression',
  'II-V in F · 15',
  'II-V in F · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  59,
  'II-V in F · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-15.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  60,
  'progression',
  '複合フレーズ · II-V in F 11-15',
  'Composite · II-V in F 11-15',
  'easy',
  '',
  'II-V in F 11-15',
  'II-V in F 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_3',
  false,
  NULL,
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
VALUES ('phrases', 60, 'A', -1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  61,
  'progression',
  'II-V in F · 16',
  'II-V in F · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  61,
  'II-V in F · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-16.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  62,
  'progression',
  'II-V in F · 17',
  'II-V in F · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  62,
  'II-V in F · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-17.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  63,
  'progression',
  'II-V in F · 18',
  'II-V in F · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  63,
  'II-V in F · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-18.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  64,
  'progression',
  'II-V in F · 19',
  'II-V in F · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  64,
  'II-V in F · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-19.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  65,
  'progression',
  'II-V in F · 20',
  'II-V in F · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  65,
  'II-V in F · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-20.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  66,
  'progression',
  '複合フレーズ · II-V in F 16-20',
  'Composite · II-V in F 16-20',
  'easy',
  '',
  'II-V in F 16-20',
  'II-V in F 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_4',
  false,
  NULL,
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
VALUES ('phrases', 66, 'B', -1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  67,
  'progression',
  'II-V in F · 21',
  'II-V in F · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  67,
  'II-V in F · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-21.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  68,
  'progression',
  'II-V in F · 22',
  'II-V in F · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  68,
  'II-V in F · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-22.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  69,
  'progression',
  'II-V in F · 23',
  'II-V in F · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  69,
  'II-V in F · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-23.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  70,
  'progression',
  'II-V in F · 24',
  'II-V in F · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  70,
  'II-V in F · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-24.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  71,
  'progression',
  'II-V in F · 25',
  'II-V in F · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  71,
  'II-V in F · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-25.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  72,
  'progression',
  '複合フレーズ · II-V in F 21-25',
  'Composite · II-V in F 21-25',
  'easy',
  '',
  'II-V in F 21-25',
  'II-V in F 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_5',
  false,
  NULL,
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
VALUES ('phrases', 72, 'C', -1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  73,
  'progression',
  'II-V in F · 26',
  'II-V in F · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  73,
  'II-V in F · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-26.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  74,
  'progression',
  'II-V in F · 27',
  'II-V in F · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  74,
  'II-V in F · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-27.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  75,
  'progression',
  'II-V in F · 28',
  'II-V in F · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  75,
  'II-V in F · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-28.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  76,
  'progression',
  'II-V in F · 29',
  'II-V in F · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  76,
  'II-V in F · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-29.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  77,
  'progression',
  'II-V in F · 30',
  'II-V in F · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  77,
  'II-V in F · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-f-30.mp3',
  -1
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  78,
  'progression',
  '複合フレーズ · II-V in F 26-30',
  'Composite · II-V in F 26-30',
  'easy',
  '',
  'II-V in F 26-30',
  'II-V in F 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_f_6',
  false,
  NULL,
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
VALUES ('phrases', 78, 'A', -1, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_43 uuid;
  v_chord_43_0 uuid;
  v_chord_43_1 uuid;
  v_phrase_44 uuid;
  v_chord_44_0 uuid;
  v_chord_44_1 uuid;
  v_phrase_45 uuid;
  v_chord_45_0 uuid;
  v_chord_45_1 uuid;
  v_phrase_46 uuid;
  v_chord_46_0 uuid;
  v_chord_46_1 uuid;
  v_phrase_47 uuid;
  v_chord_47_0 uuid;
  v_chord_47_1 uuid;
  v_phrase_49 uuid;
  v_chord_49_0 uuid;
  v_chord_49_1 uuid;
  v_phrase_50 uuid;
  v_chord_50_0 uuid;
  v_chord_50_1 uuid;
  v_phrase_51 uuid;
  v_chord_51_0 uuid;
  v_chord_51_1 uuid;
  v_phrase_52 uuid;
  v_chord_52_0 uuid;
  v_chord_52_1 uuid;
  v_phrase_53 uuid;
  v_chord_53_0 uuid;
  v_chord_53_1 uuid;
  v_phrase_55 uuid;
  v_chord_55_0 uuid;
  v_chord_55_1 uuid;
  v_phrase_56 uuid;
  v_chord_56_0 uuid;
  v_chord_56_1 uuid;
  v_phrase_57 uuid;
  v_chord_57_0 uuid;
  v_chord_57_1 uuid;
  v_phrase_58 uuid;
  v_chord_58_0 uuid;
  v_chord_58_1 uuid;
  v_phrase_59 uuid;
  v_chord_59_0 uuid;
  v_chord_59_1 uuid;
  v_phrase_61 uuid;
  v_chord_61_0 uuid;
  v_chord_61_1 uuid;
  v_phrase_62 uuid;
  v_chord_62_0 uuid;
  v_chord_62_1 uuid;
  v_phrase_63 uuid;
  v_chord_63_0 uuid;
  v_chord_63_1 uuid;
  v_phrase_64 uuid;
  v_chord_64_0 uuid;
  v_chord_64_1 uuid;
  v_phrase_65 uuid;
  v_chord_65_0 uuid;
  v_chord_65_1 uuid;
  v_phrase_67 uuid;
  v_chord_67_0 uuid;
  v_chord_67_1 uuid;
  v_phrase_68 uuid;
  v_chord_68_0 uuid;
  v_chord_68_1 uuid;
  v_phrase_69 uuid;
  v_chord_69_0 uuid;
  v_chord_69_1 uuid;
  v_phrase_70 uuid;
  v_chord_70_0 uuid;
  v_chord_70_1 uuid;
  v_phrase_71 uuid;
  v_chord_71_0 uuid;
  v_chord_71_1 uuid;
  v_phrase_73 uuid;
  v_chord_73_0 uuid;
  v_chord_73_1 uuid;
  v_phrase_74 uuid;
  v_chord_74_0 uuid;
  v_chord_74_1 uuid;
  v_phrase_75 uuid;
  v_chord_75_0 uuid;
  v_chord_75_1 uuid;
  v_phrase_76 uuid;
  v_chord_76_0 uuid;
  v_chord_76_1 uuid;
  v_phrase_77 uuid;
  v_chord_77_0 uuid;
  v_chord_77_1 uuid;
  v_comp_48 uuid;
  v_comp_54 uuid;
  v_comp_60 uuid;
  v_comp_66 uuid;
  v_comp_72 uuid;
  v_comp_78 uuid;
BEGIN
  SELECT id INTO v_phrase_43 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 43;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_43, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_43_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_43_0, 0, 69, 9, 'A4', 1),
    (v_chord_43_0, 1, 65, 5, 'F4', 1),
    (v_chord_43_0, 2, 62, 2, 'D4', 1),
    (v_chord_43_0, 3, 58, 10, 'Bb3', 1),
    (v_chord_43_0, 4, 62, 2, 'D4', 1),
    (v_chord_43_0, 5, 65, 5, 'F4', 1),
    (v_chord_43_0, 6, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_43, 1, 'C7', 2)
  RETURNING id INTO v_chord_43_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_43_1, 0, 72, 0, 'C5', 1),
    (v_chord_43_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_43_1, 2, 65, 5, 'F4', 1),
    (v_chord_43_1, 3, 62, 2, 'D4', 1),
    (v_chord_43_1, 4, 69, 9, 'A4', 1),
    (v_chord_43_1, 5, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_44 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 44;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_44, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_44_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_44_0, 0, 68, 8, 'G#4', 1),
    (v_chord_44_0, 1, 69, 9, 'A4', 1),
    (v_chord_44_0, 2, 72, 0, 'C5', 1),
    (v_chord_44_0, 3, 69, 9, 'A4', 1),
    (v_chord_44_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_44_0, 5, 74, 2, 'D5', 1),
    (v_chord_44_0, 6, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_44, 1, 'C7', 2)
  RETURNING id INTO v_chord_44_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_44_1, 0, 81, 9, 'A5', 1),
    (v_chord_44_1, 1, 79, 7, 'G5', 1),
    (v_chord_44_1, 2, 74, 2, 'D5', 1),
    (v_chord_44_1, 3, 70, 10, 'Bb4', 1),
    (v_chord_44_1, 4, 69, 9, 'A4', 1),
    (v_chord_44_1, 5, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_45 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 45;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_45, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_45_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_45_0, 0, 67, 7, 'G4', 1),
    (v_chord_45_0, 1, 69, 9, 'A4', 1),
    (v_chord_45_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_45_0, 3, 72, 0, 'C5', 1),
    (v_chord_45_0, 4, 74, 2, 'D5', 1),
    (v_chord_45_0, 5, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_45, 1, 'C7', 2)
  RETURNING id INTO v_chord_45_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_45_1, 0, 76, 4, 'E5', 1),
    (v_chord_45_1, 1, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_46 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 46;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_46, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_46_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_46_0, 0, 72, 0, 'C5', 1),
    (v_chord_46_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_46_0, 2, 65, 5, 'F4', 1),
    (v_chord_46_0, 3, 62, 2, 'D4', 1),
    (v_chord_46_0, 4, 69, 9, 'A4', 1),
    (v_chord_46_0, 5, 66, 6, 'F#4', 1),
    (v_chord_46_0, 6, 67, 7, 'G4', 1),
    (v_chord_46_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_46, 1, 'C7', 2)
  RETURNING id INTO v_chord_46_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_46_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_46_1, 1, 72, 0, 'C5', 1),
    (v_chord_46_1, 2, 74, 2, 'D5', 1),
    (v_chord_46_1, 3, 70, 10, 'Bb4', 1),
    (v_chord_46_1, 4, 69, 9, 'A4', 1),
    (v_chord_46_1, 5, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_47 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 47;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_47, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_47_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_47_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_47_0, 1, 72, 0, 'C5', 1),
    (v_chord_47_0, 2, 74, 2, 'D5', 1),
    (v_chord_47_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_47_0, 4, 69, 9, 'A4', 1),
    (v_chord_47_0, 5, 67, 7, 'G4', 1),
    (v_chord_47_0, 6, 66, 6, 'F#4', 1),
    (v_chord_47_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_47, 1, 'C7', 2)
  RETURNING id INTO v_chord_47_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_47_1, 0, 67, 7, 'G4', 1),
    (v_chord_47_1, 1, 65, 5, 'F4', 1),
    (v_chord_47_1, 2, 63, 3, 'D#4', 1),
    (v_chord_47_1, 3, 64, 4, 'E4', 1),
    (v_chord_47_1, 4, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_49 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 49;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_49, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_49_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_49_0, 0, 67, 7, 'G4', 1),
    (v_chord_49_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_49_0, 2, 74, 2, 'D5', 1),
    (v_chord_49_0, 3, 77, 5, 'F5', 1),
    (v_chord_49_0, 4, 74, 2, 'D5', 1),
    (v_chord_49_0, 5, 75, 3, 'D#5', 1),
    (v_chord_49_0, 6, 76, 4, 'E5', 1),
    (v_chord_49_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_49, 1, 'C7', 2)
  RETURNING id INTO v_chord_49_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_49_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_49_1, 1, 74, 2, 'D5', 1),
    (v_chord_49_1, 2, 73, 1, 'Db5', 1),
    (v_chord_49_1, 3, 71, 11, 'B4', 1),
    (v_chord_49_1, 4, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_50 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 50;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_50, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_50_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_50_0, 0, 67, 7, 'G4', 1),
    (v_chord_50_0, 1, 69, 9, 'A4', 1),
    (v_chord_50_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_50_0, 3, 72, 0, 'C5', 1),
    (v_chord_50_0, 4, 74, 2, 'D5', 1),
    (v_chord_50_0, 5, 76, 4, 'E5', 1),
    (v_chord_50_0, 6, 77, 5, 'F5', 1),
    (v_chord_50_0, 7, 79, 7, 'G5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_50, 1, 'C7', 2)
  RETURNING id INTO v_chord_50_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_50_1, 0, 81, 9, 'A5', 1),
    (v_chord_50_1, 1, 84, 0, 'C6', 1),
    (v_chord_50_1, 2, 82, 10, 'Bb5', 1),
    (v_chord_50_1, 3, 74, 2, 'D5', 1),
    (v_chord_50_1, 4, 77, 5, 'F5', 1),
    (v_chord_50_1, 5, 81, 9, 'A5', 1),
    (v_chord_50_1, 6, 79, 7, 'G5', 1);
  SELECT id INTO v_phrase_51 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 51;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_51, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_51_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_51_0, 0, 69, 9, 'A4', 1),
    (v_chord_51_0, 1, 66, 6, 'F#4', 1),
    (v_chord_51_0, 2, 67, 7, 'G4', 1),
    (v_chord_51_0, 3, 69, 9, 'A4', 1),
    (v_chord_51_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_51_0, 5, 72, 0, 'C5', 1),
    (v_chord_51_0, 6, 74, 2, 'D5', 1),
    (v_chord_51_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_51, 1, 'C7', 2)
  RETURNING id INTO v_chord_51_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_51_1, 0, 67, 7, 'G4', 1),
    (v_chord_51_1, 1, 65, 5, 'F4', 1),
    (v_chord_51_1, 2, 63, 3, 'D#4', 1),
    (v_chord_51_1, 3, 64, 4, 'E4', 1),
    (v_chord_51_1, 4, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_52 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 52;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_52, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_52_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_52_0, 0, 58, 10, 'Bb3', 1),
    (v_chord_52_0, 1, 60, 0, 'C4', 1),
    (v_chord_52_0, 2, 62, 2, 'D4', 1),
    (v_chord_52_0, 3, 65, 5, 'F4', 1),
    (v_chord_52_0, 4, 69, 9, 'A4', 1),
    (v_chord_52_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_52_0, 6, 66, 6, 'F#4', 1),
    (v_chord_52_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_52, 1, 'C7', 2)
  RETURNING id INTO v_chord_52_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_52_1, 0, 67, 7, 'G4', 1),
    (v_chord_52_1, 1, 65, 5, 'F4', 1),
    (v_chord_52_1, 2, 62, 2, 'D4', 1),
    (v_chord_52_1, 3, 63, 3, 'D#4', 1),
    (v_chord_52_1, 4, 64, 4, 'E4', 1),
    (v_chord_52_1, 5, 62, 2, 'D4', 1),
    (v_chord_52_1, 6, 60, 0, 'C4', 1),
    (v_chord_52_1, 7, 59, 11, 'Cb4', 1);
  SELECT id INTO v_phrase_53 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 53;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_53, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_53_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_53_0, 0, 64, 4, 'E4', 1),
    (v_chord_53_0, 1, 65, 5, 'F4', 1),
    (v_chord_53_0, 2, 62, 2, 'D4', 1),
    (v_chord_53_0, 3, 58, 10, 'Bb3', 1),
    (v_chord_53_0, 4, 57, 9, 'A3', 1),
    (v_chord_53_0, 5, 58, 10, 'Bb3', 1),
    (v_chord_53_0, 6, 62, 2, 'D4', 1),
    (v_chord_53_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_53, 1, 'C7', 2)
  RETURNING id INTO v_chord_53_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_53_1, 0, 69, 9, 'A4', 1),
    (v_chord_53_1, 1, 67, 7, 'G4', 1),
    (v_chord_53_1, 2, 62, 2, 'D4', 1),
    (v_chord_53_1, 3, 58, 10, 'Bb3', 1),
    (v_chord_53_1, 4, 57, 9, 'A3', 1),
    (v_chord_53_1, 5, 55, 7, 'G3', 1);
  SELECT id INTO v_phrase_55 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 55;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_55, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_55_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_55_0, 0, 58, 10, 'Bb3', 1),
    (v_chord_55_0, 1, 62, 2, 'D4', 1),
    (v_chord_55_0, 2, 65, 5, 'F4', 1),
    (v_chord_55_0, 3, 69, 9, 'A4', 1),
    (v_chord_55_0, 4, 72, 0, 'C5', 1),
    (v_chord_55_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_55_0, 6, 65, 5, 'F4', 1),
    (v_chord_55_0, 7, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_55, 1, 'C7', 2)
  RETURNING id INTO v_chord_55_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_55_1, 0, 69, 9, 'A4', 1),
    (v_chord_55_1, 1, 67, 7, 'G4', 1),
    (v_chord_55_1, 2, 65, 5, 'F4', 1),
    (v_chord_55_1, 3, 64, 4, 'E4', 1),
    (v_chord_55_1, 4, 62, 2, 'D4', 1),
    (v_chord_55_1, 5, 60, 0, 'C4', 1),
    (v_chord_55_1, 6, 59, 11, 'B3', 1);
  SELECT id INTO v_phrase_56 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 56;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_56, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_56_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_56_0, 0, 67, 7, 'G4', 1),
    (v_chord_56_0, 1, 69, 9, 'A4', 1),
    (v_chord_56_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_56_0, 3, 72, 0, 'C5', 1),
    (v_chord_56_0, 4, 74, 2, 'D5', 1),
    (v_chord_56_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_56_0, 6, 67, 7, 'G4', 1),
    (v_chord_56_0, 7, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_56, 1, 'C7', 2)
  RETURNING id INTO v_chord_56_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_56_1, 0, 66, 6, 'F#4', 1),
    (v_chord_56_1, 1, 65, 5, 'F4', 1),
    (v_chord_56_1, 2, 63, 3, 'D#4', 1),
    (v_chord_56_1, 3, 64, 4, 'E4', 1),
    (v_chord_56_1, 4, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_57 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 57;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_57, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_57_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_57_0, 0, 72, 0, 'C5', 1),
    (v_chord_57_0, 1, 71, 11, 'Cb5', 1),
    (v_chord_57_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_57_0, 3, 62, 2, 'D4', 1),
    (v_chord_57_0, 4, 65, 5, 'F4', 1),
    (v_chord_57_0, 5, 69, 9, 'A4', 1),
    (v_chord_57_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_57_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_57, 1, 'C7', 2)
  RETURNING id INTO v_chord_57_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_57_1, 0, 67, 7, 'G4', 1),
    (v_chord_57_1, 1, 69, 9, 'A4', 1),
    (v_chord_57_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_57_1, 3, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_58 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 58;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_58, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_58_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_58_0, 0, 72, 0, 'C5', 1),
    (v_chord_58_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_58_0, 2, 72, 0, 'C5', 1),
    (v_chord_58_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_58_0, 4, 69, 9, 'A4', 1),
    (v_chord_58_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_58_0, 6, 74, 2, 'D5', 1),
    (v_chord_58_0, 7, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_58, 1, 'C7', 2)
  RETURNING id INTO v_chord_58_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_58_1, 0, 81, 9, 'A5', 1),
    (v_chord_58_1, 1, 84, 0, 'C6', 1),
    (v_chord_58_1, 2, 80, 8, 'Ab5', 1),
    (v_chord_58_1, 3, 79, 7, 'G5', 1);
  SELECT id INTO v_phrase_59 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 59;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_59, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_59_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_59_0, 0, 57, 9, 'A3', 1),
    (v_chord_59_0, 1, 58, 10, 'Bb3', 1),
    (v_chord_59_0, 2, 62, 2, 'D4', 1),
    (v_chord_59_0, 3, 65, 5, 'F4', 1),
    (v_chord_59_0, 4, 69, 9, 'A4', 1),
    (v_chord_59_0, 5, 72, 0, 'C5', 1),
    (v_chord_59_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_59_0, 7, 65, 5, 'F4', 1),
    (v_chord_59_0, 8, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_59, 1, 'C7', 2)
  RETURNING id INTO v_chord_59_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_59_1, 0, 61, 1, 'Db4', 1),
    (v_chord_59_1, 1, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_61 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 61;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_61, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_61_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_61_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_61_0, 1, 72, 0, 'C5', 1),
    (v_chord_61_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_61_0, 3, 69, 9, 'A4', 1),
    (v_chord_61_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_61_0, 5, 67, 7, 'G4', 1),
    (v_chord_61_0, 6, 66, 6, 'Gb4', 1),
    (v_chord_61_0, 7, 65, 5, 'F4', 1),
    (v_chord_61_0, 8, 63, 3, 'D#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_61, 1, 'C7', 2)
  RETURNING id INTO v_chord_61_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_61_1, 0, 64, 4, 'E4', 1),
    (v_chord_61_1, 1, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_62 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 62;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_62, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_62_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_62_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_62_0, 1, 72, 0, 'C5', 1),
    (v_chord_62_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_62_0, 3, 69, 9, 'A4', 1),
    (v_chord_62_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_62_0, 5, 67, 7, 'G4', 1),
    (v_chord_62_0, 6, 69, 9, 'A4', 1),
    (v_chord_62_0, 7, 70, 10, 'Bb4', 1),
    (v_chord_62_0, 8, 72, 0, 'C5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_62, 1, 'C7', 2)
  RETURNING id INTO v_chord_62_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_62_1, 0, 74, 2, 'D5', 1),
    (v_chord_62_1, 1, 77, 5, 'F5', 1),
    (v_chord_62_1, 2, 74, 2, 'D5', 1),
    (v_chord_62_1, 3, 75, 3, 'D#5', 1),
    (v_chord_62_1, 4, 76, 4, 'E5', 1),
    (v_chord_62_1, 5, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_63 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 63;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_63, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_63_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_63_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_63_0, 1, 65, 5, 'F4', 1),
    (v_chord_63_0, 2, 66, 6, 'F#4', 1),
    (v_chord_63_0, 3, 69, 9, 'A4', 1),
    (v_chord_63_0, 4, 67, 7, 'G4', 1),
    (v_chord_63_0, 5, 62, 2, 'D4', 1),
    (v_chord_63_0, 6, 65, 5, 'F4', 1),
    (v_chord_63_0, 7, 63, 3, 'D#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_63, 1, 'C7', 2)
  RETURNING id INTO v_chord_63_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_63_1, 0, 64, 4, 'E4', 1),
    (v_chord_63_1, 1, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_64 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 64;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_64, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_64_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_64_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_64_0, 1, 65, 5, 'F4', 1),
    (v_chord_64_0, 2, 66, 6, 'F#4', 1),
    (v_chord_64_0, 3, 69, 9, 'A4', 1),
    (v_chord_64_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_64_0, 5, 66, 6, 'F#4', 1),
    (v_chord_64_0, 6, 67, 7, 'G4', 1),
    (v_chord_64_0, 7, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_64, 1, 'C7', 2)
  RETURNING id INTO v_chord_64_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_64_1, 0, 65, 5, 'F4', 1),
    (v_chord_64_1, 1, 63, 3, 'D#4', 1),
    (v_chord_64_1, 2, 64, 4, 'E4', 1),
    (v_chord_64_1, 3, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_65 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 65;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_65, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_65_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_65_0, 0, 62, 2, 'D4', 1),
    (v_chord_65_0, 1, 65, 5, 'F4', 1),
    (v_chord_65_0, 2, 69, 9, 'A4', 1),
    (v_chord_65_0, 3, 72, 0, 'C5', 1),
    (v_chord_65_0, 4, 69, 9, 'A4', 1),
    (v_chord_65_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_65_0, 6, 74, 2, 'D5', 1),
    (v_chord_65_0, 7, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_65, 1, 'C7', 2)
  RETURNING id INTO v_chord_65_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_65_1, 0, 81, 9, 'A5', 1),
    (v_chord_65_1, 1, 79, 7, 'G5', 1),
    (v_chord_65_1, 2, 74, 2, 'D5', 1),
    (v_chord_65_1, 3, 70, 10, 'Bb4', 1),
    (v_chord_65_1, 4, 69, 9, 'A4', 1),
    (v_chord_65_1, 5, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_67 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 67;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_67, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_67_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_67_0, 0, 66, 6, 'F#4', 1),
    (v_chord_67_0, 1, 67, 7, 'G4', 1),
    (v_chord_67_0, 2, 69, 9, 'A4', 1),
    (v_chord_67_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_67_0, 4, 72, 0, 'C5', 1),
    (v_chord_67_0, 5, 74, 2, 'D5', 1),
    (v_chord_67_0, 6, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_67, 1, 'C7', 2)
  RETURNING id INTO v_chord_67_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_67_1, 0, 76, 4, 'E5', 1),
    (v_chord_67_1, 1, 77, 5, 'F5', 1),
    (v_chord_67_1, 2, 76, 4, 'E5', 1),
    (v_chord_67_1, 3, 74, 2, 'D5', 1),
    (v_chord_67_1, 4, 73, 1, 'Db5', 1),
    (v_chord_67_1, 5, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_68 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 68;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_68, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_68_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_68_0, 0, 73, 1, 'C#5', 1),
    (v_chord_68_0, 1, 74, 2, 'D5', 1),
    (v_chord_68_0, 2, 77, 5, 'F5', 1),
    (v_chord_68_0, 3, 81, 9, 'A5', 1),
    (v_chord_68_0, 4, 84, 0, 'C6', 1),
    (v_chord_68_0, 5, 83, 11, 'Cb6', 1),
    (v_chord_68_0, 6, 81, 9, 'A5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_68, 1, 'C7', 2)
  RETURNING id INTO v_chord_68_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_68_1, 0, 82, 10, 'Bb5', 1),
    (v_chord_68_1, 1, 74, 2, 'D5', 1),
    (v_chord_68_1, 2, 77, 5, 'F5', 1),
    (v_chord_68_1, 3, 81, 9, 'A5', 1),
    (v_chord_68_1, 4, 81, 9, 'A5', 1),
    (v_chord_68_1, 5, 79, 7, 'G5', 1);
  SELECT id INTO v_phrase_69 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 69;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_69, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_69_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_69_0, 0, 68, 8, 'G#4', 1),
    (v_chord_69_0, 1, 69, 9, 'A4', 1),
    (v_chord_69_0, 2, 72, 0, 'C5', 1),
    (v_chord_69_0, 3, 69, 9, 'A4', 1),
    (v_chord_69_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_69_0, 5, 74, 2, 'D5', 1),
    (v_chord_69_0, 6, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_69, 1, 'C7', 2)
  RETURNING id INTO v_chord_69_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_69_1, 0, 81, 9, 'A5', 1),
    (v_chord_69_1, 1, 79, 7, 'G5', 1),
    (v_chord_69_1, 2, 78, 6, 'F#5', 1),
    (v_chord_69_1, 3, 76, 4, 'E5', 1),
    (v_chord_69_1, 4, 75, 3, 'Eb5', 1),
    (v_chord_69_1, 5, 73, 1, 'Db5', 1),
    (v_chord_69_1, 6, 72, 0, 'C5', 1),
    (v_chord_69_1, 7, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_70 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 70;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_70, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_70_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_70_0, 0, 74, 2, 'D5', 1),
    (v_chord_70_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_70_0, 2, 69, 9, 'A4', 1),
    (v_chord_70_0, 3, 67, 7, 'G4', 1),
    (v_chord_70_0, 4, 72, 0, 'C5', 1),
    (v_chord_70_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_70_0, 6, 65, 5, 'F4', 1),
    (v_chord_70_0, 7, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_70, 1, 'C7', 2)
  RETURNING id INTO v_chord_70_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_70_1, 0, 66, 6, 'F#4', 1),
    (v_chord_70_1, 1, 69, 9, 'A4', 1),
    (v_chord_70_1, 2, 68, 8, 'Ab4', 1),
    (v_chord_70_1, 3, 66, 6, 'F#4', 1),
    (v_chord_70_1, 4, 67, 7, 'G4', 1),
    (v_chord_70_1, 5, 69, 9, 'A4', 1),
    (v_chord_70_1, 6, 70, 10, 'Bb4', 1),
    (v_chord_70_1, 7, 72, 0, 'C5', 1);
  SELECT id INTO v_phrase_71 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 71;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_71, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_71_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_71_0, 0, 67, 7, 'G4', 1),
    (v_chord_71_0, 1, 66, 6, 'F#4', 1),
    (v_chord_71_0, 2, 67, 7, 'G4', 1),
    (v_chord_71_0, 3, 69, 9, 'A4', 1),
    (v_chord_71_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_71_0, 5, 72, 0, 'C5', 1),
    (v_chord_71_0, 6, 74, 2, 'D5', 1),
    (v_chord_71_0, 7, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_71, 1, 'C7', 2)
  RETURNING id INTO v_chord_71_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_71_1, 0, 76, 4, 'E5', 1),
    (v_chord_71_1, 1, 77, 5, 'F5', 1),
    (v_chord_71_1, 2, 76, 4, 'E5', 1),
    (v_chord_71_1, 3, 74, 2, 'D5', 1),
    (v_chord_71_1, 4, 73, 1, 'Db5', 1),
    (v_chord_71_1, 5, 72, 0, 'C5', 1),
    (v_chord_71_1, 6, 71, 11, 'Cb5', 1),
    (v_chord_71_1, 7, 70, 10, 'Bb4', 1),
    (v_chord_71_1, 8, 69, 9, 'A4', 1);
  SELECT id INTO v_phrase_73 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 73;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_73, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_73_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_73_0, 0, 67, 7, 'G4', 1),
    (v_chord_73_0, 1, 66, 6, 'F#4', 1),
    (v_chord_73_0, 2, 67, 7, 'G4', 1),
    (v_chord_73_0, 3, 69, 9, 'A4', 1),
    (v_chord_73_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_73_0, 5, 72, 0, 'C5', 1),
    (v_chord_73_0, 6, 74, 2, 'D5', 1),
    (v_chord_73_0, 7, 68, 8, 'G#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_73, 1, 'C7', 2)
  RETURNING id INTO v_chord_73_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_73_1, 0, 69, 9, 'A4', 1),
    (v_chord_73_1, 1, 72, 0, 'C5', 1),
    (v_chord_73_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_73_1, 3, 62, 2, 'D4', 1),
    (v_chord_73_1, 4, 65, 5, 'F4', 1),
    (v_chord_73_1, 5, 69, 9, 'A4', 1),
    (v_chord_73_1, 6, 68, 8, 'Ab4', 1),
    (v_chord_73_1, 7, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_74 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 74;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_74, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_74_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_74_0, 0, 72, 0, 'C5', 1),
    (v_chord_74_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_74_0, 2, 65, 5, 'F4', 1),
    (v_chord_74_0, 3, 62, 2, 'D4', 1),
    (v_chord_74_0, 4, 66, 6, 'F#4', 1),
    (v_chord_74_0, 5, 69, 9, 'A4', 1),
    (v_chord_74_0, 6, 68, 8, 'Ab4', 1),
    (v_chord_74_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_74, 1, 'C7', 2)
  RETURNING id INTO v_chord_74_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_74_1, 0, 67, 7, 'G4', 1),
    (v_chord_74_1, 1, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_75 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 75;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_75, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_75_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_75_0, 0, 76, 4, 'E5', 1),
    (v_chord_75_0, 1, 77, 5, 'F5', 1),
    (v_chord_75_0, 2, 74, 2, 'D5', 1),
    (v_chord_75_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_75_0, 4, 69, 9, 'A4', 1),
    (v_chord_75_0, 5, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_75, 1, 'C7', 2)
  RETURNING id INTO v_chord_75_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_75_1, 0, 69, 9, 'A4', 1),
    (v_chord_75_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_75_1, 2, 72, 0, 'C5', 1),
    (v_chord_75_1, 3, 73, 1, 'C#5', 1),
    (v_chord_75_1, 4, 76, 4, 'E5', 1),
    (v_chord_75_1, 5, 81, 9, 'A5', 1);
  SELECT id INTO v_phrase_76 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 76;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_76, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_76_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_76_0, 0, 76, 4, 'E5', 1),
    (v_chord_76_0, 1, 77, 5, 'F5', 1),
    (v_chord_76_0, 2, 74, 2, 'D5', 1),
    (v_chord_76_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_76_0, 4, 69, 9, 'A4', 1),
    (v_chord_76_0, 5, 67, 7, 'G4', 1),
    (v_chord_76_0, 6, 66, 6, 'F#4', 1),
    (v_chord_76_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_76, 1, 'C7', 2)
  RETURNING id INTO v_chord_76_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_76_1, 0, 67, 7, 'G4', 1),
    (v_chord_76_1, 1, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_77 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 77;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_77, 0, 'Gm7', 1)
  RETURNING id INTO v_chord_77_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_77_0, 0, 66, 6, 'F#4', 1),
    (v_chord_77_0, 1, 67, 7, 'G4', 1),
    (v_chord_77_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_77_0, 3, 74, 2, 'D5', 1),
    (v_chord_77_0, 4, 77, 5, 'F5', 1),
    (v_chord_77_0, 5, 74, 2, 'D5', 1),
    (v_chord_77_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_77_0, 7, 67, 7, 'G4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_77, 1, 'C7', 2)
  RETURNING id INTO v_chord_77_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_77_1, 0, 69, 9, 'A4', 1),
    (v_chord_77_1, 1, 72, 0, 'C5', 1);
  SELECT id INTO v_comp_48 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 48;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_48;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_48, 43, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_48, 44, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_48, 45, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_48, 46, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_48, 47, 4);
  SELECT id INTO v_comp_54 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 54;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_54;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_54, 49, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_54, 50, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_54, 51, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_54, 52, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_54, 53, 4);
  SELECT id INTO v_comp_60 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 60;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_60;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_60, 55, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_60, 56, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_60, 57, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_60, 58, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_60, 59, 4);
  SELECT id INTO v_comp_66 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 66;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_66;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_66, 61, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_66, 62, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_66, 63, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_66, 64, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_66, 65, 4);
  SELECT id INTO v_comp_72 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 72;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_72;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_72, 67, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_72, 68, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_72, 69, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_72, 70, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_72, 71, 4);
  SELECT id INTO v_comp_78 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 78;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_78;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_78, 73, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_78, 74, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_78, 75, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_78, 76, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_78, 77, 4);
END $$;

COMMIT;