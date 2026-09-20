-- Defense: shared progression separate tracks (BGM + melody files)
BEGIN;

ALTER TABLE public.defense_stages
  ADD COLUMN IF NOT EXISTS melody_audio_url text;

ALTER TABLE public.defense_stages
  DROP CONSTRAINT IF EXISTS defense_stages_audio_registration_mode_check;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_audio_registration_mode_check
  CHECK (audio_registration_mode IN (
    'per_phrase',
    'single_source',
    'shared_progression',
    'shared_progression_separate_tracks'
  ));

ALTER TABLE public.defense_stages
  DROP CONSTRAINT IF EXISTS defense_stages_audio_registration_mode_url_check;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_audio_registration_mode_url_check
  CHECK (
    (
      audio_registration_mode = 'per_phrase'
      AND audio_url IS NULL
      AND melody_audio_url IS NULL
    )
    OR (
      audio_registration_mode = 'single_source'
      AND audio_url IS NOT NULL
      AND length(trim(audio_url)) > 0
      AND melody_audio_url IS NULL
    )
    OR (
      audio_registration_mode = 'shared_progression'
      AND audio_url IS NULL
      AND melody_audio_url IS NULL
    )
    OR (
      audio_registration_mode = 'shared_progression_separate_tracks'
      AND audio_url IS NOT NULL
      AND length(trim(audio_url)) > 0
      AND melody_audio_url IS NOT NULL
      AND length(trim(melody_audio_url)) > 0
    )
  );

ALTER TABLE public.defense_stages
  DROP CONSTRAINT IF EXISTS defense_stages_shared_progression_bars_check;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_shared_progression_bars_check
  CHECK (
    (
      audio_registration_mode IN ('shared_progression', 'shared_progression_separate_tracks')
      AND progression_bars IS NOT NULL
      AND progression_bars > 0
      AND phrase_bars IN (1, 2, 4)
      AND progression_bars % phrase_bars = 0
    )
    OR (
      audio_registration_mode NOT IN ('shared_progression', 'shared_progression_separate_tracks')
      AND progression_bars IS NULL
    )
  );

