-- OSMD チュートリアル各シーン完了時の MIDI ノーツ hit ratio 履歴

CREATE TABLE IF NOT EXISTS public.user_ear_training_tutorial_osmd_scene_results (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    lesson_song_id uuid NOT NULL REFERENCES public.lesson_songs(id) ON DELETE CASCADE,
    script_id text NOT NULL,
    scene_index integer NOT NULL CHECK (scene_index >= 0),
    required_loops integer NOT NULL CHECK (required_loops >= 1),
    note_hit_ratio numeric(5, 4) NOT NULL CHECK (note_hit_ratio >= 0 AND note_hit_ratio <= 1),
    note_hit_percent integer NOT NULL CHECK (note_hit_percent >= 0 AND note_hit_percent <= 100),
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_ear_training_tutorial_osmd_scene_results_lookup
    ON public.user_ear_training_tutorial_osmd_scene_results (
        user_id,
        lesson_song_id,
        scene_index,
        created_at DESC
    );

ALTER TABLE public.user_ear_training_tutorial_osmd_scene_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_ear_training_tutorial_osmd_scene_results_select_own"
    ON public.user_ear_training_tutorial_osmd_scene_results
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "user_ear_training_tutorial_osmd_scene_results_insert_own"
    ON public.user_ear_training_tutorial_osmd_scene_results
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.record_ear_training_tutorial_osmd_scene_result(
    p_user_id uuid,
    p_lesson_song_id uuid,
    p_script_id text,
    p_scene_index integer,
    p_required_loops integer,
    p_note_hit_ratio numeric
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_note_hit_percent integer;
BEGIN
    IF p_user_id IS DISTINCT FROM auth.uid() AND auth.role() <> 'service_role' THEN
        RAISE EXCEPTION 'forbidden';
    END IF;

    IF p_scene_index < 0 THEN
        RAISE EXCEPTION 'invalid scene_index: %', p_scene_index;
    END IF;

    IF p_required_loops < 1 THEN
        RAISE EXCEPTION 'invalid required_loops: %', p_required_loops;
    END IF;

    IF p_note_hit_ratio < 0 OR p_note_hit_ratio > 1 THEN
        RAISE EXCEPTION 'invalid note_hit_ratio: %', p_note_hit_ratio;
    END IF;

    IF p_script_id IS NULL OR btrim(p_script_id) = '' THEN
        RAISE EXCEPTION 'invalid script_id';
    END IF;

    v_note_hit_percent := LEAST(100, GREATEST(0, ROUND(p_note_hit_ratio * 100)::integer));

    INSERT INTO public.user_ear_training_tutorial_osmd_scene_results (
        user_id,
        lesson_song_id,
        script_id,
        scene_index,
        required_loops,
        note_hit_ratio,
        note_hit_percent
    ) VALUES (
        p_user_id,
        p_lesson_song_id,
        btrim(p_script_id),
        p_scene_index,
        p_required_loops,
        p_note_hit_ratio,
        v_note_hit_percent
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_ear_training_tutorial_osmd_scene_result(
    uuid,
    uuid,
    text,
    integer,
    integer,
    numeric
) TO authenticated;
