-- Phrase Defense Basic/Advanced stage 1: one concatenated 16-bar backing
-- (4 existing 4-bar phrase files joined in order).
BEGIN;

DO $$
DECLARE
  v_stage_id uuid := uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'defense-dev-survival-phrases-1-4'
  );
  v_audio_url text := 'https://jazzify-cdn.com/fantasy-bgm/defense-phrases-i-iv-concat-160bpm.mp3';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.defense_stages WHERE id = v_stage_id) THEN
    RAISE EXCEPTION 'defense stage not found for single-source seed';
  END IF;

  UPDATE public.defense_phrases
  SET
    audio_url = NULL,
    loop_start_measure = (order_index * 4) + 1,
    loop_end_measure = (order_index * 4) + 4
  WHERE stage_id = v_stage_id;

  UPDATE public.defense_stages
  SET
    audio_registration_mode = 'single_source',
    audio_url = v_audio_url
  WHERE id = v_stage_id;
END;
$$;

COMMIT;
