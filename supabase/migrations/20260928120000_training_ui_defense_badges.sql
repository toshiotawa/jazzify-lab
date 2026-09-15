-- Training UI text, goal set templates, training title fix, defense cumulative clear badges
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Training title: シャープフラットあり → 臨時記号あり
-- ---------------------------------------------------------------------------
UPDATE public.trainings
SET title_ja = replace(title_ja, 'シャープフラットあり', '臨時記号あり'),
    updated_at = now()
WHERE slug IN ('note-reading-treble-accidentals', 'note-reading-bass-accidentals');

-- ---------------------------------------------------------------------------
-- 2) Goal set templates: target instrument / level
-- ---------------------------------------------------------------------------
ALTER TABLE public.training_goal_sets
  ADD COLUMN IF NOT EXISTS target_instrument text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS target_level text NOT NULL DEFAULT 'beginner';

ALTER TABLE public.training_goal_sets
  DROP CONSTRAINT IF EXISTS training_goal_sets_target_instrument_check;

ALTER TABLE public.training_goal_sets
  ADD CONSTRAINT training_goal_sets_target_instrument_check
  CHECK (target_instrument IN ('piano', 'all'));

ALTER TABLE public.training_goal_sets
  DROP CONSTRAINT IF EXISTS training_goal_sets_target_level_check;

ALTER TABLE public.training_goal_sets
  ADD CONSTRAINT training_goal_sets_target_level_check
  CHECK (target_level IN ('beginner', 'intermediate', 'advanced'));

UPDATE public.training_goal_sets SET target_instrument = 'all', target_level = 'beginner'
WHERE slug IN ('goal-intro', 'goal-interval', 'goal-scale_basic');

UPDATE public.training_goal_sets SET target_instrument = 'all', target_level = 'intermediate'
WHERE slug IN ('goal-scale_intermediate');

UPDATE public.training_goal_sets SET target_instrument = 'all', target_level = 'advanced'
WHERE slug IN ('goal-scale_advanced');

UPDATE public.training_goal_sets SET target_instrument = 'piano', target_level = 'beginner'
WHERE slug IN ('goal-triad');

UPDATE public.training_goal_sets SET target_instrument = 'piano', target_level = 'intermediate'
WHERE slug IN ('goal-triad_inversion', 'goal-seventh', 'goal-seventh_inversion');

UPDATE public.training_goal_sets SET target_instrument = 'piano', target_level = 'advanced'
WHERE slug IN ('goal-tension_voicing', 'goal-tension_voicing_ab', 'goal-two_hand_voicing');

-- ---------------------------------------------------------------------------
-- 3) Training page info text (DB-driven)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.training_ui_texts (
  key text PRIMARY KEY,
  text_ja text NOT NULL DEFAULT '',
  text_en text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.training_ui_texts IS 'DB-driven UI copy for training screens.';

ALTER TABLE public.training_ui_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS training_ui_texts_select_all ON public.training_ui_texts;
CREATE POLICY training_ui_texts_select_all ON public.training_ui_texts
  FOR SELECT USING (true);

INSERT INTO public.training_ui_texts (key, text_ja, text_en)
VALUES (
  'page_info',
  '1分間ドリル形式のトレーニングです。練習モードは時間無制限で何度でも挑戦できます。本番モードではスコアが記録され、ランキングに反映されます。目標セットを選んで、段階的にスキルアップしましょう。',
  'Training drills run for one minute in production mode. Practice mode has no time limit. Production mode records your score and contributes to rankings. Choose a goal set and level up step by step.'
)
ON CONFLICT (key) DO UPDATE SET
  text_ja = EXCLUDED.text_ja,
  text_en = EXCLUDED.text_en,
  updated_at = now();

-- ---------------------------------------------------------------------------
-- 4) Defense cumulative clear badges
-- ---------------------------------------------------------------------------
UPDATE public.badges
SET is_active = false, updated_at = now()
WHERE id IN ('defense_basic_all_2', 'defense_advanced_all_3');

ALTER TABLE public.badges
  DROP CONSTRAINT IF EXISTS badges_rank_check;

ALTER TABLE public.badges
  ADD CONSTRAINT badges_rank_check
  CHECK (rank >= 1 AND rank <= 4);

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
        'defense_basic'::text,
        'defense_advanced'::text,
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
        'training_goal_clear_count'::text,
        'defense_tier_clear_count'::text
      ]
    )
  );

