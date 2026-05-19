-- Lesson-only survival stages (hidden from descent map), lesson_songs.survival_map_category
BEGIN;

ALTER TABLE public.survival_stages
  ADD COLUMN IF NOT EXISTS lesson_only boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.survival_stages.lesson_only IS 'True when the stage is bound via lessons only and omitted from the public descent map UI.';

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS survival_map_category text NULL;

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_survival_map_category_check;
ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_survival_map_category_check
  CHECK (
    survival_map_category IS NULL
    OR survival_map_category IN ('basic', 'songs', 'phrases', 'lesson')
  );

COMMENT ON COLUMN public.lesson_songs.survival_map_category IS 'Survival map_category for survival_stage_number (PK with stage_number). NULL = basic (legacy).';

ALTER TABLE public.survival_stage_blocks
  DROP CONSTRAINT IF EXISTS survival_stage_blocks_map_category_check;

ALTER TABLE public.survival_stage_blocks
  ADD CONSTRAINT survival_stage_blocks_map_category_check
  CHECK (map_category IN ('basic', 'songs', 'phrases', 'lesson'));

ALTER TABLE public.survival_stages
  DROP CONSTRAINT IF EXISTS survival_stages_map_category_check;

ALTER TABLE public.survival_stages
  ADD CONSTRAINT survival_stages_map_category_check
  CHECK (map_category IN ('basic', 'songs', 'phrases', 'lesson'));

ALTER TABLE public.survival_stage_clears
  DROP CONSTRAINT IF EXISTS survival_stage_clears_map_category_check;

ALTER TABLE public.survival_stage_clears
  ADD CONSTRAINT survival_stage_clears_map_category_check
  CHECK (map_category IN ('basic', 'songs', 'phrases', 'lesson'));

ALTER TABLE public.survival_stage_progress
  DROP CONSTRAINT IF EXISTS survival_stage_progress_map_category_check;

ALTER TABLE public.survival_stage_progress
  ADD CONSTRAINT survival_stage_progress_map_category_check
  CHECK (map_category IN ('basic', 'songs', 'phrases', 'lesson'));

ALTER TABLE public.survival_phrases
  DROP CONSTRAINT IF EXISTS survival_phrases_map_category_check;

ALTER TABLE public.survival_phrases
  ADD CONSTRAINT survival_phrases_map_category_check
  CHECK (map_category IN ('basic', 'songs', 'phrases', 'lesson'));

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('lesson', 'lesson_practice', 'レッスン', 'Lesson', 0)
ON CONFLICT (map_category, block_key) DO UPDATE
SET label = EXCLUDED.label,
    label_en = EXCLUDED.label_en,
    sort_order = EXCLUDED.sort_order;

INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression, lesson_only
) VALUES (
  'lesson',
  1,
  'random',
  'レッスン: メジャー CDE',
  'Lesson: Major CDE',
  'easy',
  '',
  'メジャー',
  'Major',
  'cde',
  'CDE',
  'CDE',
  'lesson_practice',
  false,
  NULL,
  NULL,
  true
), (
  'lesson',
  2,
  'progression',
  'レッスン: II-V-I',
  'Lesson: II-V-I',
  'easy',
  '',
  'II-V-I',
  'II-V-I',
  NULL,
  NULL,
  NULL,
  'lesson_practice',
  false,
  NULL,
  '[{"name":"Dm7","voicing":[50,53,57,60]},{"name":"G7","voicing":[55,59,62,65]},{"name":"CM7","voicing":[48,52,55,59]}]'::jsonb,
  true
)
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  chord_suffix = EXCLUDED.chord_suffix,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  root_pattern = EXCLUDED.root_pattern,
  root_pattern_name = EXCLUDED.root_pattern_name,
  root_pattern_name_en = EXCLUDED.root_pattern_name_en,
  block_key = EXCLUDED.block_key,
  is_mixed_stage = EXCLUDED.is_mixed_stage,
  mixed_group_key = EXCLUDED.mixed_group_key,
  chord_progression = EXCLUDED.chord_progression,
  lesson_only = EXCLUDED.lesson_only,
  updated_at = now();

COMMIT;