CREATE OR REPLACE FUNCTION public.validate_defense_separate_tracks_phrase_windows(p_stage_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_phrase_bars integer;
  v_rank integer := 0;
  v_phrase record;
  v_expected_start integer;
  v_expected_end integer;
BEGIN
  SELECT phrase_bars
  INTO v_phrase_bars
  FROM public.defense_stages
  WHERE id = p_stage_id;

  FOR v_phrase IN
    SELECT loop_start_measure, loop_end_measure
    FROM public.defense_phrases
    WHERE stage_id = p_stage_id
    ORDER BY order_index
  LOOP
    v_expected_start := v_rank * v_phrase_bars + 1;
    v_expected_end := (v_rank + 1) * v_phrase_bars;
    IF v_phrase.loop_start_measure IS DISTINCT FROM v_expected_start
      OR v_phrase.loop_end_measure IS DISTINCT FROM v_expected_end THEN
      RAISE EXCEPTION
        'defense stage % phrase rank % requires loop measures %-%',
        p_stage_id,
        v_rank,
        v_expected_start,
        v_expected_end;
    END IF;
    v_rank := v_rank + 1;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_defense_stage_audio_registration(p_stage_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_mode text;
  v_phrase_count integer;
  v_invalid_count integer;
  v_progression_bars integer;
  v_phrase_bars integer;
BEGIN
  SELECT audio_registration_mode, progression_bars, phrase_bars
  INTO v_mode, v_progression_bars, v_phrase_bars
  FROM public.defense_stages
  WHERE id = p_stage_id;

  IF NOT FOUND THEN
    RETURN;
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
  ELSIF v_mode = 'shared_progression' THEN
    IF v_progression_bars IS NULL OR v_progression_bars <= 0 THEN
      RAISE EXCEPTION 'defense stage % requires positive progression_bars', p_stage_id;
    END IF;

    IF v_phrase_bars NOT IN (1, 2, 4) THEN
      RAISE EXCEPTION 'defense stage % requires phrase_bars in (1, 2, 4) for shared_progression', p_stage_id;
    END IF;

    IF v_progression_bars % v_phrase_bars <> 0 THEN
      RAISE EXCEPTION 'defense stage % requires progression_bars divisible by phrase_bars', p_stage_id;
    END IF;

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
        'defense stage % requires per-phrase audio_url and no loop measures for shared_progression',
        p_stage_id;
    END IF;

    PERFORM public.validate_defense_shared_progression_labels(p_stage_id);
  ELSIF v_mode = 'shared_progression_separate_tracks' THEN
    IF v_progression_bars IS NULL OR v_progression_bars <= 0 THEN
      RAISE EXCEPTION 'defense stage % requires positive progression_bars', p_stage_id;
    END IF;

    IF v_phrase_bars NOT IN (1, 2, 4) THEN
      RAISE EXCEPTION 'defense stage % requires phrase_bars in (1, 2, 4) for separate tracks', p_stage_id;
    END IF;

    IF v_progression_bars % v_phrase_bars <> 0 THEN
      RAISE EXCEPTION 'defense stage % requires progression_bars divisible by phrase_bars', p_stage_id;
    END IF;

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
        'defense stage % requires loop measures and no per-phrase audio_url for separate tracks',
        p_stage_id;
    END IF;

    PERFORM public.validate_defense_separate_tracks_phrase_windows(p_stage_id);
  ELSE
    RAISE EXCEPTION 'unsupported defense audio registration mode: %', v_mode;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_defense_stages_validate_audio_registration ON public.defense_stages;
CREATE CONSTRAINT TRIGGER trg_defense_stages_validate_audio_registration
  AFTER INSERT OR UPDATE OF
    audio_registration_mode,
    audio_url,
    melody_audio_url,
    progression_bars,
    phrase_bars,
    bpm,
    beats_per_bar
  ON public.defense_stages
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_defense_stage_audio_registration();

DROP TRIGGER IF EXISTS trg_defense_phrases_validate_audio_registration ON public.defense_phrases;
CREATE CONSTRAINT TRIGGER trg_defense_phrases_validate_audio_registration
  AFTER INSERT OR UPDATE OF audio_url, loop_start_measure, loop_end_measure, stage_id, order_index
    OR DELETE
  ON public.defense_phrases
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_validate_defense_stage_audio_registration();

CREATE OR REPLACE FUNCTION public.save_defense_stage_audio_registration_v3(
  p_stage_id uuid,
  p_mode text,
  p_stage_audio_url text,
  p_melody_audio_url text,
  p_bpm numeric,
  p_beats_per_bar smallint,
  p_phrase_bars smallint,
  p_progression_bars smallint,
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
  v_payload_array_length integer;
  v_phrase_id uuid;
  v_rank integer := 0;
  v_expected_start integer;
  v_expected_end integer;
BEGIN
  SELECT COALESCE(profiles.is_admin, false)
  INTO v_is_admin
  FROM public.profiles
  WHERE profiles.id = auth.uid();

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin privileges required';
  END IF;

  IF p_mode <> 'shared_progression_separate_tracks' THEN
    RAISE EXCEPTION 'v3 save accepts shared_progression_separate_tracks only, got %', p_mode;
  END IF;

  IF p_bpm <= 0 THEN
    RAISE EXCEPTION 'bpm must be positive';
  END IF;

  IF p_beats_per_bar <= 0 THEN
    RAISE EXCEPTION 'beats_per_bar must be positive';
  END IF;

  IF p_phrase_bars IS NULL OR p_phrase_bars NOT IN (1, 2, 4) THEN
    RAISE EXCEPTION 'shared_progression_separate_tracks requires phrase_bars in (1, 2, 4)';
  END IF;

  IF p_progression_bars IS NULL OR p_progression_bars <= 0 THEN
    RAISE EXCEPTION 'shared_progression_separate_tracks requires positive progression_bars';
  END IF;

  IF p_progression_bars % p_phrase_bars <> 0 THEN
    RAISE EXCEPTION 'progression_bars must be divisible by phrase_bars';
  END IF;

  IF p_stage_audio_url IS NULL OR length(trim(p_stage_audio_url)) = 0 THEN
    RAISE EXCEPTION 'shared_progression_separate_tracks requires stage BGM audio_url';
  END IF;

  IF p_melody_audio_url IS NULL OR length(trim(p_melody_audio_url)) = 0 THEN
    RAISE EXCEPTION 'shared_progression_separate_tracks requires melody_audio_url';
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

  SELECT count(*)
  INTO v_payload_array_length
  FROM jsonb_array_elements(COALESCE(p_phrases, '[]'::jsonb));

  SELECT count(DISTINCT (value ->> 'id'))
  INTO v_payload_count
  FROM jsonb_array_elements(COALESCE(p_phrases, '[]'::jsonb)) AS payload(value);

  IF v_existing_count = 0 THEN
    RAISE EXCEPTION 'defense stage % has no phrases', p_stage_id;
  END IF;

  IF v_payload_array_length <> v_existing_count THEN
    RAISE EXCEPTION 'phrase payload count mismatch for stage %', p_stage_id;
  END IF;

  IF v_payload_count <> v_existing_count THEN
    RAISE EXCEPTION 'phrase payload contains duplicate or missing ids for stage %', p_stage_id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM jsonb_array_elements(COALESCE(p_phrases, '[]'::jsonb)) AS payload(value)
    WHERE (payload.value ->> 'id') IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM public.defense_phrases p
        WHERE p.id = (payload.value ->> 'id')::uuid
          AND p.stage_id = p_stage_id
      )
  ) THEN
    RAISE EXCEPTION 'phrase payload contains unknown ids for stage %', p_stage_id;
  END IF;

  FOR v_phrase_id IN
    SELECT p.id
    FROM public.defense_phrases p
    WHERE p.stage_id = p_stage_id
    ORDER BY p.order_index
  LOOP
    v_expected_start := v_rank * p_phrase_bars + 1;
    v_expected_end := (v_rank + 1) * p_phrase_bars;

    UPDATE public.defense_phrases
    SET
      audio_url = NULL,
      loop_start_measure = v_expected_start,
      loop_end_measure = v_expected_end
    WHERE id = v_phrase_id;

    v_rank := v_rank + 1;
  END LOOP;

  UPDATE public.defense_stages
  SET
    audio_registration_mode = p_mode,
    audio_url = NULLIF(trim(p_stage_audio_url), ''),
    melody_audio_url = NULLIF(trim(p_melody_audio_url), ''),
    bpm = p_bpm,
    beats_per_bar = p_beats_per_bar,
    phrase_bars = p_phrase_bars,
    progression_bars = p_progression_bars
  WHERE id = p_stage_id;

  RETURN;
END;
$$;

CREATE OR REPLACE FUNCTION public.save_defense_stage_audio_registration_v2(
  p_stage_id uuid,
  p_mode text,
  p_stage_audio_url text,
  p_bpm numeric,
  p_beats_per_bar smallint,
  p_phrase_bars smallint,
  p_progression_bars smallint,
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
  v_existing_mode text;
BEGIN
  SELECT COALESCE(profiles.is_admin, false)
  INTO v_is_admin
  FROM public.profiles
  WHERE profiles.id = auth.uid();

  IF NOT COALESCE(v_is_admin, false) THEN
    RAISE EXCEPTION 'admin privileges required';
  END IF;

  IF p_mode NOT IN ('per_phrase', 'single_source', 'shared_progression') THEN
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

  SELECT audio_registration_mode
  INTO v_existing_mode
  FROM public.defense_stages
  WHERE id = p_stage_id;

  IF v_existing_mode = 'shared_progression_separate_tracks' THEN
    RAISE EXCEPTION 'defense stage % uses shared_progression_separate_tracks; use save_defense_stage_audio_registration_v3', p_stage_id;
  END IF;

  IF v_existing_mode = 'shared_progression' AND p_mode <> 'shared_progression' THEN
    RAISE EXCEPTION 'defense stage % is shared_progression and cannot be downgraded via v2 save', p_stage_id;
  END IF;

  IF p_mode = 'shared_progression' THEN
    IF p_phrase_bars IS NULL OR p_phrase_bars NOT IN (1, 2, 4) THEN
      RAISE EXCEPTION 'shared_progression requires phrase_bars in (1, 2, 4)';
    END IF;
    IF p_progression_bars IS NULL OR p_progression_bars <= 0 THEN
      RAISE EXCEPTION 'shared_progression requires positive progression_bars';
    END IF;
    IF p_progression_bars % p_phrase_bars <> 0 THEN
      RAISE EXCEPTION 'progression_bars must be divisible by phrase_bars';
    END IF;
  ELSE
    IF p_progression_bars IS NOT NULL THEN
      RAISE EXCEPTION 'progression_bars is only valid for shared_progression';
    END IF;
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
    melody_audio_url = NULL,
    bpm = p_bpm,
    beats_per_bar = p_beats_per_bar,
    phrase_bars = COALESCE(p_phrase_bars, phrase_bars),
    progression_bars = CASE
      WHEN p_mode = 'shared_progression' THEN p_progression_bars
      ELSE NULL
    END
  WHERE id = p_stage_id;

  RETURN;
END;
$$;

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
  v_existing_mode text;
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

  SELECT audio_registration_mode
  INTO v_existing_mode
  FROM public.defense_stages
  WHERE id = p_stage_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'defense stage not found: %', p_stage_id;
  END IF;

  IF v_existing_mode = 'shared_progression' THEN
    RAISE EXCEPTION 'defense stage % uses shared_progression; use save_defense_stage_audio_registration_v2', p_stage_id;
  END IF;

  IF v_existing_mode = 'shared_progression_separate_tracks' THEN
    RAISE EXCEPTION 'defense stage % uses shared_progression_separate_tracks; use save_defense_stage_audio_registration_v3', p_stage_id;
  END IF;

  PERFORM public.save_defense_stage_audio_registration_v2(
    p_stage_id,
    p_mode,
    p_stage_audio_url,
    p_bpm,
    p_beats_per_bar,
    NULL,
    NULL,
    p_phrases
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_defense_stage_audio_registration_v3(
  uuid, text, text, text, numeric, smallint, smallint, smallint, jsonb
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.save_defense_stage_audio_registration_v3(
  uuid, text, text, text, numeric, smallint, smallint, smallint, jsonb
) TO authenticated;

COMMIT;
