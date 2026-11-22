-- Call-and-response phrase defense: 5-tier node levels, star rank, endless records & ranking.
-- Additive only; legacy defense_stage_id / difficulty_level / rpc_record_play_map_node_clear unchanged.
BEGIN;

UPDATE public.play_map_nodes AS n
SET
  call_response_difficulty_level = v.cr_level,
  updated_at = now()
FROM (
  VALUES
    ('pd-node-adv-0', 1),
    ('pd-node-adv-1', 2),
    ('pd-node-adv-2', 3),
    ('pd-node-adv-3', 4),
    ('pd-node-adv-4', 5),
    ('pd-node-adv-2-1', 5)
) AS v(node_key, cr_level)
WHERE n.id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000002'::uuid,
  v.node_key
);

ALTER TABLE public.play_map_node_clears
  ADD COLUMN IF NOT EXISTS best_star_rank smallint DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS best_endless_enemies_defeated integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS endless_achieved_at timestamptz DEFAULT NULL;

ALTER TABLE public.play_map_node_clears
  DROP CONSTRAINT IF EXISTS play_map_node_clears_best_star_rank_check;

ALTER TABLE public.play_map_node_clears
  ADD CONSTRAINT play_map_node_clears_best_star_rank_check CHECK (
    best_star_rank IS NULL OR (best_star_rank >= 1 AND best_star_rank <= 3)
  );

ALTER TABLE public.play_map_node_clears
  DROP CONSTRAINT IF EXISTS play_map_node_clears_best_endless_check;

ALTER TABLE public.play_map_node_clears
  ADD CONSTRAINT play_map_node_clears_best_endless_check CHECK (
    best_endless_enemies_defeated IS NULL OR best_endless_enemies_defeated >= 0
  );

COMMENT ON COLUMN public.play_map_node_clears.best_star_rank IS
  'Phrase defense C&R clear star rank 1-3 (max HP / 50-99% / 1-49%).';
COMMENT ON COLUMN public.play_map_node_clears.best_endless_enemies_defeated IS
  'Best total enemies defeated in one play including endless mode after clear.';
COMMENT ON COLUMN public.play_map_node_clears.endless_achieved_at IS
  'When best_endless_enemies_defeated was last improved.';

CREATE INDEX IF NOT EXISTS idx_play_map_node_clears_endless_ranking
  ON public.play_map_node_clears (
    node_id,
    best_endless_enemies_defeated DESC NULLS LAST,
    endless_achieved_at ASC NULLS LAST
  )
  WHERE best_endless_enemies_defeated IS NOT NULL AND best_endless_enemies_defeated > 0;

