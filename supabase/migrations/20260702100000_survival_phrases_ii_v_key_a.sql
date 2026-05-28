BEGIN;

-- Survival Phrases II-V key A: stages 331-366
-- MusicXML: 251譜面_-3st_A.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 331 AND 366
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 331 AND 366;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 331 AND 366
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 331 AND 366
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 331 AND 366;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 331 AND 366;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_a_1', 'II-V in A 1-5', 'II-V in A 1-5', 55)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_a_2', 'II-V in A 6-10', 'II-V in A 6-10', 56)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_a_3', 'II-V in A 11-15', 'II-V in A 11-15', 57)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_a_4', 'II-V in A 16-20', 'II-V in A 16-20', 58)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_a_5', 'II-V in A 21-25', 'II-V in A 21-25', 59)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_a_6', 'II-V in A 26-30', 'II-V in A 26-30', 60)
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
  331,
  'progression',
  'II-V in A · 1',
  'II-V in A · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  331,
  'II-V in A · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-01.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  332,
  'progression',
  'II-V in A · 2',
  'II-V in A · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  332,
  'II-V in A · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-02.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  333,
  'progression',
  'II-V in A · 3',
  'II-V in A · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  333,
  'II-V in A · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-03.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  334,
  'progression',
  'II-V in A · 4',
  'II-V in A · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  334,
  'II-V in A · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-04.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  335,
  'progression',
  'II-V in A · 5',
  'II-V in A · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  335,
  'II-V in A · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-05.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  336,
  'progression',
  '複合フレーズ · II-V in A 1-5',
  'Composite · II-V in A 1-5',
  'easy',
  '',
  'II-V in A 1-5',
  'II-V in A 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_1',
  false,
  NULL,
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
VALUES ('phrases', 336, 'B', 3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  337,
  'progression',
  'II-V in A · 6',
  'II-V in A · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  337,
  'II-V in A · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-06.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  338,
  'progression',
  'II-V in A · 7',
  'II-V in A · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  338,
  'II-V in A · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-07.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  339,
  'progression',
  'II-V in A · 8',
  'II-V in A · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  339,
  'II-V in A · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-08.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  340,
  'progression',
  'II-V in A · 9',
  'II-V in A · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  340,
  'II-V in A · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-09.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  341,
  'progression',
  'II-V in A · 10',
  'II-V in A · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  341,
  'II-V in A · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-10.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  342,
  'progression',
  '複合フレーズ · II-V in A 6-10',
  'Composite · II-V in A 6-10',
  'easy',
  '',
  'II-V in A 6-10',
  'II-V in A 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_2',
  false,
  NULL,
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
VALUES ('phrases', 342, 'C', 3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  343,
  'progression',
  'II-V in A · 11',
  'II-V in A · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  343,
  'II-V in A · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-11.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  344,
  'progression',
  'II-V in A · 12',
  'II-V in A · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  344,
  'II-V in A · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-12.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  345,
  'progression',
  'II-V in A · 13',
  'II-V in A · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  345,
  'II-V in A · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-13.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  346,
  'progression',
  'II-V in A · 14',
  'II-V in A · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  346,
  'II-V in A · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-14.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  347,
  'progression',
  'II-V in A · 15',
  'II-V in A · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  347,
  'II-V in A · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-15.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  348,
  'progression',
  '複合フレーズ · II-V in A 11-15',
  'Composite · II-V in A 11-15',
  'easy',
  '',
  'II-V in A 11-15',
  'II-V in A 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_3',
  false,
  NULL,
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
VALUES ('phrases', 348, 'A', 3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  349,
  'progression',
  'II-V in A · 16',
  'II-V in A · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  349,
  'II-V in A · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-16.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  350,
  'progression',
  'II-V in A · 17',
  'II-V in A · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  350,
  'II-V in A · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-17.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  351,
  'progression',
  'II-V in A · 18',
  'II-V in A · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  351,
  'II-V in A · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-18.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  352,
  'progression',
  'II-V in A · 19',
  'II-V in A · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  352,
  'II-V in A · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-19.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  353,
  'progression',
  'II-V in A · 20',
  'II-V in A · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  353,
  'II-V in A · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-20.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  354,
  'progression',
  '複合フレーズ · II-V in A 16-20',
  'Composite · II-V in A 16-20',
  'easy',
  '',
  'II-V in A 16-20',
  'II-V in A 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_4',
  false,
  NULL,
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
VALUES ('phrases', 354, 'B', 3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  355,
  'progression',
  'II-V in A · 21',
  'II-V in A · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  355,
  'II-V in A · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-21.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  356,
  'progression',
  'II-V in A · 22',
  'II-V in A · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  356,
  'II-V in A · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-22.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  357,
  'progression',
  'II-V in A · 23',
  'II-V in A · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  357,
  'II-V in A · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-23.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  358,
  'progression',
  'II-V in A · 24',
  'II-V in A · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  358,
  'II-V in A · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-24.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  359,
  'progression',
  'II-V in A · 25',
  'II-V in A · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  359,
  'II-V in A · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-25.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  360,
  'progression',
  '複合フレーズ · II-V in A 21-25',
  'Composite · II-V in A 21-25',
  'easy',
  '',
  'II-V in A 21-25',
  'II-V in A 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_5',
  false,
  NULL,
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
VALUES ('phrases', 360, 'C', 3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  361,
  'progression',
  'II-V in A · 26',
  'II-V in A · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  361,
  'II-V in A · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-26.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  362,
  'progression',
  'II-V in A · 27',
  'II-V in A · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  362,
  'II-V in A · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-27.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  363,
  'progression',
  'II-V in A · 28',
  'II-V in A · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  363,
  'II-V in A · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-28.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  364,
  'progression',
  'II-V in A · 29',
  'II-V in A · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  364,
  'II-V in A · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-29.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  365,
  'progression',
  'II-V in A · 30',
  'II-V in A · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  365,
  'II-V in A · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-a-30.mp3',
  3
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  366,
  'progression',
  '複合フレーズ · II-V in A 26-30',
  'Composite · II-V in A 26-30',
  'easy',
  '',
  'II-V in A 26-30',
  'II-V in A 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_a_6',
  false,
  NULL,
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
VALUES ('phrases', 366, 'A', 3, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_331 uuid;
  v_chord_331_0 uuid;
  v_chord_331_1 uuid;
  v_phrase_332 uuid;
  v_chord_332_0 uuid;
  v_chord_332_1 uuid;
  v_phrase_333 uuid;
  v_chord_333_0 uuid;
  v_chord_333_1 uuid;
  v_phrase_334 uuid;
  v_chord_334_0 uuid;
  v_chord_334_1 uuid;
  v_phrase_335 uuid;
  v_chord_335_0 uuid;
  v_chord_335_1 uuid;
  v_phrase_337 uuid;
  v_chord_337_0 uuid;
  v_chord_337_1 uuid;
  v_phrase_338 uuid;
  v_chord_338_0 uuid;
  v_chord_338_1 uuid;
  v_phrase_339 uuid;
  v_chord_339_0 uuid;
  v_chord_339_1 uuid;
  v_phrase_340 uuid;
  v_chord_340_0 uuid;
  v_chord_340_1 uuid;
  v_phrase_341 uuid;
  v_chord_341_0 uuid;
  v_chord_341_1 uuid;
  v_phrase_343 uuid;
  v_chord_343_0 uuid;
  v_chord_343_1 uuid;
  v_phrase_344 uuid;
  v_chord_344_0 uuid;
  v_chord_344_1 uuid;
  v_phrase_345 uuid;
  v_chord_345_0 uuid;
  v_chord_345_1 uuid;
  v_phrase_346 uuid;
  v_chord_346_0 uuid;
  v_chord_346_1 uuid;
  v_phrase_347 uuid;
  v_chord_347_0 uuid;
  v_chord_347_1 uuid;
  v_phrase_349 uuid;
  v_chord_349_0 uuid;
  v_chord_349_1 uuid;
  v_phrase_350 uuid;
  v_chord_350_0 uuid;
  v_chord_350_1 uuid;
  v_phrase_351 uuid;
  v_chord_351_0 uuid;
  v_chord_351_1 uuid;
  v_phrase_352 uuid;
  v_chord_352_0 uuid;
  v_chord_352_1 uuid;
  v_phrase_353 uuid;
  v_chord_353_0 uuid;
  v_chord_353_1 uuid;
  v_phrase_355 uuid;
  v_chord_355_0 uuid;
  v_chord_355_1 uuid;
  v_phrase_356 uuid;
  v_chord_356_0 uuid;
  v_chord_356_1 uuid;
  v_phrase_357 uuid;
  v_chord_357_0 uuid;
  v_chord_357_1 uuid;
  v_phrase_358 uuid;
  v_chord_358_0 uuid;
  v_chord_358_1 uuid;
  v_phrase_359 uuid;
  v_chord_359_0 uuid;
  v_chord_359_1 uuid;
  v_phrase_361 uuid;
  v_chord_361_0 uuid;
  v_chord_361_1 uuid;
  v_phrase_362 uuid;
  v_chord_362_0 uuid;
  v_chord_362_1 uuid;
  v_phrase_363 uuid;
  v_chord_363_0 uuid;
  v_chord_363_1 uuid;
  v_phrase_364 uuid;
  v_chord_364_0 uuid;
  v_chord_364_1 uuid;
  v_phrase_365 uuid;
  v_chord_365_0 uuid;
  v_chord_365_1 uuid;
  v_comp_336 uuid;
  v_comp_342 uuid;
  v_comp_348 uuid;
  v_comp_354 uuid;
  v_comp_360 uuid;
  v_comp_366 uuid;
BEGIN
  SELECT id INTO v_phrase_331 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 331;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_331, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_331_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_331_0, 0, 73, 1, 'C#5', 1),
    (v_chord_331_0, 1, 69, 9, 'A4', 1),
    (v_chord_331_0, 2, 66, 6, 'F#4', 1),
    (v_chord_331_0, 3, 62, 2, 'D4', 1),
    (v_chord_331_0, 4, 66, 6, 'F#4', 1),
    (v_chord_331_0, 5, 69, 9, 'A4', 1),
    (v_chord_331_0, 6, 73, 1, 'C#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_331, 1, 'E7', 2)
  RETURNING id INTO v_chord_331_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_331_1, 0, 76, 4, 'E5', 1),
    (v_chord_331_1, 1, 74, 2, 'D5', 1),
    (v_chord_331_1, 2, 69, 9, 'A4', 1),
    (v_chord_331_1, 3, 66, 6, 'F#4', 1),
    (v_chord_331_1, 4, 73, 1, 'C#5', 1),
    (v_chord_331_1, 5, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_332 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 332;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_332, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_332_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_332_0, 0, 60, 0, 'B#3', 1),
    (v_chord_332_0, 1, 61, 1, 'C#4', 1),
    (v_chord_332_0, 2, 64, 4, 'E4', 1),
    (v_chord_332_0, 3, 61, 1, 'C#4', 1),
    (v_chord_332_0, 4, 62, 2, 'D4', 1),
    (v_chord_332_0, 5, 66, 6, 'F#4', 1),
    (v_chord_332_0, 6, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_332, 1, 'E7', 2)
  RETURNING id INTO v_chord_332_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_332_1, 0, 73, 1, 'C#5', 1),
    (v_chord_332_1, 1, 71, 11, 'B4', 1),
    (v_chord_332_1, 2, 66, 6, 'F#4', 1),
    (v_chord_332_1, 3, 62, 2, 'D4', 1),
    (v_chord_332_1, 4, 61, 1, 'C#4', 1),
    (v_chord_332_1, 5, 59, 11, 'B3', 1);
  SELECT id INTO v_phrase_333 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 333;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_333, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_333_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_333_0, 0, 59, 11, 'B3', 1),
    (v_chord_333_0, 1, 61, 1, 'C#4', 1),
    (v_chord_333_0, 2, 62, 2, 'D4', 1),
    (v_chord_333_0, 3, 64, 4, 'E4', 1),
    (v_chord_333_0, 4, 66, 6, 'F#4', 1),
    (v_chord_333_0, 5, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_333, 1, 'E7', 2)
  RETURNING id INTO v_chord_333_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_333_1, 0, 68, 8, 'G#4', 1),
    (v_chord_333_1, 1, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_334 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 334;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_334, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_334_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_334_0, 0, 76, 4, 'E5', 1),
    (v_chord_334_0, 1, 74, 2, 'D5', 1),
    (v_chord_334_0, 2, 69, 9, 'A4', 1),
    (v_chord_334_0, 3, 66, 6, 'F#4', 1),
    (v_chord_334_0, 4, 73, 1, 'C#5', 1),
    (v_chord_334_0, 5, 70, 10, 'A#4', 1),
    (v_chord_334_0, 6, 71, 11, 'B4', 1),
    (v_chord_334_0, 7, 73, 1, 'C#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_334, 1, 'E7', 2)
  RETURNING id INTO v_chord_334_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_334_1, 0, 74, 2, 'D5', 1),
    (v_chord_334_1, 1, 76, 4, 'E5', 1),
    (v_chord_334_1, 2, 78, 6, 'F#5', 1),
    (v_chord_334_1, 3, 74, 2, 'D5', 1),
    (v_chord_334_1, 4, 73, 1, 'C#5', 1),
    (v_chord_334_1, 5, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_335 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 335;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_335, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_335_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_335_0, 0, 62, 2, 'D4', 1),
    (v_chord_335_0, 1, 64, 4, 'E4', 1),
    (v_chord_335_0, 2, 66, 6, 'F#4', 1),
    (v_chord_335_0, 3, 62, 2, 'D4', 1),
    (v_chord_335_0, 4, 61, 1, 'C#4', 1),
    (v_chord_335_0, 5, 59, 11, 'B3', 1),
    (v_chord_335_0, 6, 58, 10, 'A#3', 1),
    (v_chord_335_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_335, 1, 'E7', 2)
  RETURNING id INTO v_chord_335_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_335_1, 0, 59, 11, 'B3', 1),
    (v_chord_335_1, 1, 57, 9, 'A3', 1),
    (v_chord_335_1, 2, 55, 7, 'F##3', 1),
    (v_chord_335_1, 3, 56, 8, 'G#3', 1),
    (v_chord_335_1, 4, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_337 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 337;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_337, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_337_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_337_0, 0, 59, 11, 'B3', 1),
    (v_chord_337_0, 1, 62, 2, 'D4', 1),
    (v_chord_337_0, 2, 66, 6, 'F#4', 1),
    (v_chord_337_0, 3, 69, 9, 'A4', 1),
    (v_chord_337_0, 4, 66, 6, 'F#4', 1),
    (v_chord_337_0, 5, 67, 7, 'F##4', 1),
    (v_chord_337_0, 6, 68, 8, 'G#4', 1),
    (v_chord_337_0, 7, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_337, 1, 'E7', 2)
  RETURNING id INTO v_chord_337_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_337_1, 0, 62, 2, 'D4', 1),
    (v_chord_337_1, 1, 66, 6, 'F#4', 1),
    (v_chord_337_1, 2, 65, 5, 'F4', 1),
    (v_chord_337_1, 3, 63, 3, 'D#4', 1),
    (v_chord_337_1, 4, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_338 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 338;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_338, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_338_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_338_0, 0, 59, 11, 'B3', 1),
    (v_chord_338_0, 1, 61, 1, 'C#4', 1),
    (v_chord_338_0, 2, 62, 2, 'D4', 1),
    (v_chord_338_0, 3, 64, 4, 'E4', 1),
    (v_chord_338_0, 4, 66, 6, 'F#4', 1),
    (v_chord_338_0, 5, 68, 8, 'G#4', 1),
    (v_chord_338_0, 6, 69, 9, 'A4', 1),
    (v_chord_338_0, 7, 71, 11, 'B4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_338, 1, 'E7', 2)
  RETURNING id INTO v_chord_338_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_338_1, 0, 73, 1, 'C#5', 1),
    (v_chord_338_1, 1, 76, 4, 'E5', 1),
    (v_chord_338_1, 2, 74, 2, 'D5', 1),
    (v_chord_338_1, 3, 66, 6, 'F#4', 1),
    (v_chord_338_1, 4, 69, 9, 'A4', 1),
    (v_chord_338_1, 5, 73, 1, 'C#5', 1),
    (v_chord_338_1, 6, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_339 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 339;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_339, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_339_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_339_0, 0, 73, 1, 'C#5', 1),
    (v_chord_339_0, 1, 70, 10, 'A#4', 1),
    (v_chord_339_0, 2, 71, 11, 'B4', 1),
    (v_chord_339_0, 3, 73, 1, 'C#5', 1),
    (v_chord_339_0, 4, 74, 2, 'D5', 1),
    (v_chord_339_0, 5, 76, 4, 'E5', 1),
    (v_chord_339_0, 6, 78, 6, 'F#5', 1),
    (v_chord_339_0, 7, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_339, 1, 'E7', 2)
  RETURNING id INTO v_chord_339_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_339_1, 0, 71, 11, 'B4', 1),
    (v_chord_339_1, 1, 69, 9, 'A4', 1),
    (v_chord_339_1, 2, 67, 7, 'F##4', 1),
    (v_chord_339_1, 3, 68, 8, 'G#4', 1),
    (v_chord_339_1, 4, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_340 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 340;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_340, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_340_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_340_0, 0, 62, 2, 'D4', 1),
    (v_chord_340_0, 1, 64, 4, 'E4', 1),
    (v_chord_340_0, 2, 66, 6, 'F#4', 1),
    (v_chord_340_0, 3, 69, 9, 'A4', 1),
    (v_chord_340_0, 4, 73, 1, 'C#5', 1),
    (v_chord_340_0, 5, 74, 2, 'D5', 1),
    (v_chord_340_0, 6, 70, 10, 'A#4', 1),
    (v_chord_340_0, 7, 73, 1, 'C#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_340, 1, 'E7', 2)
  RETURNING id INTO v_chord_340_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_340_1, 0, 71, 11, 'B4', 1),
    (v_chord_340_1, 1, 69, 9, 'A4', 1),
    (v_chord_340_1, 2, 66, 6, 'F#4', 1),
    (v_chord_340_1, 3, 67, 7, 'F##4', 1),
    (v_chord_340_1, 4, 68, 8, 'G#4', 1),
    (v_chord_340_1, 5, 66, 6, 'F#4', 1),
    (v_chord_340_1, 6, 64, 4, 'E4', 1),
    (v_chord_340_1, 7, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_341 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 341;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_341, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_341_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_341_0, 0, 68, 8, 'G#4', 1),
    (v_chord_341_0, 1, 69, 9, 'A4', 1),
    (v_chord_341_0, 2, 66, 6, 'F#4', 1),
    (v_chord_341_0, 3, 62, 2, 'D4', 1),
    (v_chord_341_0, 4, 61, 1, 'C#4', 1),
    (v_chord_341_0, 5, 62, 2, 'D4', 1),
    (v_chord_341_0, 6, 66, 6, 'F#4', 1),
    (v_chord_341_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_341, 1, 'E7', 2)
  RETURNING id INTO v_chord_341_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_341_1, 0, 73, 1, 'C#5', 1),
    (v_chord_341_1, 1, 71, 11, 'B4', 1),
    (v_chord_341_1, 2, 66, 6, 'F#4', 1),
    (v_chord_341_1, 3, 62, 2, 'D4', 1),
    (v_chord_341_1, 4, 61, 1, 'C#4', 1),
    (v_chord_341_1, 5, 59, 11, 'B3', 1);
  SELECT id INTO v_phrase_343 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 343;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_343, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_343_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_343_0, 0, 62, 2, 'D4', 1),
    (v_chord_343_0, 1, 66, 6, 'F#4', 1),
    (v_chord_343_0, 2, 69, 9, 'A4', 1),
    (v_chord_343_0, 3, 73, 1, 'C#5', 1),
    (v_chord_343_0, 4, 76, 4, 'E5', 1),
    (v_chord_343_0, 5, 74, 2, 'D5', 1),
    (v_chord_343_0, 6, 69, 9, 'A4', 1),
    (v_chord_343_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_343, 1, 'E7', 2)
  RETURNING id INTO v_chord_343_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_343_1, 0, 73, 1, 'C#5', 1),
    (v_chord_343_1, 1, 71, 11, 'B4', 1),
    (v_chord_343_1, 2, 69, 9, 'A4', 1),
    (v_chord_343_1, 3, 68, 8, 'G#4', 1),
    (v_chord_343_1, 4, 66, 6, 'F#4', 1),
    (v_chord_343_1, 5, 64, 4, 'E4', 1),
    (v_chord_343_1, 6, 63, 3, 'D#4', 1);
  SELECT id INTO v_phrase_344 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 344;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_344, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_344_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_344_0, 0, 71, 11, 'B4', 1),
    (v_chord_344_0, 1, 73, 1, 'C#5', 1),
    (v_chord_344_0, 2, 74, 2, 'D5', 1),
    (v_chord_344_0, 3, 76, 4, 'E5', 1),
    (v_chord_344_0, 4, 78, 6, 'F#5', 1),
    (v_chord_344_0, 5, 74, 2, 'D5', 1),
    (v_chord_344_0, 6, 71, 11, 'B4', 1),
    (v_chord_344_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_344, 1, 'E7', 2)
  RETURNING id INTO v_chord_344_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_344_1, 0, 70, 10, 'A#4', 1),
    (v_chord_344_1, 1, 69, 9, 'A4', 1),
    (v_chord_344_1, 2, 67, 7, 'F##4', 1),
    (v_chord_344_1, 3, 68, 8, 'G#4', 1),
    (v_chord_344_1, 4, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_345 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 345;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_345, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_345_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_345_0, 0, 64, 4, 'E4', 1),
    (v_chord_345_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_345_0, 2, 62, 2, 'D4', 1),
    (v_chord_345_0, 3, 54, 6, 'F#3', 1),
    (v_chord_345_0, 4, 57, 9, 'A3', 1),
    (v_chord_345_0, 5, 61, 1, 'C#4', 1),
    (v_chord_345_0, 6, 60, 0, 'C4', 1),
    (v_chord_345_0, 7, 58, 10, 'A#3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_345, 1, 'E7', 2)
  RETURNING id INTO v_chord_345_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_345_1, 0, 59, 11, 'B3', 1),
    (v_chord_345_1, 1, 61, 1, 'C#4', 1),
    (v_chord_345_1, 2, 62, 2, 'D4', 1),
    (v_chord_345_1, 3, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_346 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 346;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_346, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_346_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_346_0, 0, 64, 4, 'E4', 1),
    (v_chord_346_0, 1, 62, 2, 'D4', 1),
    (v_chord_346_0, 2, 64, 4, 'E4', 1),
    (v_chord_346_0, 3, 62, 2, 'D4', 1),
    (v_chord_346_0, 4, 61, 1, 'C#4', 1),
    (v_chord_346_0, 5, 62, 2, 'D4', 1),
    (v_chord_346_0, 6, 66, 6, 'F#4', 1),
    (v_chord_346_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_346, 1, 'E7', 2)
  RETURNING id INTO v_chord_346_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_346_1, 0, 73, 1, 'C#5', 1),
    (v_chord_346_1, 1, 76, 4, 'E5', 1),
    (v_chord_346_1, 2, 72, 0, 'C5', 1),
    (v_chord_346_1, 3, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_347 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 347;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_347, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_347_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_347_0, 0, 61, 1, 'C#4', 1),
    (v_chord_347_0, 1, 62, 2, 'D4', 1),
    (v_chord_347_0, 2, 66, 6, 'F#4', 1),
    (v_chord_347_0, 3, 69, 9, 'A4', 1),
    (v_chord_347_0, 4, 73, 1, 'C#5', 1),
    (v_chord_347_0, 5, 76, 4, 'E5', 1),
    (v_chord_347_0, 6, 74, 2, 'D5', 1),
    (v_chord_347_0, 7, 69, 9, 'A4', 1),
    (v_chord_347_0, 8, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_347, 1, 'E7', 2)
  RETURNING id INTO v_chord_347_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_347_1, 0, 65, 5, 'F4', 1),
    (v_chord_347_1, 1, 73, 1, 'C#5', 1);
  SELECT id INTO v_phrase_349 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 349;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_349, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_349_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_349_0, 0, 74, 2, 'D5', 1),
    (v_chord_349_0, 1, 76, 4, 'E5', 1),
    (v_chord_349_0, 2, 74, 2, 'D5', 1),
    (v_chord_349_0, 3, 73, 1, 'C#5', 1),
    (v_chord_349_0, 4, 72, 0, 'C5', 1),
    (v_chord_349_0, 5, 71, 11, 'B4', 1),
    (v_chord_349_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_349_0, 7, 69, 9, 'A4', 1),
    (v_chord_349_0, 8, 67, 7, 'F##4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_349, 1, 'E7', 2)
  RETURNING id INTO v_chord_349_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_349_1, 0, 68, 8, 'G#4', 1),
    (v_chord_349_1, 1, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_350 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 350;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_350, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_350_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_350_0, 0, 62, 2, 'D4', 1),
    (v_chord_350_0, 1, 64, 4, 'E4', 1),
    (v_chord_350_0, 2, 62, 2, 'D4', 1),
    (v_chord_350_0, 3, 61, 1, 'C#4', 1),
    (v_chord_350_0, 4, 62, 2, 'D4', 1),
    (v_chord_350_0, 5, 59, 11, 'B3', 1),
    (v_chord_350_0, 6, 61, 1, 'C#4', 1),
    (v_chord_350_0, 7, 62, 2, 'D4', 1),
    (v_chord_350_0, 8, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_350, 1, 'E7', 2)
  RETURNING id INTO v_chord_350_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_350_1, 0, 66, 6, 'F#4', 1),
    (v_chord_350_1, 1, 69, 9, 'A4', 1),
    (v_chord_350_1, 2, 66, 6, 'F#4', 1),
    (v_chord_350_1, 3, 67, 7, 'F##4', 1),
    (v_chord_350_1, 4, 68, 8, 'G#4', 1),
    (v_chord_350_1, 5, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_351 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 351;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_351, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_351_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_351_0, 0, 74, 2, 'D5', 1),
    (v_chord_351_0, 1, 69, 9, 'A4', 1),
    (v_chord_351_0, 2, 70, 10, 'A#4', 1),
    (v_chord_351_0, 3, 73, 1, 'C#5', 1),
    (v_chord_351_0, 4, 71, 11, 'B4', 1),
    (v_chord_351_0, 5, 66, 6, 'F#4', 1),
    (v_chord_351_0, 6, 69, 9, 'A4', 1),
    (v_chord_351_0, 7, 67, 7, 'F##4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_351, 1, 'E7', 2)
  RETURNING id INTO v_chord_351_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_351_1, 0, 68, 8, 'G#4', 1),
    (v_chord_351_1, 1, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_352 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 352;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_352, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_352_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_352_0, 0, 74, 2, 'D5', 1),
    (v_chord_352_0, 1, 69, 9, 'A4', 1),
    (v_chord_352_0, 2, 70, 10, 'A#4', 1),
    (v_chord_352_0, 3, 73, 1, 'C#5', 1),
    (v_chord_352_0, 4, 72, 0, 'C5', 1),
    (v_chord_352_0, 5, 70, 10, 'A#4', 1),
    (v_chord_352_0, 6, 71, 11, 'B4', 1),
    (v_chord_352_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_352, 1, 'E7', 2)
  RETURNING id INTO v_chord_352_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_352_1, 0, 69, 9, 'A4', 1),
    (v_chord_352_1, 1, 67, 7, 'F##4', 1),
    (v_chord_352_1, 2, 68, 8, 'G#4', 1),
    (v_chord_352_1, 3, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_353 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 353;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_353, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_353_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_353_0, 0, 54, 6, 'F#3', 1),
    (v_chord_353_0, 1, 57, 9, 'A3', 1),
    (v_chord_353_0, 2, 61, 1, 'C#4', 1),
    (v_chord_353_0, 3, 64, 4, 'E4', 1),
    (v_chord_353_0, 4, 61, 1, 'C#4', 1),
    (v_chord_353_0, 5, 62, 2, 'D4', 1),
    (v_chord_353_0, 6, 66, 6, 'F#4', 1),
    (v_chord_353_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_353, 1, 'E7', 2)
  RETURNING id INTO v_chord_353_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_353_1, 0, 73, 1, 'C#5', 1),
    (v_chord_353_1, 1, 71, 11, 'B4', 1),
    (v_chord_353_1, 2, 66, 6, 'F#4', 1),
    (v_chord_353_1, 3, 62, 2, 'D4', 1),
    (v_chord_353_1, 4, 61, 1, 'C#4', 1),
    (v_chord_353_1, 5, 59, 11, 'B3', 1);
  SELECT id INTO v_phrase_355 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 355;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_355, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_355_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_355_0, 0, 58, 10, 'A#3', 1),
    (v_chord_355_0, 1, 59, 11, 'B3', 1),
    (v_chord_355_0, 2, 61, 1, 'C#4', 1),
    (v_chord_355_0, 3, 62, 2, 'D4', 1),
    (v_chord_355_0, 4, 64, 4, 'E4', 1),
    (v_chord_355_0, 5, 66, 6, 'F#4', 1),
    (v_chord_355_0, 6, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_355, 1, 'E7', 2)
  RETURNING id INTO v_chord_355_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_355_1, 0, 68, 8, 'G#4', 1),
    (v_chord_355_1, 1, 69, 9, 'A4', 1),
    (v_chord_355_1, 2, 68, 8, 'G#4', 1),
    (v_chord_355_1, 3, 66, 6, 'F#4', 1),
    (v_chord_355_1, 4, 65, 5, 'F4', 1),
    (v_chord_355_1, 5, 64, 4, 'E4', 1);
  SELECT id INTO v_phrase_356 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 356;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_356, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_356_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_356_0, 0, 65, 5, 'E#4', 1),
    (v_chord_356_0, 1, 66, 6, 'F#4', 1),
    (v_chord_356_0, 2, 69, 9, 'A4', 1),
    (v_chord_356_0, 3, 73, 1, 'C#5', 1),
    (v_chord_356_0, 4, 76, 4, 'E5', 1),
    (v_chord_356_0, 5, 75, 3, 'Eb5', 1),
    (v_chord_356_0, 6, 73, 1, 'C#5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_356, 1, 'E7', 2)
  RETURNING id INTO v_chord_356_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_356_1, 0, 74, 2, 'D5', 1),
    (v_chord_356_1, 1, 66, 6, 'F#4', 1),
    (v_chord_356_1, 2, 69, 9, 'A4', 1),
    (v_chord_356_1, 3, 73, 1, 'C#5', 1),
    (v_chord_356_1, 4, 73, 1, 'C#5', 1),
    (v_chord_356_1, 5, 71, 11, 'B4', 1);
  SELECT id INTO v_phrase_357 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 357;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_357, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_357_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_357_0, 0, 60, 0, 'B#3', 1),
    (v_chord_357_0, 1, 61, 1, 'C#4', 1),
    (v_chord_357_0, 2, 64, 4, 'E4', 1),
    (v_chord_357_0, 3, 61, 1, 'C#4', 1),
    (v_chord_357_0, 4, 62, 2, 'D4', 1),
    (v_chord_357_0, 5, 66, 6, 'F#4', 1),
    (v_chord_357_0, 6, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_357, 1, 'E7', 2)
  RETURNING id INTO v_chord_357_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_357_1, 0, 73, 1, 'C#5', 1),
    (v_chord_357_1, 1, 71, 11, 'B4', 1),
    (v_chord_357_1, 2, 70, 10, 'A#4', 1),
    (v_chord_357_1, 3, 68, 8, 'G#4', 1),
    (v_chord_357_1, 4, 67, 7, 'G4', 1),
    (v_chord_357_1, 5, 65, 5, 'F4', 1),
    (v_chord_357_1, 6, 64, 4, 'E4', 1),
    (v_chord_357_1, 7, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_358 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 358;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_358, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_358_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_358_0, 0, 78, 6, 'F#5', 1),
    (v_chord_358_0, 1, 74, 2, 'D5', 1),
    (v_chord_358_0, 2, 73, 1, 'C#5', 1),
    (v_chord_358_0, 3, 71, 11, 'B4', 1),
    (v_chord_358_0, 4, 76, 4, 'E5', 1),
    (v_chord_358_0, 5, 74, 2, 'D5', 1),
    (v_chord_358_0, 6, 69, 9, 'A4', 1),
    (v_chord_358_0, 7, 66, 6, 'F#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_358, 1, 'E7', 2)
  RETURNING id INTO v_chord_358_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_358_1, 0, 70, 10, 'A#4', 1),
    (v_chord_358_1, 1, 73, 1, 'C#5', 1),
    (v_chord_358_1, 2, 72, 0, 'C5', 1),
    (v_chord_358_1, 3, 70, 10, 'A#4', 1),
    (v_chord_358_1, 4, 71, 11, 'B4', 1),
    (v_chord_358_1, 5, 73, 1, 'C#5', 1),
    (v_chord_358_1, 6, 74, 2, 'D5', 1),
    (v_chord_358_1, 7, 76, 4, 'E5', 1);
  SELECT id INTO v_phrase_359 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 359;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_359, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_359_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_359_0, 0, 59, 11, 'B3', 1),
    (v_chord_359_0, 1, 58, 10, 'A#3', 1),
    (v_chord_359_0, 2, 59, 11, 'B3', 1),
    (v_chord_359_0, 3, 61, 1, 'C#4', 1),
    (v_chord_359_0, 4, 62, 2, 'D4', 1),
    (v_chord_359_0, 5, 64, 4, 'E4', 1),
    (v_chord_359_0, 6, 66, 6, 'F#4', 1),
    (v_chord_359_0, 7, 69, 9, 'A4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_359, 1, 'E7', 2)
  RETURNING id INTO v_chord_359_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_359_1, 0, 68, 8, 'G#4', 1),
    (v_chord_359_1, 1, 69, 9, 'A4', 1),
    (v_chord_359_1, 2, 68, 8, 'G#4', 1),
    (v_chord_359_1, 3, 66, 6, 'F#4', 1),
    (v_chord_359_1, 4, 65, 5, 'F4', 1),
    (v_chord_359_1, 5, 64, 4, 'E4', 1),
    (v_chord_359_1, 6, 63, 3, 'Eb4', 1),
    (v_chord_359_1, 7, 62, 2, 'D4', 1),
    (v_chord_359_1, 8, 61, 1, 'C#4', 1);
  SELECT id INTO v_phrase_361 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 361;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_361, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_361_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_361_0, 0, 71, 11, 'B4', 1),
    (v_chord_361_0, 1, 70, 10, 'A#4', 1),
    (v_chord_361_0, 2, 71, 11, 'B4', 1),
    (v_chord_361_0, 3, 73, 1, 'C#5', 1),
    (v_chord_361_0, 4, 74, 2, 'D5', 1),
    (v_chord_361_0, 5, 76, 4, 'E5', 1),
    (v_chord_361_0, 6, 78, 6, 'F#5', 1),
    (v_chord_361_0, 7, 72, 0, 'B#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_361, 1, 'E7', 2)
  RETURNING id INTO v_chord_361_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_361_1, 0, 73, 1, 'C#5', 1),
    (v_chord_361_1, 1, 76, 4, 'E5', 1),
    (v_chord_361_1, 2, 74, 2, 'D5', 1),
    (v_chord_361_1, 3, 66, 6, 'F#4', 1),
    (v_chord_361_1, 4, 69, 9, 'A4', 1),
    (v_chord_361_1, 5, 73, 1, 'C#5', 1),
    (v_chord_361_1, 6, 72, 0, 'C5', 1),
    (v_chord_361_1, 7, 70, 10, 'A#4', 1);
  SELECT id INTO v_phrase_362 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 362;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_362, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_362_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_362_0, 0, 76, 4, 'E5', 1),
    (v_chord_362_0, 1, 74, 2, 'D5', 1),
    (v_chord_362_0, 2, 69, 9, 'A4', 1),
    (v_chord_362_0, 3, 66, 6, 'F#4', 1),
    (v_chord_362_0, 4, 70, 10, 'A#4', 1),
    (v_chord_362_0, 5, 73, 1, 'C#5', 1),
    (v_chord_362_0, 6, 72, 0, 'C5', 1),
    (v_chord_362_0, 7, 70, 10, 'A#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_362, 1, 'E7', 2)
  RETURNING id INTO v_chord_362_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_362_1, 0, 71, 11, 'B4', 1),
    (v_chord_362_1, 1, 66, 6, 'F#4', 1);
  SELECT id INTO v_phrase_363 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 363;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_363, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_363_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_363_0, 0, 68, 8, 'G#4', 1),
    (v_chord_363_0, 1, 69, 9, 'A4', 1),
    (v_chord_363_0, 2, 66, 6, 'F#4', 1),
    (v_chord_363_0, 3, 62, 2, 'D4', 1),
    (v_chord_363_0, 4, 61, 1, 'C#4', 1),
    (v_chord_363_0, 5, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_363, 1, 'E7', 2)
  RETURNING id INTO v_chord_363_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_363_1, 0, 61, 1, 'C#4', 1),
    (v_chord_363_1, 1, 62, 2, 'D4', 1),
    (v_chord_363_1, 2, 64, 4, 'E4', 1),
    (v_chord_363_1, 3, 65, 5, 'E#4', 1),
    (v_chord_363_1, 4, 68, 8, 'G#4', 1),
    (v_chord_363_1, 5, 73, 1, 'C#5', 1);
  SELECT id INTO v_phrase_364 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 364;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_364, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_364_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_364_0, 0, 68, 8, 'G#4', 1),
    (v_chord_364_0, 1, 69, 9, 'A4', 1),
    (v_chord_364_0, 2, 66, 6, 'F#4', 1),
    (v_chord_364_0, 3, 62, 2, 'D4', 1),
    (v_chord_364_0, 4, 61, 1, 'C#4', 1),
    (v_chord_364_0, 5, 59, 11, 'B3', 1),
    (v_chord_364_0, 6, 58, 10, 'A#3', 1),
    (v_chord_364_0, 7, 61, 1, 'C#4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_364, 1, 'E7', 2)
  RETURNING id INTO v_chord_364_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_364_1, 0, 59, 11, 'B3', 1),
    (v_chord_364_1, 1, 54, 6, 'F#3', 1);
  SELECT id INTO v_phrase_365 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 365;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_365, 0, 'Bm7', 1)
  RETURNING id INTO v_chord_365_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_365_0, 0, 58, 10, 'A#3', 1),
    (v_chord_365_0, 1, 59, 11, 'B3', 1),
    (v_chord_365_0, 2, 62, 2, 'D4', 1),
    (v_chord_365_0, 3, 66, 6, 'F#4', 1),
    (v_chord_365_0, 4, 69, 9, 'A4', 1),
    (v_chord_365_0, 5, 66, 6, 'F#4', 1),
    (v_chord_365_0, 6, 62, 2, 'D4', 1),
    (v_chord_365_0, 7, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_365, 1, 'E7', 2)
  RETURNING id INTO v_chord_365_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_365_1, 0, 61, 1, 'C#4', 1),
    (v_chord_365_1, 1, 64, 4, 'E4', 1);
  SELECT id INTO v_comp_336 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 336;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_336;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_336, 331, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_336, 332, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_336, 333, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_336, 334, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_336, 335, 4);
  SELECT id INTO v_comp_342 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 342;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_342;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_342, 337, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_342, 338, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_342, 339, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_342, 340, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_342, 341, 4);
  SELECT id INTO v_comp_348 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 348;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_348;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_348, 343, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_348, 344, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_348, 345, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_348, 346, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_348, 347, 4);
  SELECT id INTO v_comp_354 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 354;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_354;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_354, 349, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_354, 350, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_354, 351, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_354, 352, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_354, 353, 4);
  SELECT id INTO v_comp_360 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 360;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_360;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_360, 355, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_360, 356, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_360, 357, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_360, 358, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_360, 359, 4);
  SELECT id INTO v_comp_366 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 366;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_366;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_366, 361, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_366, 362, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_366, 363, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_366, 364, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_366, 365, 4);
END $$;

COMMIT;