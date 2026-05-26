-- Lesson survival: inline composite phrase config + per-task overrides (random/progression/composite)
BEGIN;

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS survival_composite_config jsonb DEFAULT NULL;

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS survival_lesson_overrides jsonb DEFAULT NULL;

COMMENT ON COLUMN public.lesson_songs.survival_composite_config IS
  'Inline composite phrase boss definition for lesson tasks (note names). When set, survival_stage_number may be NULL.';

COMMENT ON COLUMN public.lesson_songs.survival_lesson_overrides IS
  'Per-lesson survival overrides: boss/player HP, BGM, time/kill quota, enemy/player stat multipliers, composite damage.';

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_content_check;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_content_check CHECK (
    (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NOT NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NOT NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = true
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NOT NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = true
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NOT NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = true
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NOT NULL
    )
  );

COMMIT;
