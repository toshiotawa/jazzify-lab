-- Composite phrase stages: per-stage BGM URL (floor 2 / phrases_composite_1)
BEGIN;

ALTER TABLE public.survival_composite_phrase_stages
  ADD COLUMN IF NOT EXISTS bgm_url text;

COMMENT ON COLUMN public.survival_composite_phrase_stages.bgm_url IS
  'Looped BGM for composite phrase boss gameplay. NULL falls back to survival_bgm_settings.phrases.';

UPDATE public.survival_composite_phrase_stages
SET bgm_url = 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3',
    updated_at = now()
WHERE map_category = 'phrases'
  AND stage_number = 6;

COMMIT;
