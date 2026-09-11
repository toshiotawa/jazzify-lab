-- Play map infrastructure: code_run / defense world maps, node clears, rank thresholds.
-- Additive only; existing survival_stage_clears and lesson progress remain untouched.
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Rank thresholds (code run clear time → letter rank)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.code_run_rank_thresholds (
  rank text PRIMARY KEY
    CHECK (rank = ANY (ARRAY['S','A','B','C','D','E','F']::text[])),
  max_seconds integer NOT NULL CHECK (max_seconds > 0),
  sort_order smallint NOT NULL CHECK (sort_order >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.code_run_rank_thresholds IS
  'Code run clear-time rank thresholds. Lower max_seconds = better rank.';

INSERT INTO public.code_run_rank_thresholds (rank, max_seconds, sort_order) VALUES
  ('S', 60, 0),
  ('A', 90, 1),
  ('B', 120, 2),
  ('C', 150, 3),
  ('D', 165, 4),
  ('E', 180, 5),
  ('F', 195, 6)
ON CONFLICT (rank) DO UPDATE SET
  max_seconds = EXCLUDED.max_seconds,
  sort_order = EXCLUDED.sort_order;

ALTER TABLE public.code_run_rank_thresholds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS code_run_rank_thresholds_select_all ON public.code_run_rank_thresholds;
CREATE POLICY code_run_rank_thresholds_select_all ON public.code_run_rank_thresholds
  FOR SELECT USING (true);

GRANT SELECT ON public.code_run_rank_thresholds TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 2) Map blocks
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.play_map_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mode text NOT NULL CHECK (mode IN ('code_run', 'defense')),
  tier text NOT NULL CHECK (tier IN ('basic', 'advanced')),
  block_key text NOT NULL,
  label text NOT NULL,
  label_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (mode, tier, block_key)
);

COMMENT ON TABLE public.play_map_blocks IS
  'Play-mode world map blocks (code_run / phrase defense).';

CREATE TABLE IF NOT EXISTS public.play_map_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id uuid NOT NULL REFERENCES public.play_map_blocks(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  node_kind text NOT NULL CHECK (node_kind IN ('stage', 'quest')),
  survival_map_category text DEFAULT NULL,
  survival_stage_number integer DEFAULT NULL,
  defense_stage_id uuid DEFAULT NULL REFERENCES public.defense_stages(id) ON DELETE RESTRICT,
  lesson_id uuid DEFAULT NULL REFERENCES public.lessons(id) ON DELETE RESTRICT,
  title text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  required_rank text NOT NULL DEFAULT 'C'
    CHECK (required_rank = ANY (ARRAY['S','A','B','C','D','E','F']::text[])),
  rank_thresholds jsonb DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT play_map_nodes_stage_ref_check CHECK (
    (node_kind = 'stage' AND survival_map_category IS NOT NULL AND survival_stage_number IS NOT NULL
      AND defense_stage_id IS NULL AND lesson_id IS NULL)
    OR (node_kind = 'quest' AND lesson_id IS NOT NULL
      AND survival_map_category IS NULL AND survival_stage_number IS NULL AND defense_stage_id IS NULL)
    OR (node_kind = 'stage' AND defense_stage_id IS NOT NULL
      AND survival_map_category IS NULL AND survival_stage_number IS NULL AND lesson_id IS NULL)
  )
);

COMMENT ON TABLE public.play_map_nodes IS
  'Nodes on play-mode maps. stage → survival_stages or defense_stages; quest → lessons.';

CREATE INDEX IF NOT EXISTS idx_play_map_nodes_block_sort
  ON public.play_map_nodes (block_id, sort_order);

CREATE TABLE IF NOT EXISTS public.play_map_node_clears (
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES public.play_map_nodes(id) ON DELETE CASCADE,
  best_time_sec numeric DEFAULT NULL CHECK (best_time_sec IS NULL OR best_time_sec >= 0),
  best_rank text DEFAULT NULL
    CHECK (best_rank IS NULL OR best_rank = ANY (ARRAY['S','A','B','C','D','E','F']::text[])),
  best_survive_sec smallint DEFAULT NULL CHECK (best_survive_sec IS NULL OR best_survive_sec >= 0),
  clear_count integer NOT NULL DEFAULT 1 CHECK (clear_count >= 1),
  first_cleared_at timestamptz NOT NULL DEFAULT now(),
  cleared_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, node_id)
);

