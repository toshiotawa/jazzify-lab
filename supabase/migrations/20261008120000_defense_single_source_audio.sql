-- Defense mode: single shared audio file with per-phrase measure loop ranges
BEGIN;

ALTER TABLE public.defense_stages
  ADD COLUMN IF NOT EXISTS audio_registration_mode text NOT NULL DEFAULT 'per_phrase'
    CHECK (audio_registration_mode IN ('per_phrase', 'single_source')),
  ADD COLUMN IF NOT EXISTS audio_url text;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_audio_registration_mode_url_check
  CHECK (
    (audio_registration_mode = 'per_phrase' AND audio_url IS NULL)
    OR (
      audio_registration_mode = 'single_source'
      AND audio_url IS NOT NULL
      AND length(trim(audio_url)) > 0
    )
  );

ALTER TABLE public.defense_phrases
  ALTER COLUMN audio_url DROP NOT NULL;

ALTER TABLE public.defense_phrases
  ADD COLUMN IF NOT EXISTS loop_start_measure smallint,
  ADD COLUMN IF NOT EXISTS loop_end_measure smallint;

ALTER TABLE public.defense_phrases
  ADD CONSTRAINT defense_phrases_loop_measure_window_check
  CHECK (
    (loop_start_measure IS NULL AND loop_end_measure IS NULL)
    OR (
      loop_start_measure IS NOT NULL
      AND loop_end_measure IS NOT NULL
      AND loop_start_measure >= 1
      AND loop_end_measure >= loop_start_measure
    )
  );

ALTER TABLE public.defense_phrases
  ADD CONSTRAINT defense_phrases_audio_url_nonempty_check
  CHECK (audio_url IS NULL OR length(trim(audio_url)) > 0);

