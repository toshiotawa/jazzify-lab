-- Shared lesson requirement results: training_scores / defense_stage_clears → user_lesson_requirements_progress
-- + training goal set lesson requirement type
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) lesson_songs: training goal set requirement type
-- ---------------------------------------------------------------------------
ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_training_goal_set boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS training_goal_set_id uuid REFERENCES public.training_goal_sets(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_lesson_songs_training_goal_set_id
  ON public.lesson_songs(training_goal_set_id)
  WHERE training_goal_set_id IS NOT NULL;

COMMENT ON COLUMN public.lesson_songs.is_training_goal_set IS 'レッスン実習: トレーニング目標セット課題';
COMMENT ON COLUMN public.lesson_songs.training_goal_set_id IS 'training_goal_sets の参照（is_training_goal_set=true 時）';

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_content_check;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_content_check CHECK (
    (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NOT NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NOT NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = true
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NOT NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = true
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NOT NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = true
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NOT NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = true
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NOT NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = true
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NOT NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = true
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NOT NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = true
      AND COALESCE(is_training_goal_set, false) = false
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NOT NULL
      AND training_goal_set_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND COALESCE(is_training_goal_set, false) = true
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
      AND training_goal_set_id IS NOT NULL
    )
  );

-- ---------------------------------------------------------------------------
-- 2) Shared sync helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.lesson_song_is_shareable(p_clear_conditions jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT COALESCE((p_clear_conditions->>'requires_days')::boolean, false) = false
    AND COALESCE((p_clear_conditions->>'count')::integer, 1) <= 1;
$$;

CREATE OR REPLACE FUNCTION public.merge_lesson_requirement_best_rank(
  p_existing text,
  p_new text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_existing = 'S' OR p_new = 'S' THEN 'S'
    WHEN p_existing = 'A' OR p_new = 'A' THEN 'A'
    WHEN p_existing = 'B' OR p_new = 'B' THEN 'B'
    WHEN p_existing = 'C' OR p_new = 'C' THEN 'C'
    WHEN p_existing = 'D' OR p_new = 'D' THEN 'D'
    WHEN p_existing = 'E' OR p_new = 'E' THEN 'E'
    ELSE COALESCE(p_new, p_existing, 'F')
  END;
$$;

CREATE OR REPLACE FUNCTION public.mark_shared_lesson_requirement_completed(
  p_user_id uuid,
  p_lesson_id uuid,
  p_lesson_song_id uuid,
  p_rank text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := CURRENT_DATE;
  v_existing_id uuid;
  v_clear_dates date[];
  v_clear_count integer;
  v_best_rank text;
BEGIN
  SELECT id, clear_dates, clear_count, best_rank
  INTO v_existing_id, v_clear_dates, v_clear_count, v_best_rank
  FROM public.user_lesson_requirements_progress
  WHERE user_id = p_user_id
    AND lesson_id = p_lesson_id
    AND lesson_song_id = p_lesson_song_id
  LIMIT 1;

  IF v_existing_id IS NULL THEN
    v_clear_dates := ARRAY[]::date[];
    v_clear_count := 0;
    v_best_rank := NULL;
  END IF;

  IF v_clear_dates IS NULL THEN
    v_clear_dates := ARRAY[]::date[];
  END IF;

  v_clear_count := GREATEST(COALESCE(v_clear_count, 0), 1);
  IF NOT (v_today = ANY(v_clear_dates)) THEN
    v_clear_dates := array_append(v_clear_dates, v_today);
  END IF;

  v_best_rank := public.merge_lesson_requirement_best_rank(v_best_rank, p_rank);

  IF v_existing_id IS NOT NULL THEN
    UPDATE public.user_lesson_requirements_progress
    SET
      clear_count = v_clear_count,
      clear_dates = v_clear_dates,
      best_rank = v_best_rank,
      last_cleared_at = now(),
      is_completed = true,
      lesson_song_id = p_lesson_song_id
    WHERE id = v_existing_id;
  ELSE
    INSERT INTO public.user_lesson_requirements_progress (
      user_id,
      lesson_id,
      lesson_song_id,
      clear_count,
      clear_dates,
      best_rank,
      last_cleared_at,
      is_completed
    ) VALUES (
      p_user_id,
      p_lesson_id,
      p_lesson_song_id,
      v_clear_count,
      v_clear_dates,
      p_rank,
      now(),
      true
    );
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.training_goal_set_meets_requirements(
  p_user_id uuid,
  p_goal_set_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.training_goal_set_items AS gsi WHERE gsi.goal_set_id = p_goal_set_id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.training_goal_set_items AS gsi
    LEFT JOIN public.training_scores AS ts
      ON ts.user_id = p_user_id AND ts.training_id = gsi.training_id
    WHERE gsi.goal_set_id = p_goal_set_id
      AND (
        ts.best_rank IS NULL
        OR public.training_rank_order(ts.best_rank) < public.training_rank_order(gsi.target_rank)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.sync_training_shared_lesson_requirements(
  p_user_id uuid,
  p_training_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_required_rank text;
  v_best_rank text;
BEGIN
  FOR v_row IN
    SELECT ls.id, ls.lesson_id, ls.clear_conditions, ts.best_rank
    FROM public.lesson_songs AS ls
    JOIN public.training_scores AS ts
      ON ts.user_id = p_user_id AND ts.training_id = ls.training_id
    WHERE ls.is_training IS TRUE
      AND ls.training_id = p_training_id
      AND ls.training_lesson_config IS NULL
      AND public.lesson_song_is_shareable(ls.clear_conditions)
  LOOP
    v_required_rank := COALESCE(v_row.clear_conditions->>'rank', 'C');
    v_best_rank := v_row.best_rank;
    IF v_best_rank IS NOT NULL
      AND public.training_rank_order(v_best_rank) >= public.training_rank_order(v_required_rank) THEN
      PERFORM public.mark_shared_lesson_requirement_completed(
        p_user_id,
        v_row.lesson_id,
        v_row.id,
        v_best_rank
      );
    END IF;
  END LOOP;

  FOR v_row IN
    SELECT ls.id, ls.lesson_id, ls.training_goal_set_id
    FROM public.lesson_songs AS ls
    WHERE ls.is_training_goal_set IS TRUE
      AND ls.training_goal_set_id IS NOT NULL
      AND public.lesson_song_is_shareable(ls.clear_conditions)
      AND EXISTS (
        SELECT 1
        FROM public.training_goal_set_items AS gsi
        WHERE gsi.goal_set_id = ls.training_goal_set_id
          AND gsi.training_id = p_training_id
      )
  LOOP
    IF public.training_goal_set_meets_requirements(p_user_id, v_row.training_goal_set_id) THEN
      PERFORM public.mark_shared_lesson_requirement_completed(
        p_user_id,
        v_row.lesson_id,
        v_row.id,
        'S'
      );
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_defense_shared_lesson_requirements(
  p_user_id uuid,
  p_stage_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_survive_sec smallint;
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM public.defense_stage_clears
    WHERE user_id = p_user_id AND stage_id = p_stage_id
  ) THEN
    RETURN;
  END IF;

  SELECT best_survive_sec
  INTO v_survive_sec
  FROM public.defense_stage_clears
  WHERE user_id = p_user_id AND stage_id = p_stage_id;

  FOR v_row IN
    SELECT ls.id, ls.lesson_id
    FROM public.lesson_songs AS ls
    WHERE ls.is_defense IS TRUE
      AND ls.defense_stage_id = p_stage_id
      AND public.lesson_song_is_shareable(ls.clear_conditions)
  LOOP
    PERFORM public.mark_shared_lesson_requirement_completed(
      p_user_id,
      v_row.lesson_id,
      v_row.id,
      'S'
    );
  END LOOP;

  INSERT INTO public.play_map_node_clears (
    user_id,
    node_id,
    best_survive_sec,
    clear_count,
    first_cleared_at,
    cleared_at
  )
  SELECT
    p_user_id,
    n.id,
    v_survive_sec,
    1,
    now(),
    now()
  FROM public.play_map_nodes AS n
  JOIN public.play_map_blocks AS b ON b.id = n.block_id
  WHERE n.defense_stage_id = p_stage_id
    AND n.is_active IS TRUE
    AND b.is_active IS TRUE
    AND b.mode = 'defense'
    AND n.node_kind = 'stage'
  ON CONFLICT (user_id, node_id) DO UPDATE SET
    best_survive_sec = GREATEST(
      COALESCE(public.play_map_node_clears.best_survive_sec, 0),
      COALESCE(EXCLUDED.best_survive_sec, 0)
    ),
    cleared_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_training_goal_set_shared_lesson_requirements(
  p_user_id uuid,
  p_goal_set_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
BEGIN
  IF NOT public.training_goal_set_meets_requirements(p_user_id, p_goal_set_id) THEN
    RETURN;
  END IF;

  FOR v_row IN
    SELECT ls.id, ls.lesson_id
    FROM public.lesson_songs AS ls
    WHERE ls.is_training_goal_set IS TRUE
      AND ls.training_goal_set_id = p_goal_set_id
      AND public.lesson_song_is_shareable(ls.clear_conditions)
  LOOP
    PERFORM public.mark_shared_lesson_requirement_completed(
      p_user_id,
      v_row.lesson_id,
      v_row.id,
      'S'
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_shared_lesson_requirements_for_lesson_song(
  p_lesson_song_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ls public.lesson_songs%ROWTYPE;
  v_user record;
BEGIN
  SELECT * INTO v_ls
  FROM public.lesson_songs
  WHERE id = p_lesson_song_id;

  IF NOT FOUND OR NOT public.lesson_song_is_shareable(v_ls.clear_conditions) THEN
    RETURN;
  END IF;

  IF v_ls.is_training IS TRUE
    AND v_ls.training_id IS NOT NULL
    AND v_ls.training_lesson_config IS NULL THEN
    FOR v_user IN
      SELECT user_id, training_id
      FROM public.training_scores
      WHERE training_id = v_ls.training_id
    LOOP
      PERFORM public.sync_training_shared_lesson_requirements(v_user.user_id, v_user.training_id);
    END LOOP;
  ELSIF v_ls.is_defense IS TRUE AND v_ls.defense_stage_id IS NOT NULL THEN
    FOR v_user IN
      SELECT user_id, stage_id
      FROM public.defense_stage_clears
      WHERE stage_id = v_ls.defense_stage_id
    LOOP
      PERFORM public.sync_defense_shared_lesson_requirements(v_user.user_id, v_user.stage_id);
    END LOOP;
  ELSIF v_ls.is_training_goal_set IS TRUE AND v_ls.training_goal_set_id IS NOT NULL THEN
    FOR v_user IN
      SELECT DISTINCT ts.user_id
      FROM public.training_goal_set_items AS gsi
      JOIN public.training_scores AS ts ON ts.training_id = gsi.training_id
      WHERE gsi.goal_set_id = v_ls.training_goal_set_id
    LOOP
      PERFORM public.sync_training_goal_set_shared_lesson_requirements(
        v_user.user_id,
        v_ls.training_goal_set_id
      );
    END LOOP;
  END IF;
END;
$$;

-- ---------------------------------------------------------------------------
-- 3) Triggers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_training_scores_sync_lesson_requirements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_training_shared_lesson_requirements(NEW.user_id, NEW.training_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_training_scores_sync_lesson_requirements ON public.training_scores;
CREATE TRIGGER trg_training_scores_sync_lesson_requirements
  AFTER INSERT OR UPDATE OF best_score, best_rank
  ON public.training_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_training_scores_sync_lesson_requirements();

CREATE OR REPLACE FUNCTION public.trg_defense_stage_clears_sync_lesson_requirements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_defense_shared_lesson_requirements(NEW.user_id, NEW.stage_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_defense_stage_clears_sync_lesson_requirements ON public.defense_stage_clears;
CREATE TRIGGER trg_defense_stage_clears_sync_lesson_requirements
  AFTER INSERT OR UPDATE OF best_survive_sec, clear_count
  ON public.defense_stage_clears
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_defense_stage_clears_sync_lesson_requirements();

CREATE OR REPLACE FUNCTION public.trg_lesson_songs_sync_shared_requirements()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.sync_shared_lesson_requirements_for_lesson_song(COALESCE(NEW.id, OLD.id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lesson_songs_sync_shared_requirements ON public.lesson_songs;
CREATE TRIGGER trg_lesson_songs_sync_shared_requirements
  AFTER INSERT OR UPDATE OF
    is_training, training_id, training_lesson_config,
    is_defense, defense_stage_id,
    is_training_goal_set, training_goal_set_id,
    clear_conditions
  ON public.lesson_songs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_lesson_songs_sync_shared_requirements();

-- ---------------------------------------------------------------------------
-- 4) Backfill existing shareable training / defense lesson songs
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  v_lesson_song_id uuid;
BEGIN
  FOR v_lesson_song_id IN
    SELECT ls.id
    FROM public.lesson_songs AS ls
    WHERE (
      (ls.is_training IS TRUE AND ls.training_id IS NOT NULL AND ls.training_lesson_config IS NULL)
      OR (ls.is_defense IS TRUE AND ls.defense_stage_id IS NOT NULL)
      OR (ls.is_training_goal_set IS TRUE AND ls.training_goal_set_id IS NOT NULL)
    )
    AND public.lesson_song_is_shareable(ls.clear_conditions)
  LOOP
    PERFORM public.sync_shared_lesson_requirements_for_lesson_song(v_lesson_song_id);
  END LOOP;
END $$;

-- ---------------------------------------------------------------------------
-- 5) Developer test course sample lessons
-- ---------------------------------------------------------------------------
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, nav_links, assignment_description
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-shared-result-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'トレーニング結果共有（テスト）',
  'Training result sharing (test)',
  'トレーニング/レッスンでクリアしたメジャー・マイナートライアドが相互に反映されることを確認する。',
  'Verify major/minor triad clears sync between training mode and quest assignments.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only;

INSERT INTO public.lesson_songs (
  id, lesson_id, order_index, is_clear_required, clear_conditions,
  is_fantasy, is_survival, is_ear_training, is_balloon_rush,
  is_survival_tutorial, is_ear_training_tutorial, is_video_lesson, is_defense, is_training, is_training_goal_set,
  training_id, title, title_en
) VALUES
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-shared-maj-lsong'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-shared-result-lesson'),
    0,
    true,
    '{"count": 1, "rank": "C"}'::jsonb,
    false, false, false, false,
    false, false, false, false, true, false,
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-triad-maj'),
    'メジャートライアド',
    'Major triad'
  ),
  (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-shared-min-lsong'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-shared-result-lesson'),
    1,
    true,
    '{"count": 1, "rank": "C"}'::jsonb,
    false, false, false, false,
    false, false, false, false, true, false,
    uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-triad-min'),
    'マイナートライアド',
    'Minor triad'
  )
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  order_index = EXCLUDED.order_index,
  is_training = EXCLUDED.is_training,
  training_id = EXCLUDED.training_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en, nav_links, assignment_description
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-goal-set-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test'),
  'トレーニング目標セット（テスト）',
  'Training goal set (test)',
  '目標セット「3和音をマスターしよう」の全課題クリアがレッスン完了条件。',
  'Complete all trainings in the triad goal set to finish this quest.',
  false,
  (SELECT COALESCE(MAX(order_index), 0) + 1 FROM public.lessons WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-developer-test')),
  1,
  'テスト',
  'Test',
  '["lesson"]'::jsonb,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  course_id = EXCLUDED.course_id,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  premium_only = EXCLUDED.premium_only;

INSERT INTO public.lesson_songs (
  id, lesson_id, order_index, is_clear_required, clear_conditions,
  is_fantasy, is_survival, is_ear_training, is_balloon_rush,
  is_survival_tutorial, is_ear_training_tutorial, is_video_lesson, is_defense, is_training, is_training_goal_set,
  training_goal_set_id, title, title_en
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-goal-set-lsong'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'developer-training-goal-set-lesson'),
  0,
  true,
  '{"count": 1}'::jsonb,
  false, false, false, false,
  false, false, false, false, false, true,
  uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-goal-triad'),
  '3和音をマスターしよう',
  'Master triads'
)
ON CONFLICT (id) DO UPDATE SET
  lesson_id = EXCLUDED.lesson_id,
  is_training_goal_set = EXCLUDED.is_training_goal_set,
  training_goal_set_id = EXCLUDED.training_goal_set_id,
  clear_conditions = EXCLUDED.clear_conditions,
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en;

COMMIT;