COMMENT ON TABLE public.play_map_node_clears IS
  'Per-user play map node clear records. best_time_sec for code_run; best_survive_sec for defense; quest nodes store only clear_count. A row existing = node cleared.';

CREATE INDEX IF NOT EXISTS idx_play_map_node_clears_user
  ON public.play_map_node_clears (user_id, cleared_at DESC);

-- ---------------------------------------------------------------------------
-- 3) updated_at triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_play_map_blocks_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_play_map_blocks_updated_at ON public.play_map_blocks;
CREATE TRIGGER trg_play_map_blocks_updated_at
  BEFORE UPDATE ON public.play_map_blocks
  FOR EACH ROW EXECUTE FUNCTION public.set_play_map_blocks_updated_at();

CREATE OR REPLACE FUNCTION public.set_play_map_nodes_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_play_map_nodes_updated_at ON public.play_map_nodes;
CREATE TRIGGER trg_play_map_nodes_updated_at
  BEFORE UPDATE ON public.play_map_nodes
  FOR EACH ROW EXECUTE FUNCTION public.set_play_map_nodes_updated_at();

-- ---------------------------------------------------------------------------
-- 4) RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.play_map_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_map_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.play_map_node_clears ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS play_map_blocks_select_all ON public.play_map_blocks;
CREATE POLICY play_map_blocks_select_all ON public.play_map_blocks
  FOR SELECT USING (true);

DROP POLICY IF EXISTS play_map_nodes_select_all ON public.play_map_nodes;
CREATE POLICY play_map_nodes_select_all ON public.play_map_nodes
  FOR SELECT USING (true);

DROP POLICY IF EXISTS play_map_node_clears_select_own ON public.play_map_node_clears;
CREATE POLICY play_map_node_clears_select_own ON public.play_map_node_clears
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS play_map_node_clears_insert_own ON public.play_map_node_clears;
CREATE POLICY play_map_node_clears_insert_own ON public.play_map_node_clears
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS play_map_node_clears_update_own ON public.play_map_node_clears;
CREATE POLICY play_map_node_clears_update_own ON public.play_map_node_clears
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS play_map_blocks_admin ON public.play_map_blocks;
CREATE POLICY play_map_blocks_admin ON public.play_map_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

DROP POLICY IF EXISTS play_map_nodes_admin ON public.play_map_nodes;
CREATE POLICY play_map_nodes_admin ON public.play_map_nodes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

