-- Phrase defense input-setup tutorial node (public, no XP on clear).
-- Must run after play_map infrastructure / defense quest seed.

ALTER TABLE public.play_map_nodes
  ADD COLUMN IF NOT EXISTS tutorial_key text DEFAULT NULL;

ALTER TABLE public.play_map_nodes
  DROP CONSTRAINT IF EXISTS play_map_nodes_stage_ref_check;

ALTER TABLE public.play_map_nodes
  DROP CONSTRAINT IF EXISTS play_map_nodes_node_kind_check;

ALTER TABLE public.play_map_nodes
  ADD CONSTRAINT play_map_nodes_node_kind_check
  CHECK (node_kind IN ('stage', 'quest', 'tutorial'));

ALTER TABLE public.play_map_nodes
  ADD CONSTRAINT play_map_nodes_stage_ref_check CHECK (
    (node_kind = 'stage' AND survival_map_category IS NOT NULL AND survival_stage_number IS NOT NULL
      AND defense_stage_id IS NULL AND lesson_id IS NULL AND tutorial_key IS NULL)
    OR (node_kind = 'quest' AND lesson_id IS NOT NULL
      AND survival_map_category IS NULL AND survival_stage_number IS NULL
      AND defense_stage_id IS NULL AND tutorial_key IS NULL)
    OR (node_kind = 'stage' AND defense_stage_id IS NOT NULL
      AND survival_map_category IS NULL AND survival_stage_number IS NULL
      AND lesson_id IS NULL AND tutorial_key IS NULL)
    OR (node_kind = 'tutorial' AND tutorial_key IS NOT NULL
      AND survival_map_category IS NULL AND survival_stage_number IS NULL
      AND defense_stage_id IS NULL AND lesson_id IS NULL)
  );

-- Retire legacy welcome quest to avoid duplicate onboarding.
UPDATE public.play_map_nodes
SET is_active = false, updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000002'::uuid,
  'pd-quest-pd-tutorial'
);

INSERT INTO public.play_map_nodes (
  id, block_id, sort_order, node_kind, tutorial_key, title, title_en, is_active
)
VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-tutorial-input-setup'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'pd-basic-1'),
  -1,
  'tutorial',
  'defense-input-setup-v1',
  'はじめての設定',
  'First-time setup',
  true
)
ON CONFLICT (id) DO UPDATE SET
  node_kind = EXCLUDED.node_kind,
  tutorial_key = EXCLUDED.tutorial_key,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  is_active = true,
  updated_at = now();

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

  IF v_node_kind = 'tutorial' THEN
    INSERT INTO public.play_map_node_clears (
      user_id, node_id, clear_count, first_cleared_at, cleared_at
    ) VALUES (
      v_uid, p_node_id, 1, now(), now()
    )
    ON CONFLICT (user_id, node_id) DO UPDATE SET
      clear_count = play_map_node_clears.clear_count + 1,
      cleared_at = now();
  ELSIF v_node_kind = 'quest' THEN
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
    'is_first_clear', CASE WHEN v_node_kind = 'tutorial' THEN false ELSE v_is_first_clear END,
    'node_id', p_node_id,
    'mode', v_mode
  );
END;
$$;