INSERT INTO public.badges (id, category, rank, name, name_en, condition_type, condition_value, condition_text, condition_text_en, image_path, sort_order, is_active)
VALUES
  ('defense_basic_clears_50', 'defense_basic', 1, 'Basic 累計50回クリア', 'Basic: 50 Clears', 'defense_tier_clear_count', 50,
   'フレーズディフェンス Basic を累計50回クリア', 'Clear Phrase Defense Basic 50 times (cumulative)', '/achivement/achievement_monster_19.png', 121, true),
  ('defense_basic_clears_500', 'defense_basic', 2, 'Basic 累計500回クリア', 'Basic: 500 Clears', 'defense_tier_clear_count', 500,
   'フレーズディフェンス Basic を累計500回クリア', 'Clear Phrase Defense Basic 500 times (cumulative)', '/achivement/achievement_monster_19.png', 122, true),
  ('defense_basic_clears_1000', 'defense_basic', 3, 'Basic 累計1000回クリア', 'Basic: 1,000 Clears', 'defense_tier_clear_count', 1000,
   'フレーズディフェンス Basic を累計1000回クリア', 'Clear Phrase Defense Basic 1,000 times (cumulative)', '/achivement/achievement_monster_19.png', 123, true),
  ('defense_basic_clears_10000', 'defense_basic', 4, 'Basic 累計10000回クリア', 'Basic: 10,000 Clears', 'defense_tier_clear_count', 10000,
   'フレーズディフェンス Basic を累計10000回クリア', 'Clear Phrase Defense Basic 10,000 times (cumulative)', '/achivement/achievement_monster_19.png', 124, true),
  ('defense_advanced_clears_50', 'defense_advanced', 1, 'Advanced 累計50回クリア', 'Advanced: 50 Clears', 'defense_tier_clear_count', 50,
   'フレーズディフェンス Advanced を累計50回クリア', 'Clear Phrase Defense Advanced 50 times (cumulative)', '/achivement/achievement_monster_22.png', 125, true),
  ('defense_advanced_clears_500', 'defense_advanced', 2, 'Advanced 累計500回クリア', 'Advanced: 500 Clears', 'defense_tier_clear_count', 500,
   'フレーズディフェンス Advanced を累計500回クリア', 'Clear Phrase Defense Advanced 500 times (cumulative)', '/achivement/achievement_monster_22.png', 126, true),
  ('defense_advanced_clears_1000', 'defense_advanced', 3, 'Advanced 累計1000回クリア', 'Advanced: 1,000 Clears', 'defense_tier_clear_count', 1000,
   'フレーズディフェンス Advanced を累計1000回クリア', 'Clear Phrase Defense Advanced 1,000 times (cumulative)', '/achivement/achievement_monster_22.png', 127, true),
  ('defense_advanced_clears_10000', 'defense_advanced', 4, 'Advanced 累計10000回クリア', 'Advanced: 10,000 Clears', 'defense_tier_clear_count', 10000,
   'フレーズディフェンス Advanced を累計10000回クリア', 'Clear Phrase Defense Advanced 10,000 times (cumulative)', '/achivement/achievement_monster_22.png', 128, true)
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  rank = EXCLUDED.rank,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  condition_type = EXCLUDED.condition_type,
  condition_value = EXCLUDED.condition_value,
  condition_text = EXCLUDED.condition_text,
  condition_text_en = EXCLUDED.condition_text_en,
  image_path = EXCLUDED.image_path,
  sort_order = EXCLUDED.sort_order,
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
  v_defense_basic_clear_count integer;
  v_defense_adv_clear_count integer;
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

    SELECT COALESCE(SUM(c.clear_count), 0)::integer INTO v_defense_basic_clear_count
    FROM public.play_map_node_clears AS c
    JOIN public.play_map_nodes AS n ON n.id = c.node_id
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE c.user_id = v_uid AND b.mode = 'defense' AND b.tier = 'basic' AND n.node_kind = 'stage';

    SELECT COALESCE(SUM(c.clear_count), 0)::integer INTO v_defense_adv_clear_count
    FROM public.play_map_node_clears AS c
    JOIN public.play_map_nodes AS n ON n.id = c.node_id
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE c.user_id = v_uid AND b.mode = 'defense' AND b.tier = 'advanced' AND n.node_kind = 'stage';

    SELECT v_candidate_ids || COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
    INTO v_candidate_ids
    FROM public.badges AS b
    WHERE b.is_active AND b.condition_type = 'play_map_node_clear'
      AND b.category = 'defense'
      AND b.condition_value = 1
      AND v_defense_cleared >= 1;

    SELECT v_candidate_ids || COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
    INTO v_candidate_ids
    FROM public.badges AS b
    WHERE b.is_active AND b.condition_type = 'defense_tier_clear_count'
      AND b.category = 'defense_basic'
      AND b.condition_value <= v_defense_basic_clear_count;

    SELECT v_candidate_ids || COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
    INTO v_candidate_ids
    FROM public.badges AS b
    WHERE b.is_active AND b.condition_type = 'defense_tier_clear_count'
      AND b.category = 'defense_advanced'
      AND b.condition_value <= v_defense_adv_clear_count;
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