CREATE OR REPLACE FUNCTION public.validate_defense_stage_audio_registration(p_stage_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_mode text;
  v_phrase_count integer;
  v_invalid_count integer;
BEGIN
  SELECT audio_registration_mode
  INTO v_mode
  FROM public.defense_stages
  WHERE id = p_stage_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'defense stage not found: %', p_stage_id;
  END IF;

  SELECT count(*)
  INTO v_phrase_count
  FROM public.defense_phrases
  WHERE stage_id = p_stage_id;

  IF v_phrase_count = 0 THEN
    RAISE EXCEPTION 'defense stage % has no phrases', p_stage_id;
  END IF;

  IF v_mode = 'per_phrase' THEN
    SELECT count(*)
    INTO v_invalid_count
    FROM public.defense_phrases
    WHERE stage_id = p_stage_id
      AND (
        audio_url IS NULL
        OR length(trim(audio_url)) = 0
        OR loop_start_measure IS NOT NULL
        OR loop_end_measure IS NOT NULL
      );

    IF v_invalid_count > 0 THEN
      RAISE EXCEPTION
        'defense stage % requires per-phrase audio_url and no loop measures on every phrase',
        p_stage_id;
    END IF;
  ELSIF v_mode = 'single_source' THEN
    SELECT count(*)
    INTO v_invalid_count
    FROM public.defense_phrases
    WHERE stage_id = p_stage_id
      AND (
        audio_url IS NOT NULL
        OR loop_start_measure IS NULL
        OR loop_end_measure IS NULL
      );

    IF v_invalid_count > 0 THEN
      RAISE EXCEPTION
        'defense stage % requires loop measures and no per-phrase audio_url on every phrase',
        p_stage_id;
    END IF;
  ELSE
    RAISE EXCEPTION 'unsupported defense audio registration mode: %', v_mode;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_validate_defense_stage_audio_registration()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_stage_id uuid;
BEGIN
  IF TG_TABLE_NAME = 'defense_stages' THEN
    v_stage_id := COALESCE(NEW.id, OLD.id);
  ELSE
    v_stage_id := COALESCE(NEW.stage_id, OLD.stage_id);
  END IF;

  PERFORM public.validate_defense_stage_audio_registration(v_stage_id);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_defense_stages_validate_audio_registration ON public.defense_stages;
CREATE CONSTRAINT TRIGGER trg_defense_stages_validate_audio_registration
  AFTER INSERT OR UPDATE OF audio_registration_mode, audio_url
  ON public.defense_stages
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_defense_stage_audio_registration();

DROP TRIGGER IF EXISTS trg_defense_phrases_validate_audio_registration ON public.defense_phrases;
CREATE CONSTRAINT TRIGGER trg_defense_phrases_validate_audio_registration
  AFTER INSERT OR UPDATE OF audio_url, loop_start_measure, loop_end_measure, stage_id
    OR DELETE
  ON public.defense_phrases
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_defense_stage_audio_registration();

CREATE OR REPLACE FUNCTION public.save_defense_stage_audio_registration(
  p_stage_id uuid,
  p_mode text,
  p_stage_audio_url text,
  p_bpm numeric,
  p_beats_per_bar smallint,
  p_phrases jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin boolean;
  v_existing_count integer;
  v_payload_count integer;
  v_phrase jsonb;
  v_phrase_id uuid;
BEGIN
  SELECT COALESCE(profiles.is_admin, false)
  INTO v_is_admin
  FROM public.profiles
  WHERE profiles.id = auth.uid();

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin privileges required';
  END IF;

  IF p_mode NOT IN ('per_phrase', 'single_source') THEN
    RAISE EXCEPTION 'invalid audio registration mode: %', p_mode;
  END IF;

  IF p_bpm <= 0 THEN
    RAISE EXCEPTION 'bpm must be positive';
  END IF;

  IF p_beats_per_bar <= 0 THEN
    RAISE EXCEPTION 'beats_per_bar must be positive';
  END IF;

  PERFORM 1
  FROM public.defense_stages
  WHERE id = p_stage_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'defense stage not found: %', p_stage_id;
  END IF;

  SELECT count(*)
  INTO v_existing_count
  FROM public.defense_phrases
  WHERE stage_id = p_stage_id;

  SELECT count(DISTINCT (value ->> 'id'))
  INTO v_payload_count
  FROM jsonb_array_elements(COALESCE(p_phrases, '[]'::jsonb)) AS payload(value);

  IF v_existing_count = 0 THEN
    RAISE EXCEPTION 'defense stage % has no phrases', p_stage_id;
  END IF;

  IF v_payload_count <> v_existing_count THEN
    RAISE EXCEPTION 'phrase payload count mismatch for stage %', p_stage_id;
  END IF;

  FOR v_phrase IN
    SELECT value
    FROM jsonb_array_elements(COALESCE(p_phrases, '[]'::jsonb)) AS payload(value)
  LOOP
    v_phrase_id := (v_phrase ->> 'id')::uuid;

    IF v_phrase_id IS NULL THEN
      RAISE EXCEPTION 'phrase id is required';
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM public.defense_phrases
      WHERE id = v_phrase_id
        AND stage_id = p_stage_id
    ) THEN
      RAISE EXCEPTION 'unknown phrase id % for stage %', v_phrase_id, p_stage_id;
    END IF;

    UPDATE public.defense_phrases
    SET
      audio_url = NULLIF(trim(v_phrase ->> 'audio_url'), ''),
      loop_start_measure = NULLIF(v_phrase ->> 'loop_start_measure', '')::smallint,
      loop_end_measure = NULLIF(v_phrase ->> 'loop_end_measure', '')::smallint
    WHERE id = v_phrase_id;
  END LOOP;

  UPDATE public.defense_stages
  SET
    audio_registration_mode = p_mode,
    audio_url = CASE
      WHEN p_mode = 'single_source' THEN NULLIF(trim(p_stage_audio_url), '')
      ELSE NULL
    END,
    bpm = p_bpm,
    beats_per_bar = p_beats_per_bar
  WHERE id = p_stage_id;

  RETURN;
END;
$$;

REVOKE ALL ON FUNCTION public.save_defense_stage_audio_registration(
  uuid, text, text, numeric, smallint, jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_defense_stage_audio_registration(
  uuid, text, text, numeric, smallint, jsonb
) TO authenticated;

COMMIT;