CREATE TABLE IF NOT EXISTS public.defense_play_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  node_id uuid NOT NULL REFERENCES public.play_map_nodes(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES public.defense_stages(id) ON DELETE CASCADE,
  star_rank smallint NOT NULL CHECK (star_rank >= 1 AND star_rank <= 3),
  entered_endless boolean NOT NULL DEFAULT false,
  enemies_defeated integer NOT NULL DEFAULT 0 CHECK (enemies_defeated >= 0),
  survive_sec integer NOT NULL DEFAULT 0 CHECK (survive_sec >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.defense_play_records IS
  'One row per phrase defense performance play; endless finalization updates the same row.';

CREATE INDEX IF NOT EXISTS idx_defense_play_records_user_created
  ON public.defense_play_records (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_defense_play_records_node_endless
  ON public.defense_play_records (node_id, enemies_defeated DESC, updated_at ASC)
  WHERE entered_endless = true;

ALTER TABLE public.defense_play_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS defense_play_records_select_own ON public.defense_play_records;
CREATE POLICY defense_play_records_select_own ON public.defense_play_records
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS defense_play_records_insert_own ON public.defense_play_records;
CREATE POLICY defense_play_records_insert_own ON public.defense_play_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS defense_play_records_update_own ON public.defense_play_records;
CREATE POLICY defense_play_records_update_own ON public.defense_play_records
  FOR UPDATE USING (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.defense_play_records TO authenticated;

CREATE OR REPLACE FUNCTION public.set_defense_play_records_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_defense_play_records_updated_at ON public.defense_play_records;
CREATE TRIGGER trg_defense_play_records_updated_at
  BEFORE UPDATE ON public.defense_play_records
  FOR EACH ROW EXECUTE FUNCTION public.set_defense_play_records_updated_at();

CREATE OR REPLACE FUNCTION public.rpc_record_defense_clear_v2(
  p_node_id uuid,
  p_stage_id uuid,
  p_star_rank smallint,
  p_survive_sec integer,
  p_enemies_defeated integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_is_first_clear boolean;
  v_record_id uuid;
  v_safe_survive_int integer := GREATEST(0, COALESCE(p_survive_sec, 0));
  v_safe_survive_small smallint := LEAST(32767, GREATEST(0, COALESCE(p_survive_sec, 0)))::smallint;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;
  IF p_star_rank IS NULL OR p_star_rank < 1 OR p_star_rank > 3 THEN
    RETURN jsonb_build_object('error', 'invalid_star_rank');
  END IF;
  IF p_enemies_defeated IS NULL OR p_enemies_defeated < 0 THEN
    RETURN jsonb_build_object('error', 'invalid_enemies_defeated');
  END IF;

  PERFORM 1
  FROM public.play_map_nodes n
  JOIN public.play_map_blocks b ON b.id = n.block_id
  WHERE n.id = p_node_id AND n.is_active AND b.mode = 'defense' AND b.is_active;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'node_not_found');
  END IF;

  PERFORM 1 FROM public.defense_stages WHERE id = p_stage_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'stage_not_found');
  END IF;

  PERFORM 1
  FROM public.play_map_node_clears
  WHERE user_id = v_uid AND node_id = p_node_id;

  v_is_first_clear := NOT FOUND;

  INSERT INTO public.play_map_node_clears (
    user_id, node_id, best_survive_sec, best_star_rank, clear_count, first_cleared_at, cleared_at
  ) VALUES (
    v_uid, p_node_id, v_safe_survive_small, p_star_rank, 1, now(), now()
  )
  ON CONFLICT (user_id, node_id) DO UPDATE SET
    best_survive_sec = GREATEST(
      COALESCE(play_map_node_clears.best_survive_sec, 0),
      COALESCE(EXCLUDED.best_survive_sec, 0)
    ),
    best_star_rank = GREATEST(
      COALESCE(play_map_node_clears.best_star_rank, 0),
      EXCLUDED.best_star_rank
    ),
    clear_count = play_map_node_clears.clear_count + 1,
    cleared_at = now();

  INSERT INTO public.defense_play_records (
    user_id, node_id, stage_id, star_rank, entered_endless, enemies_defeated, survive_sec
  ) VALUES (
    v_uid, p_node_id, p_stage_id, p_star_rank, false, p_enemies_defeated, v_safe_survive_int
  )
  RETURNING id INTO v_record_id;

  RETURN jsonb_build_object(
    'is_first_clear', v_is_first_clear,
    'record_id', v_record_id,
    'node_id', p_node_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_finalize_defense_endless_record(
  p_record_id uuid,
  p_enemies_defeated integer,
  p_survive_sec integer DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.defense_play_records%ROWTYPE;
  v_prev_best integer;
  v_final_enemies integer;
  v_improved boolean := false;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;
  IF p_enemies_defeated IS NULL OR p_enemies_defeated < 0 THEN
    RETURN jsonb_build_object('error', 'invalid_enemies_defeated');
  END IF;

  SELECT * INTO v_row
  FROM public.defense_play_records
  WHERE id = p_record_id AND user_id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'record_not_found');
  END IF;

  v_final_enemies := GREATEST(v_row.enemies_defeated, p_enemies_defeated);

  UPDATE public.defense_play_records
  SET
    entered_endless = true,
    enemies_defeated = v_final_enemies,
    survive_sec = GREATEST(
      defense_play_records.survive_sec,
      COALESCE(p_survive_sec, defense_play_records.survive_sec)
    )
  WHERE id = p_record_id AND user_id = v_uid;

  SELECT best_endless_enemies_defeated INTO v_prev_best
  FROM public.play_map_node_clears
  WHERE user_id = v_uid AND node_id = v_row.node_id;

  IF v_final_enemies > COALESCE(v_prev_best, 0) THEN
    v_improved := true;
    UPDATE public.play_map_node_clears
    SET
      best_endless_enemies_defeated = v_final_enemies,
      endless_achieved_at = now(),
      cleared_at = now()
    WHERE user_id = v_uid AND node_id = v_row.node_id;
  END IF;

  RETURN jsonb_build_object(
    'record_id', p_record_id,
    'node_id', v_row.node_id,
    'improved_endless_best', v_improved,
    'enemies_defeated', v_final_enemies
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_defense_endless_ranking(
  p_node_id uuid,
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  rank_position bigint,
  user_id uuid,
  nickname text,
  avatar_url text,
  player_level integer,
  enemies_defeated integer,
  star_rank smallint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (
      ORDER BY c.best_endless_enemies_defeated DESC, c.endless_achieved_at ASC NULLS LAST
    ) AS rank_position,
    c.user_id,
    p.nickname,
    p.avatar_url,
    p.player_level,
    c.best_endless_enemies_defeated,
    c.best_star_rank
  FROM public.play_map_node_clears c
  JOIN public.profiles p ON p.id = c.user_id
  WHERE c.node_id = p_node_id
    AND c.best_endless_enemies_defeated IS NOT NULL
    AND c.best_endless_enemies_defeated > 0
    AND p.nickname IS NOT NULL
    AND p.nickname != '退会ユーザー'
    AND p.email NOT LIKE '%@deleted.local'
  ORDER BY c.best_endless_enemies_defeated DESC, c.endless_achieved_at ASC NULLS LAST
  LIMIT limit_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.rpc_get_my_defense_endless_summary()
RETURNS TABLE (
  node_id uuid,
  enemies_defeated integer,
  star_rank smallint,
  rank_position bigint
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    c.node_id,
    c.best_endless_enemies_defeated,
    c.best_star_rank,
    ranked.rn AS rank_position
  FROM public.play_map_node_clears c
  LEFT JOIN LATERAL (
    SELECT COUNT(*) + 1 AS rn
    FROM public.play_map_node_clears other
    JOIN public.profiles op ON op.id = other.user_id
    WHERE other.node_id = c.node_id
      AND other.best_endless_enemies_defeated IS NOT NULL
      AND other.best_endless_enemies_defeated > 0
      AND (
        other.best_endless_enemies_defeated > COALESCE(c.best_endless_enemies_defeated, 0)
        OR (
          other.best_endless_enemies_defeated = c.best_endless_enemies_defeated
          AND other.endless_achieved_at < c.endless_achieved_at
        )
      )
      AND op.nickname IS NOT NULL
      AND op.nickname != '退会ユーザー'
      AND op.email NOT LIKE '%@deleted.local'
  ) ranked ON true
  WHERE c.user_id = v_uid
    AND c.best_endless_enemies_defeated IS NOT NULL
    AND c.best_endless_enemies_defeated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.rpc_record_defense_clear_v2(uuid, uuid, smallint, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_finalize_defense_endless_record(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_defense_endless_ranking(uuid, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_defense_endless_summary() TO authenticated;

COMMIT;
