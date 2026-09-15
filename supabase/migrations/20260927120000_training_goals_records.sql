-- Training goals, play logs, habit tracking RPCs, badge migration
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Schema extensions
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS timezone text NULL;

COMMENT ON COLUMN public.profiles.timezone IS 'IANA timezone (e.g. Asia/Tokyo). NULL = derive from country/browser.';

ALTER TABLE public.training_categories
  ADD COLUMN IF NOT EXISTS description_ja text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS description_en text NOT NULL DEFAULT '';

-- ---------------------------------------------------------------------------
-- 2) Goal sets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.training_goal_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_ja text NOT NULL,
  title_en text NOT NULL,
  description_ja text NOT NULL DEFAULT '',
  description_en text NOT NULL DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_goal_set_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_set_id uuid NOT NULL REFERENCES public.training_goal_sets(id) ON DELETE CASCADE,
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  target_rank text NOT NULL DEFAULT 'C' CHECK (target_rank IN ('S', 'A', 'B', 'C', 'D', 'E', 'F')),
  sort_order integer NOT NULL DEFAULT 0,
  UNIQUE (goal_set_id, training_id)
);

CREATE INDEX IF NOT EXISTS idx_training_goal_set_items_goal
  ON public.training_goal_set_items(goal_set_id, sort_order);

