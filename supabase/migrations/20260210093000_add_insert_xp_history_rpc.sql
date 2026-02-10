-- Add RPC to insert xp_history rows
-- Created at: 2026-02-10

CREATE OR REPLACE FUNCTION public.insert_xp_history(
    p_user_id UUID,
    p_song_id UUID,
    p_gained_xp INTEGER,
    p_base_xp INTEGER,
    p_speed_multiplier NUMERIC,
    p_rank_multiplier NUMERIC,
    p_transpose_multiplier NUMERIC,
    p_membership_multiplier NUMERIC,
    p_mission_multiplier NUMERIC DEFAULT 1.0,
    p_reason TEXT DEFAULT 'unknown'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_id UUID;
BEGIN
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RAISE EXCEPTION 'not authorized';
    END IF;

    INSERT INTO public.xp_history (
        user_id,
        song_id,
        gained_xp,
        base_xp,
        speed_multiplier,
        rank_multiplier,
        transpose_multiplier,
        membership_multiplier,
        mission_multiplier,
        reason
    ) VALUES (
        p_user_id,
        p_song_id,
        p_gained_xp,
        p_base_xp,
        p_speed_multiplier,
        p_rank_multiplier,
        p_transpose_multiplier,
        p_membership_multiplier,
        p_mission_multiplier,
        p_reason
    )
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.insert_xp_history(
    UUID, UUID, INTEGER, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT
) TO authenticated;

COMMENT ON FUNCTION public.insert_xp_history(
    UUID, UUID, INTEGER, INTEGER, NUMERIC, NUMERIC, NUMERIC, NUMERIC, NUMERIC, TEXT
) IS 'Insert XP history row with detailed multipliers.';