GRANT SELECT ON public.play_map_blocks TO anon, authenticated;
GRANT SELECT ON public.play_map_nodes TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.play_map_node_clears TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) RPC: record node clear
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_record_play_map_node_clear(
  p_node_id uuid,
  p_time_sec numeric DEFAULT NULL,
  p_rank text DEFAULT NULL,
  p_survive_sec smallint DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_mode text;
  v_node_kind text;
  v_existing public.play_map_node_clears%ROWTYPE;
  v_is_first_clear boolean;
  v_rank_order_new integer;
  v_rank_order_old integer;
  v_should_update boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT b.mode, n.node_kind INTO v_mode, v_node_kind
  FROM public.play_map_nodes AS n
  JOIN public.play_map_blocks AS b ON b.id = n.block_id
  WHERE n.id = p_node_id AND n.is_active AND b.is_active;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'node_not_found');
  END IF;

  SELECT * INTO v_existing
  FROM public.play_map_node_clears
  WHERE user_id = v_uid AND node_id = p_node_id;

  v_is_first_clear := NOT FOUND;

  IF v_node_kind = 'quest' THEN
    -- quest-form node: no time/rank/survive metrics, just record the clear
    INSERT INTO public.play_map_node_clears (
      user_id, node_id, clear_count, first_cleared_at, cleared_at
    ) VALUES (
      v_uid, p_node_id, 1, now(), now()
    )
    ON CONFLICT (user_id, node_id) DO UPDATE SET
      clear_count = play_map_node_clears.clear_count + 1,
      cleared_at = now();
  ELSIF v_mode = 'code_run' THEN
    IF p_time_sec IS NULL OR p_rank IS NULL THEN
      RETURN jsonb_build_object('error', 'missing_time_or_rank');
    END IF;

    SELECT sort_order INTO v_rank_order_new
    FROM public.code_run_rank_thresholds WHERE rank = p_rank;

    IF v_is_first_clear THEN
      v_should_update := true;
    ELSE
      SELECT sort_order INTO v_rank_order_old
      FROM public.code_run_rank_thresholds WHERE rank = v_existing.best_rank;

      v_should_update := (
        p_time_sec < COALESCE(v_existing.best_time_sec, 999999)
        OR (p_time_sec = v_existing.best_time_sec
            AND COALESCE(v_rank_order_new, 99) < COALESCE(v_rank_order_old, 99))
      );
    END IF;

    IF v_is_first_clear OR v_should_update THEN
      INSERT INTO public.play_map_node_clears (
        user_id, node_id, best_time_sec, best_rank, clear_count, first_cleared_at, cleared_at
      ) VALUES (
        v_uid, p_node_id, p_time_sec, p_rank, 1, now(), now()
      )
      ON CONFLICT (user_id, node_id) DO UPDATE SET
        best_time_sec = CASE
          WHEN EXCLUDED.best_time_sec < play_map_node_clears.best_time_sec
            OR play_map_node_clears.best_time_sec IS NULL
          THEN EXCLUDED.best_time_sec
          ELSE play_map_node_clears.best_time_sec
        END,
        best_rank = CASE
          WHEN EXCLUDED.best_time_sec < play_map_node_clears.best_time_sec
            OR play_map_node_clears.best_time_sec IS NULL
          THEN EXCLUDED.best_rank
          ELSE play_map_node_clears.best_rank
        END,
        clear_count = play_map_node_clears.clear_count + 1,
        cleared_at = now();
    ELSE
      UPDATE public.play_map_node_clears
      SET clear_count = clear_count + 1, cleared_at = now()
      WHERE user_id = v_uid AND node_id = p_node_id;
    END IF;
  ELSE
    -- defense: survive_sec only; rank not used
    IF p_survive_sec IS NULL THEN
      RETURN jsonb_build_object('error', 'missing_survive_sec');
    END IF;

    IF v_is_first_clear OR p_survive_sec > COALESCE(v_existing.best_survive_sec, 0) THEN
      INSERT INTO public.play_map_node_clears (
        user_id, node_id, best_survive_sec, clear_count, first_cleared_at, cleared_at
      ) VALUES (
        v_uid, p_node_id, p_survive_sec, 1, now(), now()
      )
      ON CONFLICT (user_id, node_id) DO UPDATE SET
        best_survive_sec = GREATEST(
          COALESCE(play_map_node_clears.best_survive_sec, 0),
          EXCLUDED.best_survive_sec
        ),
        clear_count = play_map_node_clears.clear_count + 1,
        cleared_at = now();
    ELSE
      UPDATE public.play_map_node_clears
      SET clear_count = clear_count + 1, cleared_at = now()
      WHERE user_id = v_uid AND node_id = p_node_id;
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'is_first_clear', v_is_first_clear,
    'node_id', p_node_id,
    'mode', v_mode
  );
END;
$$;

COMMENT ON FUNCTION public.rpc_record_play_map_node_clear(uuid, numeric, text, smallint)
  IS 'Record play map node clear. Returns is_first_clear for XP/badge hooks.';

GRANT EXECUTE ON FUNCTION public.rpc_record_play_map_node_clear(uuid, numeric, text, smallint)
  TO authenticated;

-- ---------------------------------------------------------------------------
-- 6) Extend player XP reasons
-- ---------------------------------------------------------------------------
ALTER TABLE public.player_xp_history
  DROP CONSTRAINT IF EXISTS player_xp_history_reason_check;

ALTER TABLE public.player_xp_history
  ADD CONSTRAINT player_xp_history_reason_check
  CHECK (
    reason = ANY (
      ARRAY[
        'survival_stage_first_clear'::text,
        'lesson_first_clear'::text,
        'code_run_node_first_clear'::text,
        'defense_node_first_clear'::text
      ]
    )
  );

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

  IF p_reason NOT IN (
    'survival_stage_first_clear',
    'lesson_first_clear',
    'code_run_node_first_clear',
    'defense_node_first_clear'
  ) THEN
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

COMMIT;
