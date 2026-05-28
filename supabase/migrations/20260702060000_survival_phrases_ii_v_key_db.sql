BEGIN;

-- Survival Phrases II-V key Db: stages 187-222
-- MusicXML: 251譜面_+1st_Db.musicxml.xml (30 phrases x 2 measures; first half of 4-measure source)

DELETE FROM public.survival_composite_phrase_sources
WHERE composite_id IN (
  SELECT id FROM public.survival_composite_phrase_stages
  WHERE map_category = 'phrases' AND stage_number BETWEEN 187 AND 222
);

DELETE FROM public.survival_composite_phrase_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 187 AND 222;

DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number BETWEEN 187 AND 222
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number BETWEEN 187 AND 222
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number BETWEEN 187 AND 222;

DELETE FROM public.survival_stages
WHERE map_category = 'phrases' AND stage_number BETWEEN 187 AND 222;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_db_1', 'II-V in Db 1-5', 'II-V in Db 1-5', 31)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_db_2', 'II-V in Db 6-10', 'II-V in Db 6-10', 32)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_db_3', 'II-V in Db 11-15', 'II-V in Db 11-15', 33)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_db_4', 'II-V in Db 16-20', 'II-V in Db 16-20', 34)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_db_5', 'II-V in Db 21-25', 'II-V in Db 21-25', 35)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_ii_v_db_6', 'II-V in Db 26-30', 'II-V in Db 26-30', 36)
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
  187,
  'progression',
  'II-V in Db · 1',
  'II-V in Db · 1',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  187,
  'II-V in Db · 1',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-01.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  188,
  'progression',
  'II-V in Db · 2',
  'II-V in Db · 2',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  188,
  'II-V in Db · 2',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-02.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  189,
  'progression',
  'II-V in Db · 3',
  'II-V in Db · 3',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  189,
  'II-V in Db · 3',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-03.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  190,
  'progression',
  'II-V in Db · 4',
  'II-V in Db · 4',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  190,
  'II-V in Db · 4',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-04.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  191,
  'progression',
  'II-V in Db · 5',
  'II-V in Db · 5',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  191,
  'II-V in Db · 5',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-05.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  192,
  'progression',
  '複合フレーズ · II-V in Db 1-5',
  'Composite · II-V in Db 1-5',
  'easy',
  '',
  'II-V in Db 1-5',
  'II-V in Db 1-5',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_1',
  false,
  NULL,
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
VALUES ('phrases', 192, 'B', -5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  193,
  'progression',
  'II-V in Db · 6',
  'II-V in Db · 6',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  193,
  'II-V in Db · 6',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-06.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  194,
  'progression',
  'II-V in Db · 7',
  'II-V in Db · 7',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  194,
  'II-V in Db · 7',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-07.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  195,
  'progression',
  'II-V in Db · 8',
  'II-V in Db · 8',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  195,
  'II-V in Db · 8',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-08.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  196,
  'progression',
  'II-V in Db · 9',
  'II-V in Db · 9',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  196,
  'II-V in Db · 9',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-09.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  197,
  'progression',
  'II-V in Db · 10',
  'II-V in Db · 10',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_2',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  197,
  'II-V in Db · 10',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-10.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  198,
  'progression',
  '複合フレーズ · II-V in Db 6-10',
  'Composite · II-V in Db 6-10',
  'easy',
  '',
  'II-V in Db 6-10',
  'II-V in Db 6-10',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_2',
  false,
  NULL,
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
VALUES ('phrases', 198, 'C', -5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  199,
  'progression',
  'II-V in Db · 11',
  'II-V in Db · 11',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  199,
  'II-V in Db · 11',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-11.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  200,
  'progression',
  'II-V in Db · 12',
  'II-V in Db · 12',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  200,
  'II-V in Db · 12',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-12.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  201,
  'progression',
  'II-V in Db · 13',
  'II-V in Db · 13',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  201,
  'II-V in Db · 13',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-13.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  202,
  'progression',
  'II-V in Db · 14',
  'II-V in Db · 14',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  202,
  'II-V in Db · 14',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-14.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  203,
  'progression',
  'II-V in Db · 15',
  'II-V in Db · 15',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_3',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  203,
  'II-V in Db · 15',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-15.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  204,
  'progression',
  '複合フレーズ · II-V in Db 11-15',
  'Composite · II-V in Db 11-15',
  'easy',
  '',
  'II-V in Db 11-15',
  'II-V in Db 11-15',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_3',
  false,
  NULL,
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
VALUES ('phrases', 204, 'A', -5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  205,
  'progression',
  'II-V in Db · 16',
  'II-V in Db · 16',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  205,
  'II-V in Db · 16',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-16.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  206,
  'progression',
  'II-V in Db · 17',
  'II-V in Db · 17',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  206,
  'II-V in Db · 17',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-17.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  207,
  'progression',
  'II-V in Db · 18',
  'II-V in Db · 18',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  207,
  'II-V in Db · 18',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-18.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  208,
  'progression',
  'II-V in Db · 19',
  'II-V in Db · 19',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  208,
  'II-V in Db · 19',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-19.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  209,
  'progression',
  'II-V in Db · 20',
  'II-V in Db · 20',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_4',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  209,
  'II-V in Db · 20',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-20.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  210,
  'progression',
  '複合フレーズ · II-V in Db 16-20',
  'Composite · II-V in Db 16-20',
  'easy',
  '',
  'II-V in Db 16-20',
  'II-V in Db 16-20',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_4',
  false,
  NULL,
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
VALUES ('phrases', 210, 'B', -5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  211,
  'progression',
  'II-V in Db · 21',
  'II-V in Db · 21',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  211,
  'II-V in Db · 21',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-21.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  212,
  'progression',
  'II-V in Db · 22',
  'II-V in Db · 22',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  212,
  'II-V in Db · 22',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-22.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  213,
  'progression',
  'II-V in Db · 23',
  'II-V in Db · 23',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  213,
  'II-V in Db · 23',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-23.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  214,
  'progression',
  'II-V in Db · 24',
  'II-V in Db · 24',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  214,
  'II-V in Db · 24',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-24.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  215,
  'progression',
  'II-V in Db · 25',
  'II-V in Db · 25',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_5',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  215,
  'II-V in Db · 25',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-25.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  216,
  'progression',
  '複合フレーズ · II-V in Db 21-25',
  'Composite · II-V in Db 21-25',
  'easy',
  '',
  'II-V in Db 21-25',
  'II-V in Db 21-25',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_5',
  false,
  NULL,
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
VALUES ('phrases', 216, 'C', -5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
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
  217,
  'progression',
  'II-V in Db · 26',
  'II-V in Db · 26',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  217,
  'II-V in Db · 26',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-26.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  218,
  'progression',
  'II-V in Db · 27',
  'II-V in Db · 27',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  218,
  'II-V in Db · 27',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-27.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  219,
  'progression',
  'II-V in Db · 28',
  'II-V in Db · 28',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  219,
  'II-V in Db · 28',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-28.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  220,
  'progression',
  'II-V in Db · 29',
  'II-V in Db · 29',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  220,
  'II-V in Db · 29',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-29.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  221,
  'progression',
  'II-V in Db · 30',
  'II-V in Db · 30',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_6',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  221,
  'II-V in Db · 30',
  'https://jazzify-cdn.com/fantasy-bgm/survival-phrases-ii-v-db-30.mp3',
  -5
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  title = EXCLUDED.title,
  bgm_url = EXCLUDED.bgm_url,
  key_fifths = EXCLUDED.key_fifths,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  222,
  'progression',
  '複合フレーズ · II-V in Db 26-30',
  'Composite · II-V in Db 26-30',
  'easy',
  '',
  'II-V in Db 26-30',
  'II-V in Db 26-30',
  NULL,
  NULL,
  NULL,
  'phrases_ii_v_db_6',
  false,
  NULL,
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
VALUES ('phrases', 222, 'A', -5, 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3')
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths,
  bgm_url = EXCLUDED.bgm_url, updated_at = now();

DO $$
DECLARE
  v_phrase_187 uuid;
  v_chord_187_0 uuid;
  v_chord_187_1 uuid;
  v_phrase_188 uuid;
  v_chord_188_0 uuid;
  v_chord_188_1 uuid;
  v_phrase_189 uuid;
  v_chord_189_0 uuid;
  v_chord_189_1 uuid;
  v_phrase_190 uuid;
  v_chord_190_0 uuid;
  v_chord_190_1 uuid;
  v_phrase_191 uuid;
  v_chord_191_0 uuid;
  v_chord_191_1 uuid;
  v_phrase_193 uuid;
  v_chord_193_0 uuid;
  v_chord_193_1 uuid;
  v_phrase_194 uuid;
  v_chord_194_0 uuid;
  v_chord_194_1 uuid;
  v_phrase_195 uuid;
  v_chord_195_0 uuid;
  v_chord_195_1 uuid;
  v_phrase_196 uuid;
  v_chord_196_0 uuid;
  v_chord_196_1 uuid;
  v_phrase_197 uuid;
  v_chord_197_0 uuid;
  v_chord_197_1 uuid;
  v_phrase_199 uuid;
  v_chord_199_0 uuid;
  v_chord_199_1 uuid;
  v_phrase_200 uuid;
  v_chord_200_0 uuid;
  v_chord_200_1 uuid;
  v_phrase_201 uuid;
  v_chord_201_0 uuid;
  v_chord_201_1 uuid;
  v_phrase_202 uuid;
  v_chord_202_0 uuid;
  v_chord_202_1 uuid;
  v_phrase_203 uuid;
  v_chord_203_0 uuid;
  v_chord_203_1 uuid;
  v_phrase_205 uuid;
  v_chord_205_0 uuid;
  v_chord_205_1 uuid;
  v_phrase_206 uuid;
  v_chord_206_0 uuid;
  v_chord_206_1 uuid;
  v_phrase_207 uuid;
  v_chord_207_0 uuid;
  v_chord_207_1 uuid;
  v_phrase_208 uuid;
  v_chord_208_0 uuid;
  v_chord_208_1 uuid;
  v_phrase_209 uuid;
  v_chord_209_0 uuid;
  v_chord_209_1 uuid;
  v_phrase_211 uuid;
  v_chord_211_0 uuid;
  v_chord_211_1 uuid;
  v_phrase_212 uuid;
  v_chord_212_0 uuid;
  v_chord_212_1 uuid;
  v_phrase_213 uuid;
  v_chord_213_0 uuid;
  v_chord_213_1 uuid;
  v_phrase_214 uuid;
  v_chord_214_0 uuid;
  v_chord_214_1 uuid;
  v_phrase_215 uuid;
  v_chord_215_0 uuid;
  v_chord_215_1 uuid;
  v_phrase_217 uuid;
  v_chord_217_0 uuid;
  v_chord_217_1 uuid;
  v_phrase_218 uuid;
  v_chord_218_0 uuid;
  v_chord_218_1 uuid;
  v_phrase_219 uuid;
  v_chord_219_0 uuid;
  v_chord_219_1 uuid;
  v_phrase_220 uuid;
  v_chord_220_0 uuid;
  v_chord_220_1 uuid;
  v_phrase_221 uuid;
  v_chord_221_0 uuid;
  v_chord_221_1 uuid;
  v_comp_192 uuid;
  v_comp_198 uuid;
  v_comp_204 uuid;
  v_comp_210 uuid;
  v_comp_216 uuid;
  v_comp_222 uuid;
BEGIN
  SELECT id INTO v_phrase_187 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 187;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_187, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_187_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_187_0, 0, 77, 5, 'F5', 1),
    (v_chord_187_0, 1, 73, 1, 'Db5', 1),
    (v_chord_187_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_187_0, 3, 66, 6, 'Gb4', 1),
    (v_chord_187_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_187_0, 5, 73, 1, 'Db5', 1),
    (v_chord_187_0, 6, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_187, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_187_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_187_1, 0, 80, 8, 'Ab5', 1),
    (v_chord_187_1, 1, 78, 6, 'Gb5', 1),
    (v_chord_187_1, 2, 73, 1, 'Db5', 1),
    (v_chord_187_1, 3, 70, 10, 'Bb4', 1),
    (v_chord_187_1, 4, 77, 5, 'F5', 1),
    (v_chord_187_1, 5, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_188 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 188;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_188, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_188_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_188_0, 0, 64, 4, 'E4', 1),
    (v_chord_188_0, 1, 65, 5, 'F4', 1),
    (v_chord_188_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_188_0, 3, 65, 5, 'F4', 1),
    (v_chord_188_0, 4, 66, 6, 'Gb4', 1),
    (v_chord_188_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_188_0, 6, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_188, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_188_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_188_1, 0, 77, 5, 'F5', 1),
    (v_chord_188_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_188_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_188_1, 3, 66, 6, 'Gb4', 1),
    (v_chord_188_1, 4, 65, 5, 'F4', 1),
    (v_chord_188_1, 5, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_189 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 189;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_189, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_189_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_189_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_189_0, 1, 65, 5, 'F4', 1),
    (v_chord_189_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_189_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_189_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_189_0, 5, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_189, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_189_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_189_1, 0, 72, 0, 'C5', 1),
    (v_chord_189_1, 1, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_190 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 190;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_190, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_190_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_190_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_190_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_190_0, 2, 61, 1, 'Db4', 1),
    (v_chord_190_0, 3, 58, 10, 'Bb3', 1),
    (v_chord_190_0, 4, 65, 5, 'F4', 1),
    (v_chord_190_0, 5, 62, 2, 'D4', 1),
    (v_chord_190_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_190_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_190, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_190_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_190_1, 0, 66, 6, 'Gb4', 1),
    (v_chord_190_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_190_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_190_1, 3, 66, 6, 'Gb4', 1),
    (v_chord_190_1, 4, 65, 5, 'F4', 1),
    (v_chord_190_1, 5, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_191 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 191;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_191, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_191_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_191_0, 0, 66, 6, 'Gb4', 1),
    (v_chord_191_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_191_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_191_0, 3, 66, 6, 'Gb4', 1),
    (v_chord_191_0, 4, 65, 5, 'F4', 1),
    (v_chord_191_0, 5, 63, 3, 'Eb4', 1),
    (v_chord_191_0, 6, 62, 2, 'D4', 1),
    (v_chord_191_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_191, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_191_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_191_1, 0, 63, 3, 'Eb4', 1),
    (v_chord_191_1, 1, 61, 1, 'Db4', 1),
    (v_chord_191_1, 2, 59, 11, 'B3', 1),
    (v_chord_191_1, 3, 60, 0, 'C4', 1),
    (v_chord_191_1, 4, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_193 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 193;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_193, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_193_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_193_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_193_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_193_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_193_0, 3, 73, 1, 'Db5', 1),
    (v_chord_193_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_193_0, 5, 71, 11, 'B4', 1),
    (v_chord_193_0, 6, 72, 0, 'C5', 1),
    (v_chord_193_0, 7, 63, 3, 'Eb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_193, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_193_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_193_1, 0, 66, 6, 'Gb4', 1),
    (v_chord_193_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_193_1, 2, 69, 9, 'Bbb4', 1),
    (v_chord_193_1, 3, 67, 7, 'G4', 1),
    (v_chord_193_1, 4, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_194 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 194;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_194, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_194_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_194_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_194_0, 1, 65, 5, 'F4', 1),
    (v_chord_194_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_194_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_194_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_194_0, 5, 72, 0, 'C5', 1),
    (v_chord_194_0, 6, 73, 1, 'Db5', 1),
    (v_chord_194_0, 7, 75, 3, 'Eb5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_194, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_194_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_194_1, 0, 77, 5, 'F5', 1),
    (v_chord_194_1, 1, 80, 8, 'Ab5', 1),
    (v_chord_194_1, 2, 78, 6, 'Gb5', 1),
    (v_chord_194_1, 3, 70, 10, 'Bb4', 1),
    (v_chord_194_1, 4, 73, 1, 'Db5', 1),
    (v_chord_194_1, 5, 77, 5, 'F5', 1),
    (v_chord_194_1, 6, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_195 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 195;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_195, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_195_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_195_0, 0, 65, 5, 'F4', 1),
    (v_chord_195_0, 1, 62, 2, 'D4', 1),
    (v_chord_195_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_195_0, 3, 65, 5, 'F4', 1),
    (v_chord_195_0, 4, 66, 6, 'Gb4', 1),
    (v_chord_195_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_195_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_195_0, 7, 66, 6, 'Gb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_195, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_195_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_195_1, 0, 63, 3, 'Eb4', 1),
    (v_chord_195_1, 1, 61, 1, 'Db4', 1),
    (v_chord_195_1, 2, 59, 11, 'B3', 1),
    (v_chord_195_1, 3, 60, 0, 'C4', 1),
    (v_chord_195_1, 4, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_196 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 196;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_196, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_196_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_196_0, 0, 66, 6, 'Gb4', 1),
    (v_chord_196_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_196_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_196_0, 3, 73, 1, 'Db5', 1),
    (v_chord_196_0, 4, 77, 5, 'F5', 1),
    (v_chord_196_0, 5, 78, 6, 'Gb5', 1),
    (v_chord_196_0, 6, 74, 2, 'D5', 1),
    (v_chord_196_0, 7, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_196, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_196_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_196_1, 0, 75, 3, 'Eb5', 1),
    (v_chord_196_1, 1, 73, 1, 'Db5', 1),
    (v_chord_196_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_196_1, 3, 71, 11, 'B4', 1),
    (v_chord_196_1, 4, 72, 0, 'C5', 1),
    (v_chord_196_1, 5, 70, 10, 'Bb4', 1),
    (v_chord_196_1, 6, 68, 8, 'Ab4', 1),
    (v_chord_196_1, 7, 67, 7, 'Abb4', 1);
  SELECT id INTO v_phrase_197 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 197;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_197, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_197_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_197_0, 0, 72, 0, 'C5', 1),
    (v_chord_197_0, 1, 73, 1, 'Db5', 1),
    (v_chord_197_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_197_0, 3, 66, 6, 'Gb4', 1),
    (v_chord_197_0, 4, 65, 5, 'F4', 1),
    (v_chord_197_0, 5, 66, 6, 'Gb4', 1),
    (v_chord_197_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_197_0, 7, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_197, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_197_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_197_1, 0, 77, 5, 'F5', 1),
    (v_chord_197_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_197_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_197_1, 3, 66, 6, 'Gb4', 1),
    (v_chord_197_1, 4, 65, 5, 'F4', 1),
    (v_chord_197_1, 5, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_199 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 199;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_199, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_199_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_199_0, 0, 66, 6, 'Gb4', 1),
    (v_chord_199_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_199_0, 2, 73, 1, 'Db5', 1),
    (v_chord_199_0, 3, 77, 5, 'F5', 1),
    (v_chord_199_0, 4, 80, 8, 'Ab5', 1),
    (v_chord_199_0, 5, 78, 6, 'Gb5', 1),
    (v_chord_199_0, 6, 73, 1, 'Db5', 1),
    (v_chord_199_0, 7, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_199, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_199_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_199_1, 0, 77, 5, 'F5', 1),
    (v_chord_199_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_199_1, 2, 73, 1, 'Db5', 1),
    (v_chord_199_1, 3, 72, 0, 'C5', 1),
    (v_chord_199_1, 4, 70, 10, 'Bb4', 1),
    (v_chord_199_1, 5, 68, 8, 'Ab4', 1),
    (v_chord_199_1, 6, 67, 7, 'G4', 1);
  SELECT id INTO v_phrase_200 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 200;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_200, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_200_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_200_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_200_0, 1, 65, 5, 'F4', 1),
    (v_chord_200_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_200_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_200_0, 4, 70, 10, 'Bb4', 1),
    (v_chord_200_0, 5, 66, 6, 'Gb4', 1),
    (v_chord_200_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_200_0, 7, 58, 10, 'Bb3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_200, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_200_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_200_1, 0, 62, 2, 'D4', 1),
    (v_chord_200_1, 1, 61, 1, 'Db4', 1),
    (v_chord_200_1, 2, 59, 11, 'B3', 1),
    (v_chord_200_1, 3, 60, 0, 'C4', 1),
    (v_chord_200_1, 4, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_201 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 201;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_201, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_201_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_201_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_201_0, 1, 67, 7, 'Abb4', 1),
    (v_chord_201_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_201_0, 3, 58, 10, 'Bb3', 1),
    (v_chord_201_0, 4, 61, 1, 'Db4', 1),
    (v_chord_201_0, 5, 65, 5, 'F4', 1),
    (v_chord_201_0, 6, 64, 4, 'Fb4', 1),
    (v_chord_201_0, 7, 62, 2, 'D4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_201, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_201_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_201_1, 0, 63, 3, 'Eb4', 1),
    (v_chord_201_1, 1, 65, 5, 'F4', 1),
    (v_chord_201_1, 2, 66, 6, 'Gb4', 1),
    (v_chord_201_1, 3, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_202 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 202;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_202, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_202_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_202_0, 0, 68, 8, 'Ab4', 1),
    (v_chord_202_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_202_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_202_0, 3, 66, 6, 'Gb4', 1),
    (v_chord_202_0, 4, 65, 5, 'F4', 1),
    (v_chord_202_0, 5, 66, 6, 'Gb4', 1),
    (v_chord_202_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_202_0, 7, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_202, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_202_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_202_1, 0, 77, 5, 'F5', 1),
    (v_chord_202_1, 1, 80, 8, 'Ab5', 1),
    (v_chord_202_1, 2, 76, 4, 'Fb5', 1),
    (v_chord_202_1, 3, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_203 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 203;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_203, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_203_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_203_0, 0, 65, 5, 'F4', 1),
    (v_chord_203_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_203_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_203_0, 3, 73, 1, 'Db5', 1),
    (v_chord_203_0, 4, 77, 5, 'F5', 1),
    (v_chord_203_0, 5, 80, 8, 'Ab5', 1),
    (v_chord_203_0, 6, 78, 6, 'Gb5', 1),
    (v_chord_203_0, 7, 73, 1, 'Db5', 1),
    (v_chord_203_0, 8, 70, 10, 'Bb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_203, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_203_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_203_1, 0, 69, 9, 'Bbb4', 1),
    (v_chord_203_1, 1, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_205 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 205;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_205, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_205_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_205_0, 0, 66, 6, 'Gb4', 1),
    (v_chord_205_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_205_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_205_0, 3, 65, 5, 'F4', 1),
    (v_chord_205_0, 4, 64, 4, 'Fb4', 1),
    (v_chord_205_0, 5, 63, 3, 'Eb4', 1),
    (v_chord_205_0, 6, 62, 2, 'Ebb4', 1),
    (v_chord_205_0, 7, 61, 1, 'Db4', 1),
    (v_chord_205_0, 8, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_205, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_205_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_205_1, 0, 60, 0, 'C4', 1),
    (v_chord_205_1, 1, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_206 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 206;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_206, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_206_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_206_0, 0, 66, 6, 'Gb4', 1),
    (v_chord_206_0, 1, 68, 8, 'Ab4', 1),
    (v_chord_206_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_206_0, 3, 65, 5, 'F4', 1),
    (v_chord_206_0, 4, 66, 6, 'Gb4', 1),
    (v_chord_206_0, 5, 63, 3, 'Eb4', 1),
    (v_chord_206_0, 6, 65, 5, 'F4', 1),
    (v_chord_206_0, 7, 66, 6, 'Gb4', 1),
    (v_chord_206_0, 8, 68, 8, 'Ab4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_206, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_206_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_206_1, 0, 70, 10, 'Bb4', 1),
    (v_chord_206_1, 1, 73, 1, 'Db5', 1),
    (v_chord_206_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_206_1, 3, 71, 11, 'B4', 1),
    (v_chord_206_1, 4, 72, 0, 'C5', 1),
    (v_chord_206_1, 5, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_207 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 207;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_207, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_207_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_207_0, 0, 66, 6, 'Gb4', 1),
    (v_chord_207_0, 1, 61, 1, 'Db4', 1),
    (v_chord_207_0, 2, 62, 2, 'D4', 1),
    (v_chord_207_0, 3, 65, 5, 'F4', 1),
    (v_chord_207_0, 4, 63, 3, 'Eb4', 1),
    (v_chord_207_0, 5, 58, 10, 'Bb3', 1),
    (v_chord_207_0, 6, 61, 1, 'Db4', 1),
    (v_chord_207_0, 7, 59, 11, 'B3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_207, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_207_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_207_1, 0, 60, 0, 'C4', 1),
    (v_chord_207_1, 1, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_208 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 208;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_208, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_208_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_208_0, 0, 66, 6, 'Gb4', 1),
    (v_chord_208_0, 1, 61, 1, 'Db4', 1),
    (v_chord_208_0, 2, 62, 2, 'D4', 1),
    (v_chord_208_0, 3, 65, 5, 'F4', 1),
    (v_chord_208_0, 4, 64, 4, 'Fb4', 1),
    (v_chord_208_0, 5, 62, 2, 'D4', 1),
    (v_chord_208_0, 6, 63, 3, 'Eb4', 1),
    (v_chord_208_0, 7, 58, 10, 'Bb3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_208, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_208_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_208_1, 0, 61, 1, 'Db4', 1),
    (v_chord_208_1, 1, 59, 11, 'B3', 1),
    (v_chord_208_1, 2, 60, 0, 'C4', 1),
    (v_chord_208_1, 3, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_209 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 209;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_209, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_209_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_209_0, 0, 58, 10, 'Bb3', 1),
    (v_chord_209_0, 1, 61, 1, 'Db4', 1),
    (v_chord_209_0, 2, 65, 5, 'F4', 1),
    (v_chord_209_0, 3, 68, 8, 'Ab4', 1),
    (v_chord_209_0, 4, 65, 5, 'F4', 1),
    (v_chord_209_0, 5, 66, 6, 'Gb4', 1),
    (v_chord_209_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_209_0, 7, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_209, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_209_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_209_1, 0, 77, 5, 'F5', 1),
    (v_chord_209_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_209_1, 2, 70, 10, 'Bb4', 1),
    (v_chord_209_1, 3, 66, 6, 'Gb4', 1),
    (v_chord_209_1, 4, 65, 5, 'F4', 1),
    (v_chord_209_1, 5, 63, 3, 'Eb4', 1);
  SELECT id INTO v_phrase_211 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 211;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_211, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_211_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_211_0, 0, 62, 2, 'D4', 1),
    (v_chord_211_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_211_0, 2, 65, 5, 'F4', 1),
    (v_chord_211_0, 3, 66, 6, 'Gb4', 1),
    (v_chord_211_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_211_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_211_0, 6, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_211, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_211_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_211_1, 0, 72, 0, 'C5', 1),
    (v_chord_211_1, 1, 73, 1, 'Db5', 1),
    (v_chord_211_1, 2, 72, 0, 'C5', 1),
    (v_chord_211_1, 3, 70, 10, 'Bb4', 1),
    (v_chord_211_1, 4, 69, 9, 'Bbb4', 1),
    (v_chord_211_1, 5, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_212 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 212;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_212, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_212_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_212_0, 0, 69, 9, 'A4', 1),
    (v_chord_212_0, 1, 70, 10, 'Bb4', 1),
    (v_chord_212_0, 2, 73, 1, 'Db5', 1),
    (v_chord_212_0, 3, 77, 5, 'F5', 1),
    (v_chord_212_0, 4, 80, 8, 'Ab5', 1),
    (v_chord_212_0, 5, 79, 7, 'Abb5', 1),
    (v_chord_212_0, 6, 77, 5, 'F5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_212, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_212_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_212_1, 0, 78, 6, 'Gb5', 1),
    (v_chord_212_1, 1, 70, 10, 'Bb4', 1),
    (v_chord_212_1, 2, 73, 1, 'Db5', 1),
    (v_chord_212_1, 3, 77, 5, 'F5', 1),
    (v_chord_212_1, 4, 77, 5, 'F5', 1),
    (v_chord_212_1, 5, 75, 3, 'Eb5', 1);
  SELECT id INTO v_phrase_213 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 213;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_213, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_213_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_213_0, 0, 64, 4, 'E4', 1),
    (v_chord_213_0, 1, 65, 5, 'F4', 1),
    (v_chord_213_0, 2, 68, 8, 'Ab4', 1),
    (v_chord_213_0, 3, 65, 5, 'F4', 1),
    (v_chord_213_0, 4, 66, 6, 'Gb4', 1),
    (v_chord_213_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_213_0, 6, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_213, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_213_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_213_1, 0, 77, 5, 'F5', 1),
    (v_chord_213_1, 1, 75, 3, 'Eb5', 1),
    (v_chord_213_1, 2, 74, 2, 'D5', 1),
    (v_chord_213_1, 3, 72, 0, 'C5', 1),
    (v_chord_213_1, 4, 71, 11, 'Cb5', 1),
    (v_chord_213_1, 5, 69, 9, 'Bbb4', 1),
    (v_chord_213_1, 6, 68, 8, 'Ab4', 1),
    (v_chord_213_1, 7, 66, 6, 'Gb4', 1);
  SELECT id INTO v_phrase_214 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 214;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_214, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_214_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_214_0, 0, 70, 10, 'Bb4', 1),
    (v_chord_214_0, 1, 66, 6, 'Gb4', 1),
    (v_chord_214_0, 2, 65, 5, 'F4', 1),
    (v_chord_214_0, 3, 63, 3, 'Eb4', 1),
    (v_chord_214_0, 4, 68, 8, 'Ab4', 1),
    (v_chord_214_0, 5, 66, 6, 'Gb4', 1),
    (v_chord_214_0, 6, 61, 1, 'Db4', 1),
    (v_chord_214_0, 7, 58, 10, 'Bb3', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_214, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_214_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_214_1, 0, 62, 2, 'D4', 1),
    (v_chord_214_1, 1, 65, 5, 'F4', 1),
    (v_chord_214_1, 2, 64, 4, 'Fb4', 1),
    (v_chord_214_1, 3, 62, 2, 'D4', 1),
    (v_chord_214_1, 4, 63, 3, 'Eb4', 1),
    (v_chord_214_1, 5, 65, 5, 'F4', 1),
    (v_chord_214_1, 6, 66, 6, 'Gb4', 1),
    (v_chord_214_1, 7, 68, 8, 'Ab4', 1);
  SELECT id INTO v_phrase_215 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 215;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_215, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_215_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_215_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_215_0, 1, 62, 2, 'D4', 1),
    (v_chord_215_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_215_0, 3, 65, 5, 'F4', 1),
    (v_chord_215_0, 4, 66, 6, 'Gb4', 1),
    (v_chord_215_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_215_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_215_0, 7, 73, 1, 'Db5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_215, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_215_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_215_1, 0, 72, 0, 'C5', 1),
    (v_chord_215_1, 1, 73, 1, 'Db5', 1),
    (v_chord_215_1, 2, 72, 0, 'C5', 1),
    (v_chord_215_1, 3, 70, 10, 'Bb4', 1),
    (v_chord_215_1, 4, 69, 9, 'Bbb4', 1),
    (v_chord_215_1, 5, 68, 8, 'Ab4', 1),
    (v_chord_215_1, 6, 67, 7, 'Abb4', 1),
    (v_chord_215_1, 7, 66, 6, 'Gb4', 1),
    (v_chord_215_1, 8, 65, 5, 'F4', 1);
  SELECT id INTO v_phrase_217 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 217;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_217, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_217_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_217_0, 0, 63, 3, 'Eb4', 1),
    (v_chord_217_0, 1, 62, 2, 'D4', 1),
    (v_chord_217_0, 2, 63, 3, 'Eb4', 1),
    (v_chord_217_0, 3, 65, 5, 'F4', 1),
    (v_chord_217_0, 4, 66, 6, 'Gb4', 1),
    (v_chord_217_0, 5, 68, 8, 'Ab4', 1),
    (v_chord_217_0, 6, 70, 10, 'Bb4', 1),
    (v_chord_217_0, 7, 64, 4, 'E4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_217, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_217_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_217_1, 0, 65, 5, 'F4', 1),
    (v_chord_217_1, 1, 68, 8, 'Ab4', 1),
    (v_chord_217_1, 2, 66, 6, 'Gb4', 1),
    (v_chord_217_1, 3, 58, 10, 'Bb3', 1),
    (v_chord_217_1, 4, 61, 1, 'Db4', 1),
    (v_chord_217_1, 5, 65, 5, 'F4', 1),
    (v_chord_217_1, 6, 64, 4, 'Fb4', 1),
    (v_chord_217_1, 7, 62, 2, 'D4', 1);
  SELECT id INTO v_phrase_218 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 218;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_218, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_218_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_218_0, 0, 80, 8, 'Ab5', 1),
    (v_chord_218_0, 1, 78, 6, 'Gb5', 1),
    (v_chord_218_0, 2, 73, 1, 'Db5', 1),
    (v_chord_218_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_218_0, 4, 74, 2, 'D5', 1),
    (v_chord_218_0, 5, 77, 5, 'F5', 1),
    (v_chord_218_0, 6, 76, 4, 'Fb5', 1),
    (v_chord_218_0, 7, 74, 2, 'D5', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_218, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_218_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_218_1, 0, 75, 3, 'Eb5', 1),
    (v_chord_218_1, 1, 70, 10, 'Bb4', 1);
  SELECT id INTO v_phrase_219 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 219;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_219, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_219_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_219_0, 0, 72, 0, 'C5', 1),
    (v_chord_219_0, 1, 73, 1, 'Db5', 1),
    (v_chord_219_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_219_0, 3, 66, 6, 'Gb4', 1),
    (v_chord_219_0, 4, 65, 5, 'F4', 1),
    (v_chord_219_0, 5, 63, 3, 'Eb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_219, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_219_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_219_1, 0, 65, 5, 'F4', 1),
    (v_chord_219_1, 1, 66, 6, 'Gb4', 1),
    (v_chord_219_1, 2, 68, 8, 'Ab4', 1),
    (v_chord_219_1, 3, 69, 9, 'A4', 1),
    (v_chord_219_1, 4, 72, 0, 'C5', 1),
    (v_chord_219_1, 5, 77, 5, 'F5', 1);
  SELECT id INTO v_phrase_220 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 220;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_220, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_220_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_220_0, 0, 72, 0, 'C5', 1),
    (v_chord_220_0, 1, 73, 1, 'Db5', 1),
    (v_chord_220_0, 2, 70, 10, 'Bb4', 1),
    (v_chord_220_0, 3, 66, 6, 'Gb4', 1),
    (v_chord_220_0, 4, 65, 5, 'F4', 1),
    (v_chord_220_0, 5, 63, 3, 'Eb4', 1),
    (v_chord_220_0, 6, 62, 2, 'D4', 1),
    (v_chord_220_0, 7, 65, 5, 'F4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_220, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_220_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_220_1, 0, 63, 3, 'Eb4', 1),
    (v_chord_220_1, 1, 58, 10, 'Bb3', 1);
  SELECT id INTO v_phrase_221 FROM public.survival_phrases WHERE map_category = 'phrases' AND stage_number = 221;
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_221, 0, 'Ebm7', 1)
  RETURNING id INTO v_chord_221_0;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_221_0, 0, 62, 2, 'D4', 1),
    (v_chord_221_0, 1, 63, 3, 'Eb4', 1),
    (v_chord_221_0, 2, 66, 6, 'Gb4', 1),
    (v_chord_221_0, 3, 70, 10, 'Bb4', 1),
    (v_chord_221_0, 4, 73, 1, 'Db5', 1),
    (v_chord_221_0, 5, 70, 10, 'Bb4', 1),
    (v_chord_221_0, 6, 66, 6, 'Gb4', 1),
    (v_chord_221_0, 7, 63, 3, 'Eb4', 1);
  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_221, 1, 'Ab7', 2)
  RETURNING id INTO v_chord_221_1;
  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_chord_221_1, 0, 65, 5, 'F4', 1),
    (v_chord_221_1, 1, 68, 8, 'Ab4', 1);
  SELECT id INTO v_comp_192 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 192;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_192;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_192, 187, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_192, 188, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_192, 189, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_192, 190, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_192, 191, 4);
  SELECT id INTO v_comp_198 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 198;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_198;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_198, 193, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_198, 194, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_198, 195, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_198, 196, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_198, 197, 4);
  SELECT id INTO v_comp_204 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 204;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_204;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_204, 199, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_204, 200, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_204, 201, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_204, 202, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_204, 203, 4);
  SELECT id INTO v_comp_210 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 210;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_210;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_210, 205, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_210, 206, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_210, 207, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_210, 208, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_210, 209, 4);
  SELECT id INTO v_comp_216 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 216;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_216;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_216, 211, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_216, 212, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_216, 213, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_216, 214, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_216, 215, 4);
  SELECT id INTO v_comp_222 FROM public.survival_composite_phrase_stages WHERE map_category = 'phrases' AND stage_number = 222;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_222;
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_222, 217, 0);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_222, 218, 1);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_222, 219, 2);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_222, 220, 3);
  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES (v_comp_222, 221, 4);
END $$;

COMMIT;