CREATE TABLE IF NOT EXISTS public.user_training_goals (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_set_id uuid NOT NULL REFERENCES public.training_goal_sets(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.training_play_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  score integer NOT NULL CHECK (score >= 0),
  rank text NOT NULL CHECK (rank IN ('S', 'A', 'B', 'C', 'D', 'E', 'F')),
  played_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_training_play_logs_user_played
  ON public.training_play_logs(user_id, played_at DESC);

CREATE INDEX IF NOT EXISTS idx_training_play_logs_user_training_played
  ON public.training_play_logs(user_id, training_id, played_at DESC);

COMMENT ON TABLE public.training_goal_sets IS 'Training goal set definitions (DB-driven).';
COMMENT ON TABLE public.training_goal_set_items IS 'Trainings and target ranks within a goal set.';
COMMENT ON TABLE public.user_training_goals IS 'User-selected active training goal set.';
COMMENT ON TABLE public.training_play_logs IS 'Production-mode play history (one row per play).';

-- ---------------------------------------------------------------------------
-- 3) RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.training_goal_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_goal_set_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_training_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_play_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY training_goal_sets_select_all ON public.training_goal_sets
  FOR SELECT USING (true);

CREATE POLICY training_goal_set_items_select_all ON public.training_goal_set_items
  FOR SELECT USING (true);

CREATE POLICY training_goal_sets_admin ON public.training_goal_sets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY training_goal_set_items_admin ON public.training_goal_set_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY user_training_goals_select_own ON public.user_training_goals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_training_goals_insert_own ON public.user_training_goals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_training_goals_update_own ON public.user_training_goals
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY training_play_logs_select_own ON public.training_play_logs
  FOR SELECT USING (auth.uid() = user_id);

GRANT SELECT ON public.training_goal_sets TO authenticated, anon;
GRANT SELECT ON public.training_goal_set_items TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.user_training_goals TO authenticated;
GRANT SELECT ON public.training_play_logs TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) Helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.training_rank_order(p_rank text)
RETURNS integer AS $$
BEGIN
  RETURN CASE p_rank
    WHEN 'S' THEN 6
    WHEN 'A' THEN 5
    WHEN 'B' THEN 4
    WHEN 'C' THEN 3
    WHEN 'D' THEN 2
    WHEN 'E' THEN 1
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.training_goal_set_cleared_count(p_uid uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.training_goal_sets AS gs
    WHERE gs.is_active IS TRUE
      AND EXISTS (
        SELECT 1 FROM public.training_goal_set_items AS gsi WHERE gsi.goal_set_id = gs.id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM public.training_goal_set_items AS gsi
        LEFT JOIN public.training_scores AS ts
          ON ts.user_id = p_uid AND ts.training_id = gsi.training_id
        WHERE gsi.goal_set_id = gs.id
          AND (
            ts.best_rank IS NULL
            OR public.training_rank_order(ts.best_rank) < public.training_rank_order(gsi.target_rank)
          )
      )
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.rpc_get_my_training_goal_clear_count()
RETURNS integer AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN 0;
  END IF;
  RETURN public.training_goal_set_cleared_count(v_uid);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.training_rank_order(text) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.training_goal_set_cleared_count(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_training_goal_clear_count() TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) Play log + upsert score (insert log on every production play)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_upsert_training_score(
  p_training_id uuid,
  p_score integer
)
RETURNS TABLE (
  best_score integer,
  best_rank text,
  is_new_best boolean
) AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_prev integer;
  v_new integer;
  v_kind text;
  v_rank text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_score IS NULL OR p_score < 0 THEN
    RAISE EXCEPTION 'Invalid score';
  END IF;

  SELECT kind INTO v_kind
  FROM public.trainings
  WHERE id = p_training_id;

  IF v_kind IS NULL THEN
    RAISE EXCEPTION 'Training not found';
  END IF;

  v_rank := public.training_score_to_rank(p_score, v_kind);

  INSERT INTO public.training_play_logs (user_id, training_id, score, rank, played_at)
  VALUES (v_uid, p_training_id, p_score, v_rank, now());

  SELECT ts.best_score INTO v_prev
  FROM public.training_scores ts
  WHERE ts.user_id = v_uid AND ts.training_id = p_training_id;

  v_new := GREATEST(COALESCE(v_prev, 0), p_score);

  INSERT INTO public.training_scores (user_id, training_id, best_score, best_rank, achieved_at, play_count, updated_at)
  VALUES (v_uid, p_training_id, v_new, public.training_score_to_rank(v_new, v_kind), now(), 1, now())
  ON CONFLICT (user_id, training_id) DO UPDATE SET
    play_count = public.training_scores.play_count + 1,
    updated_at = now(),
    best_score = v_new,
    best_rank = public.training_score_to_rank(v_new, v_kind),
    achieved_at = CASE
      WHEN v_new > public.training_scores.best_score THEN now()
      ELSE public.training_scores.achieved_at
    END;

  best_score := v_new;
  best_rank := public.training_score_to_rank(v_new, v_kind);
  is_new_best := (v_new = p_score AND p_score > COALESCE(v_prev, -1));

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 6) Activity / records RPCs
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_get_training_activity_days(p_tz text)
RETURNS TABLE (day date) AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT ((tpl.played_at AT TIME ZONE p_tz)::date) AS day
  FROM public.training_play_logs AS tpl
  WHERE tpl.user_id = v_uid
  ORDER BY day DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.rpc_get_training_daily_bests(
  p_tz text,
  p_from date,
  p_to date,
  p_training_id uuid DEFAULT NULL
)
RETURNS TABLE (
  day date,
  training_id uuid,
  best_score integer,
  best_rank text
) AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT ON (sub.day, sub.training_id)
    sub.day,
    sub.training_id,
    sub.score AS best_score,
    sub.rank AS best_rank
  FROM (
    SELECT
      ((tpl.played_at AT TIME ZONE p_tz)::date) AS day,
      tpl.training_id,
      tpl.score,
      tpl.rank,
      tpl.played_at
    FROM public.training_play_logs AS tpl
    WHERE tpl.user_id = v_uid
      AND ((tpl.played_at AT TIME ZONE p_tz)::date) >= p_from
      AND ((tpl.played_at AT TIME ZONE p_tz)::date) <= p_to
      AND (p_training_id IS NULL OR tpl.training_id = p_training_id)
  ) AS sub
  ORDER BY sub.day ASC, sub.training_id ASC, sub.score DESC, sub.played_at ASC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.rpc_get_training_record_months(
  p_tz text,
  p_training_id uuid
)
RETURNS TABLE (month_key text) AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT to_char((tpl.played_at AT TIME ZONE p_tz), 'YYYY-MM') AS month_key
  FROM public.training_play_logs AS tpl
  WHERE tpl.user_id = v_uid
    AND tpl.training_id = p_training_id
  ORDER BY month_key DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_get_training_activity_days(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_training_daily_bests(text, date, date, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_training_record_months(text, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- 7) Category descriptions
-- ---------------------------------------------------------------------------
UPDATE public.training_categories SET
  description_ja = CASE slug
    WHEN 'intro' THEN '音符の読み方の基礎を身につけます。ト音記号・ヘ音記号、臨時記号ありなしの課題があります。'
    WHEN 'interval' THEN '2度から7度まで、上行・下行の音程を譜面から素早く読み取る練習です。'
    WHEN 'triad' THEN 'メジャー・マイナーなど3和音のコードを、転回形を指定せずに入力する練習です。'
    WHEN 'triad_inversion' THEN '3和音の基本形・転回形を指定どおりに入力する練習です。'
    WHEN 'seventh' THEN '4和音（7thコード）を、転回形を指定せずに入力する練習です。'
    WHEN 'seventh_inversion' THEN '4和音の基本形・転回形を指定どおりに入力する練習です。'
    WHEN 'scale_basic' THEN 'メジャー・ナチュラルマイナーなど初級スケールの読み取り練習です。'
    WHEN 'scale_intermediate' THEN 'ドリアン・ミクソリディアンなど中級スケールの読み取り練習です。'
    WHEN 'scale_advanced' THEN '上級スケールの読み取り練習です。'
    WHEN 'tension_voicing' THEN 'テンションノートを含む4和音ヴォイシングの読み取り練習です。'
    WHEN 'tension_voicing_ab' THEN 'A/Bフォームのテンションヴォイシングを譜面から入力する練習です。'
    WHEN 'two_hand_voicing' THEN '両手で演奏するジャズヴォイシングの読み取り練習です。'
    ELSE description_ja
  END,
  description_en = CASE slug
    WHEN 'intro' THEN 'Learn to read notes on the staff — treble and bass clefs, with and without accidentals.'
    WHEN 'interval' THEN 'Read intervals from 2nds through 7ths, ascending and descending.'
    WHEN 'triad' THEN 'Enter triads (major, minor, etc.) without specifying inversions.'
    WHEN 'triad_inversion' THEN 'Enter triads in the specified root position or inversion.'
    WHEN 'seventh' THEN 'Enter seventh chords without specifying inversions.'
    WHEN 'seventh_inversion' THEN 'Enter seventh chords in the specified root position or inversion.'
    WHEN 'scale_basic' THEN 'Read basic scales such as major and natural minor.'
    WHEN 'scale_intermediate' THEN 'Read intermediate scales such as Dorian and Mixolydian.'
    WHEN 'scale_advanced' THEN 'Read advanced scales.'
    WHEN 'tension_voicing' THEN 'Read four-note voicings with tension notes.'
    WHEN 'tension_voicing_ab' THEN 'Enter A/B-form tension voicings from the staff.'
    WHEN 'two_hand_voicing' THEN 'Read two-hand jazz voicings.'
    ELSE description_en
  END,
  updated_at = now()
WHERE is_active IS TRUE;

-- ---------------------------------------------------------------------------
-- 8) Goal set seed (one per active category)
-- ---------------------------------------------------------------------------
INSERT INTO public.training_goal_sets (id, slug, title_ja, title_en, description_ja, description_en, sort_order, is_active)
SELECT
  uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-goal-' || tc.slug),
  'goal-' || tc.slug,
  CASE
    WHEN tc.slug = 'intro' THEN '音符の読み方をマスターしよう'
    ELSE tc.title_ja || 'をマスターしよう'
  END,
  CASE
    WHEN tc.slug = 'intro' THEN 'Master note reading'
    ELSE 'Master ' || tc.title_en
  END,
  tc.description_ja,
  tc.description_en,
  tc.sort_order,
  true
FROM public.training_categories AS tc
WHERE tc.is_active IS TRUE
ON CONFLICT (slug) DO UPDATE SET
  title_ja = EXCLUDED.title_ja,
  title_en = EXCLUDED.title_en,
  description_ja = EXCLUDED.description_ja,
  description_en = EXCLUDED.description_en,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  updated_at = now();

INSERT INTO public.training_goal_set_items (goal_set_id, training_id, target_rank, sort_order)
SELECT
  gs.id,
  t.id,
  'C',
  t.sort_order
FROM public.training_goal_sets AS gs
JOIN public.training_categories AS tc ON tc.slug = replace(gs.slug, 'goal-', '')
JOIN public.trainings AS t ON t.category_id = tc.id AND t.is_active IS NOT FALSE
ON CONFLICT (goal_set_id, training_id) DO UPDATE SET
  target_rank = EXCLUDED.target_rank,
  sort_order = EXCLUDED.sort_order;

-- ---------------------------------------------------------------------------
-- 9) Badges: deactivate category-rank training badges, add goal-clear badges
-- ---------------------------------------------------------------------------
UPDATE public.badges
SET is_active = false, updated_at = now()
WHERE condition_type = 'training_category_rank';

