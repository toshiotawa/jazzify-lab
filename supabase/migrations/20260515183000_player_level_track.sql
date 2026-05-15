-- Separate player level / XP track (profiles.level + profiles.xp are unchanged; diary/missions unchanged).
-- Lv 1→2 … 4→5: 90 XP per gap (4 gaps). From Lv 5 onward: 200 XP per gap.
-- Reasons: survival_stage_first_clear (+80 flat), lesson_first_clear (+100 flat).

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS player_level integer NOT NULL DEFAULT 1
    CONSTRAINT profiles_player_level_check CHECK (player_level >= 1),
  ADD COLUMN IF NOT EXISTS player_xp bigint NOT NULL DEFAULT 0
    CONSTRAINT profiles_player_xp_check CHECK (player_xp >= 0);

CREATE TABLE IF NOT EXISTS public.player_xp_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  reason text NOT NULL
    CONSTRAINT player_xp_history_reason_check
      CHECK (
        reason = ANY (
          ARRAY[
            'survival_stage_first_clear'::text,
            'lesson_first_clear'::text
          ]
        )
      ),
  source_id text NOT NULL,
  gained_xp integer NOT NULL
    CONSTRAINT player_xp_history_gained_xp_check CHECK (gained_xp > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT player_xp_history_user_reason_source UNIQUE (user_id, reason, source_id)
);

CREATE INDEX IF NOT EXISTS idx_player_xp_history_user_created
  ON public.player_xp_history (user_id, created_at DESC);

ALTER TABLE public.player_xp_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS player_xp_history_select_own ON public.player_xp_history;
CREATE POLICY player_xp_history_select_own
  ON public.player_xp_history
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON TABLE public.player_xp_history TO authenticated;

COMMENT ON COLUMN public.profiles.player_level IS 'Gamification level (survival-first-clear + lesson-first-complete XP). Separate from profiles.level.';
COMMENT ON COLUMN public.profiles.player_xp IS 'Total XP on player_level track.';
COMMENT ON TABLE public.player_xp_history IS 'Idempotent XP awards; unique(user_id, reason, source_id) prevents duplicates.';

-- XP needed to advance FROM current_level to current_level + 1
CREATE OR REPLACE FUNCTION public.xp_gap_for_player_level(p_level integer)
RETURNS integer
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN COALESCE(p_level, 1) <= 4 THEN 90
    ELSE 200
  END;
$$;

-- Derived level + remainder within current tier + xp needed for next level
CREATE OR REPLACE FUNCTION public.calc_player_level_from_player_xp(p_total bigint)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_level integer := 1;
  v_rem bigint := GREATEST(COALESCE(p_total, 0), 0);
  v_needed integer;
BEGIN
  LOOP
    v_needed := public.xp_gap_for_player_level(v_level);
    IF v_rem < v_needed THEN
      RETURN jsonb_build_object(
        'level', v_level,
        'remainder', v_rem,
        'next_level_xp', v_needed
      );
    END IF;
    v_rem := v_rem - v_needed;
    v_level := v_level + 1;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_player_level_state()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_tot bigint;
  v_calc jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT p.player_xp INTO v_tot
  FROM public.profiles AS p
  WHERE p.id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  v_calc := public.calc_player_level_from_player_xp(v_tot);

  RETURN jsonb_build_object(
    'total_xp', COALESCE(v_tot, 0),
    'level', (v_calc->>'level')::integer,
    'in_level_xp', (v_calc->>'remainder')::integer,
    'next_level_xp', (v_calc->>'next_level_xp')::integer
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.award_player_xp(
  p_reason text,
  p_source_id text,
  p_amount integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_rows integer;
  v_prev_tot bigint;
  v_new_tot bigint;
  v_calc_prev jsonb;
  v_calc_new jsonb;
  v_lvl_prev int;
  v_lvl_new int;
  v_leveled_up boolean;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  IF COALESCE(trim(p_source_id), '') = '' THEN
    RETURN jsonb_build_object('error', 'invalid_source_id');
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object('error', 'invalid_amount');
  END IF;

  IF p_reason NOT IN ('survival_stage_first_clear', 'lesson_first_clear') THEN
    RETURN jsonb_build_object('error', 'invalid_reason');
  END IF;

  INSERT INTO public.player_xp_history (user_id, reason, source_id, gained_xp)
  VALUES (v_uid, p_reason, trim(p_source_id), p_amount)
  ON CONFLICT (user_id, reason, source_id) DO NOTHING;

  GET DIAGNOSTICS v_rows = ROW_COUNT;

  SELECT p.player_xp
  INTO v_prev_tot
  FROM public.profiles AS p
  WHERE p.id = v_uid
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  v_calc_prev := public.calc_player_level_from_player_xp(v_prev_tot);
  v_lvl_prev := (v_calc_prev->>'level')::integer;

  IF v_rows IS NULL OR v_rows = 0 THEN
    -- Duplicate award: snapshot current progress without granting again
    v_calc_new := v_calc_prev;
    v_lvl_new := v_lvl_prev;
    RETURN jsonb_build_object(
      'gained_xp', 0,
      'duplicate', true,
      'previous_level', v_lvl_prev,
      'new_level', v_lvl_new,
      'leveled_up', false,
      'total_xp', COALESCE(v_prev_tot, 0),
      'in_level_xp', (v_calc_new->>'remainder')::integer,
      'next_level_xp', (v_calc_new->>'next_level_xp')::integer
    );
  END IF;

  v_new_tot := COALESCE(v_prev_tot, 0) + p_amount;
  v_calc_new := public.calc_player_level_from_player_xp(v_new_tot);
  v_lvl_new := (v_calc_new->>'level')::integer;
  v_leveled_up := v_lvl_new > v_lvl_prev;

  UPDATE public.profiles AS pr
  SET
    player_xp = v_new_tot,
    player_level = v_lvl_new,
    updated_at = now()
  WHERE pr.id = v_uid;

  RETURN jsonb_build_object(
    'gained_xp', p_amount,
    'duplicate', false,
    'previous_level', v_lvl_prev,
    'new_level', v_lvl_new,
    'leveled_up', v_leveled_up,
    'total_xp', v_new_tot,
    'in_level_xp', (v_calc_new->>'remainder')::integer,
    'next_level_xp', (v_calc_new->>'next_level_xp')::integer
  );
END;
$$;

COMMENT ON FUNCTION public.award_player_xp(text, text, integer)
  IS 'Idempotent XP on player_* track via player_xp_history UNIQUE; returns deltas for toast UI.';
COMMENT ON FUNCTION public.get_player_level_state()
  IS 'Current player_* track snapshot for dashboards.';

REVOKE ALL ON FUNCTION public.xp_gap_for_player_level(integer) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.calc_player_level_from_player_xp(bigint) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_player_level_state() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.award_player_xp(text, text, integer) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.xp_gap_for_player_level(integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calc_player_level_from_player_xp(bigint) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_player_level_state() TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_player_xp(text, text, integer) TO authenticated;

COMMIT;