ALTER TABLE public.badges
  DROP CONSTRAINT IF EXISTS badges_category_check;

ALTER TABLE public.badges
  ADD CONSTRAINT badges_category_check
  CHECK (
    category = ANY (
      ARRAY[
        'survival_basic'::text,
        'survival_songs'::text,
        'survival_phrases'::text,
        'player_level'::text,
        'quest_clear'::text,
        'code_run'::text,
        'defense'::text,
        'training_goal'::text
      ]
    )
    OR category ~ '^training_[a-z0-9_]+$'
  );

ALTER TABLE public.badges
  DROP CONSTRAINT IF EXISTS badges_condition_type_check;

ALTER TABLE public.badges
  ADD CONSTRAINT badges_condition_type_check
  CHECK (
    condition_type = ANY (
      ARRAY[
        'survival_stage_clear'::text,
        'player_level_reached'::text,
        'quest_clear_count'::text,
        'play_map_node_clear'::text,
        'training_category_rank'::text,
        'training_goal_clear_count'::text
      ]
    )
  );

INSERT INTO public.badges (id, category, rank, name, name_en, condition_type, condition_value, condition_text, condition_text_en, image_path, sort_order, is_active)
VALUES
  ('training_goal_clear_1', 'training_goal', 1, 'トレーニング目標クリア', 'Training Goal Clear', 'training_goal_clear_count', 1,
   'トレーニング目標を1個クリア', 'Clear 1 training goal set', '/achivement/achievement_monster_33.png', 130, true),
  ('training_goal_clear_10', 'training_goal', 2, 'トレーニング目標10個クリア', '10 Training Goals Cleared', 'training_goal_clear_count', 10,
   'トレーニング目標を10個クリア', 'Clear 10 training goal sets', '/achivement/achievement_monster_33.png', 131, true),
  ('training_goal_clear_20', 'training_goal', 3, 'トレーニング目標20個クリア', '20 Training Goals Cleared', 'training_goal_clear_count', 20,
   'トレーニング目標を20個クリア', 'Clear 20 training goal sets', '/achivement/achievement_monster_33.png', 132, true)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  rank = EXCLUDED.rank,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  condition_text = EXCLUDED.condition_text,
  condition_text_en = EXCLUDED.condition_text_en,
  is_active = true,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.grant_user_badges_for_event(
  p_event text,
  p_map_category text DEFAULT NULL,
  p_stage_number integer DEFAULT NULL,
  p_player_level integer DEFAULT NULL,
  p_mode text DEFAULT NULL,
  p_tier text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_category text;
  v_level integer;
  v_quest_count integer;
  v_candidate_ids text[] := ARRAY[]::text[];
  v_inserted jsonb;
  v_defense_cleared integer;
  v_defense_basic_total integer;
  v_defense_basic_cleared integer;
  v_defense_adv_total integer;
  v_defense_adv_cleared integer;
  v_training_goal_cleared integer;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT p.player_level INTO v_level FROM public.profiles AS p WHERE p.id = v_uid;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  IF p_player_level IS NOT NULL THEN
    v_level := GREATEST(v_level, p_player_level);
  END IF;

  SELECT COUNT(*) INTO v_quest_count
  FROM public.user_lesson_progress AS ulp
  WHERE ulp.user_id = v_uid AND ulp.completed IS TRUE;

  IF p_event IN ('survival_stage_clear', 'sync') THEN
    IF p_event = 'survival_stage_clear' THEN
      IF p_map_category NOT IN ('basic', 'songs', 'phrases') OR p_stage_number IS NULL THEN
        RETURN jsonb_build_object('error', 'invalid_survival_event');
      END IF;
      v_category := CASE p_map_category
        WHEN 'basic' THEN 'survival_basic'
        WHEN 'songs' THEN 'survival_songs'
        WHEN 'phrases' THEN 'survival_phrases'
        ELSE NULL
      END;
      SELECT COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
      INTO v_candidate_ids
      FROM public.badges AS b
      WHERE b.is_active AND b.category = v_category
        AND b.condition_type = 'survival_stage_clear'
        AND b.condition_value <= p_stage_number
        AND EXISTS (
          SELECT 1 FROM public.survival_stage_clears AS sc
          WHERE sc.user_id = v_uid AND sc.map_category = p_map_category
            AND sc.stage_number = b.condition_value
        );
    ELSE
      SELECT COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
      INTO v_candidate_ids
      FROM public.badges AS b
      WHERE b.is_active AND b.condition_type = 'survival_stage_clear'
        AND EXISTS (
          SELECT 1 FROM public.survival_stage_clears AS sc
          WHERE sc.user_id = v_uid AND sc.stage_number = b.condition_value
            AND (
              (b.category = 'survival_basic' AND sc.map_category = 'basic') OR
              (b.category = 'survival_songs' AND sc.map_category = 'songs') OR
              (b.category = 'survival_phrases' AND sc.map_category = 'phrases')
            )
        );
    END IF;
  END IF;

  IF p_event IN ('level_reached', 'sync') THEN
    SELECT v_candidate_ids || COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
    INTO v_candidate_ids
    FROM public.badges AS b
    WHERE b.is_active AND b.condition_type = 'player_level_reached'
      AND b.condition_value <= v_level;
  END IF;

  IF p_event IN ('quest_clear', 'sync') THEN
    SELECT v_candidate_ids || COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
    INTO v_candidate_ids
    FROM public.badges AS b
    WHERE b.is_active AND b.condition_type = 'quest_clear_count'
      AND b.condition_value <= v_quest_count;
  END IF;

  IF p_event IN ('play_map_node_clear', 'sync') THEN
    SELECT COUNT(*) INTO v_defense_cleared
    FROM public.play_map_node_clears AS c
    JOIN public.play_map_nodes AS n ON n.id = c.node_id
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE c.user_id = v_uid AND b.mode = 'defense';

    SELECT COUNT(*) INTO v_defense_basic_total FROM public.play_map_nodes AS n
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE b.mode = 'defense' AND b.tier = 'basic' AND n.is_active AND n.node_kind = 'stage';

    SELECT COUNT(*) INTO v_defense_basic_cleared
    FROM public.play_map_node_clears AS c
    JOIN public.play_map_nodes AS n ON n.id = c.node_id
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE c.user_id = v_uid AND b.mode = 'defense' AND b.tier = 'basic' AND n.node_kind = 'stage';

    SELECT COUNT(*) INTO v_defense_adv_total FROM public.play_map_nodes AS n
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE b.mode = 'defense' AND b.tier = 'advanced' AND n.is_active AND n.node_kind = 'stage';

    SELECT COUNT(*) INTO v_defense_adv_cleared
    FROM public.play_map_node_clears AS c
    JOIN public.play_map_nodes AS n ON n.id = c.node_id
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE c.user_id = v_uid AND b.mode = 'defense' AND b.tier = 'advanced' AND n.node_kind = 'stage';

    SELECT v_candidate_ids || COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
    INTO v_candidate_ids
    FROM public.badges AS b
    WHERE b.is_active AND b.condition_type = 'play_map_node_clear'
      AND (
        (b.category = 'defense' AND b.condition_value = 1 AND v_defense_cleared >= 1)
        OR (b.category = 'defense' AND b.condition_value = 2
            AND v_defense_basic_total > 0 AND v_defense_basic_cleared >= v_defense_basic_total)
        OR (b.category = 'defense' AND b.condition_value = 3
            AND v_defense_adv_total > 0 AND v_defense_adv_cleared >= v_defense_adv_total)
      );
  END IF;

  IF p_event IN ('training_score', 'sync') THEN
    v_training_goal_cleared := public.training_goal_set_cleared_count(v_uid);

    SELECT v_candidate_ids || COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
    INTO v_candidate_ids
    FROM public.badges AS b
    WHERE b.is_active AND b.condition_type = 'training_goal_clear_count'
      AND b.condition_value <= v_training_goal_cleared;
  END IF;

  IF p_event NOT IN (
    'survival_stage_clear', 'level_reached', 'quest_clear', 'sync',
    'play_map_node_clear', 'training_score'
  ) THEN
    RETURN jsonb_build_object('error', 'invalid_event');
  END IF;

  WITH candidates AS (
    SELECT DISTINCT unnest(v_candidate_ids) AS badge_id
  ),
  inserted AS (
    INSERT INTO public.user_badges (user_id, badge_id, grant_reason)
    SELECT v_uid, c.badge_id, p_event
    FROM candidates AS c
    ON CONFLICT (user_id, badge_id) DO NOTHING
    RETURNING badge_id
  )
  SELECT COALESCE(jsonb_agg(i.badge_id), '[]'::jsonb) INTO v_inserted FROM inserted AS i;

  RETURN jsonb_build_object('granted', v_inserted);
END;
$$;

GRANT EXECUTE ON FUNCTION public.grant_user_badges_for_event(text, text, integer, integer, text, text)
  TO authenticated;

COMMIT;
