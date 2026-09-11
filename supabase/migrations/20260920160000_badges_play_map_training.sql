-- Badges: deactivate survival categories, add code_run / defense / training titles.
BEGIN;

-- badges.is_active already exists from create_badges migration

UPDATE public.badges
SET is_active = false, updated_at = now()
WHERE category IN ('survival_basic', 'survival_songs', 'survival_phrases');

-- Category check: allow play-map / training categories (training_<slug> is dynamic)
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
        'defense'::text
      ]
    )
    OR category ~ '^training_[a-z0-9_]+$'
  );

-- Extend condition_type check
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
        'training_category_rank'::text
      ]
    )
  );

-- Code run / defense badges
INSERT INTO public.badges (id, category, rank, name, name_en, condition_type, condition_value, condition_text, condition_text_en, image_path, sort_order)
VALUES
  ('code_run_first_1', 'code_run', 1, 'コードランナー', 'Code Runner', 'play_map_node_clear', 1,
   'コードランを初めてクリア', 'Clear your first Code Run node', '/achivement/achievement_monster_02.png', 110),
  ('code_run_basic_all_2', 'code_run', 2, 'コードラン Basic 制覇', 'Code Run Basic Master', 'play_map_node_clear', 2,
   'コードラン Basic を全クリア', 'Clear all Code Run Basic nodes', '/achivement/achievement_monster_09.png', 111),
  ('code_run_advanced_all_3', 'code_run', 3, 'コードラン Advanced 制覇', 'Code Run Advanced Master', 'play_map_node_clear', 3,
   'コードラン Advanced を全クリア', 'Clear all Code Run Advanced nodes', '/achivement/achievement_monster_11.png', 112),
  ('defense_first_1', 'defense', 1, 'ディフェンダー', 'Defender', 'play_map_node_clear', 1,
   'フレーズディフェンスを初めてクリア', 'Clear your first Phrase Defense node', '/achivement/achievement_monster_13.png', 120),
  ('defense_basic_all_2', 'defense', 2, 'ディフェンス Basic 制覇', 'Defense Basic Master', 'play_map_node_clear', 2,
   'フレーズディフェンス Basic を全クリア', 'Clear all Phrase Defense Basic nodes', '/achivement/achievement_monster_19.png', 121),
  ('defense_advanced_all_3', 'defense', 3, 'ディフェンス Advanced 制覇', 'Defense Advanced Master', 'play_map_node_clear', 3,
   'フレーズディフェンス Advanced を全クリア', 'Clear all Phrase Defense Advanced nodes', '/achivement/achievement_monster_22.png', 122)
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  condition_text = EXCLUDED.condition_text,
  condition_text_en = EXCLUDED.condition_text_en,
  updated_at = now();

-- Training category badges (9 categories × 3 ranks = 27)
INSERT INTO public.badges (id, category, rank, name, name_en, condition_type, condition_value, condition_text, condition_text_en, image_path, sort_order)
SELECT
  'training_' || tc.slug || '_b_' || v.rank::text,
  'training_' || tc.slug,
  v.rank,
  tc.title_ja || ' ' || v.label_ja,
  tc.title_en || ' ' || v.label_en,
  'training_category_rank',
  v.threshold,
  tc.title_ja || 'の全課題を' || v.label_ja || '以上でクリア',
  'Clear all ' || tc.title_en || ' trainings at ' || v.label_en || ' or better',
  '/achivement/achievement_monster_33.png',
  200 + tc.sort_order * 3 + v.rank
FROM public.training_categories AS tc
CROSS JOIN (
  VALUES
    (1, 2, 'B以上', 'B+'),
    (2, 3, 'A以上', 'A+'),
    (3, 4, 'S以上', 'S+')
) AS v(rank, threshold, label_ja, label_en)
WHERE tc.is_active IS NOT FALSE
ON CONFLICT (id) DO UPDATE SET
  is_active = true,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  condition_text = EXCLUDED.condition_text,
  condition_text_en = EXCLUDED.condition_text_en,
  updated_at = now();

-- Extend grant_user_badges_for_event (drop 4-arg overload for single definition)
DROP FUNCTION IF EXISTS public.grant_user_badges_for_event(text, text, integer, integer);

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
  v_code_run_cleared integer;
  v_code_run_basic_total integer;
  v_code_run_basic_cleared integer;
  v_code_run_adv_total integer;
  v_code_run_adv_cleared integer;
  v_defense_cleared integer;
  v_defense_basic_total integer;
  v_defense_basic_cleared integer;
  v_defense_adv_total integer;
  v_defense_adv_cleared integer;
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

  -- Legacy survival badges (is_active=false but keep for sync)
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
    SELECT COUNT(*) INTO v_code_run_cleared
    FROM public.play_map_node_clears AS c
    JOIN public.play_map_nodes AS n ON n.id = c.node_id
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE c.user_id = v_uid AND b.mode = 'code_run';

    SELECT COUNT(*) INTO v_code_run_basic_total FROM public.play_map_nodes AS n
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE b.mode = 'code_run' AND b.tier = 'basic' AND n.is_active AND n.node_kind = 'stage';

    SELECT COUNT(*) INTO v_code_run_basic_cleared
    FROM public.play_map_node_clears AS c
    JOIN public.play_map_nodes AS n ON n.id = c.node_id
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE c.user_id = v_uid AND b.mode = 'code_run' AND b.tier = 'basic' AND n.node_kind = 'stage';

    SELECT COUNT(*) INTO v_code_run_adv_total FROM public.play_map_nodes AS n
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE b.mode = 'code_run' AND b.tier = 'advanced' AND n.is_active AND n.node_kind = 'stage';

    SELECT COUNT(*) INTO v_code_run_adv_cleared
    FROM public.play_map_node_clears AS c
    JOIN public.play_map_nodes AS n ON n.id = c.node_id
    JOIN public.play_map_blocks AS b ON b.id = n.block_id
    WHERE c.user_id = v_uid AND b.mode = 'code_run' AND b.tier = 'advanced' AND n.node_kind = 'stage';

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
        (b.category = 'code_run' AND b.condition_value = 1 AND v_code_run_cleared >= 1)
        OR (b.category = 'code_run' AND b.condition_value = 2
            AND v_code_run_basic_total > 0 AND v_code_run_basic_cleared >= v_code_run_basic_total)
        OR (b.category = 'code_run' AND b.condition_value = 3
            AND v_code_run_adv_total > 0 AND v_code_run_adv_cleared >= v_code_run_adv_total)
        OR (b.category = 'defense' AND b.condition_value = 1 AND v_defense_cleared >= 1)
        OR (b.category = 'defense' AND b.condition_value = 2
            AND v_defense_basic_total > 0 AND v_defense_basic_cleared >= v_defense_basic_total)
        OR (b.category = 'defense' AND b.condition_value = 3
            AND v_defense_adv_total > 0 AND v_defense_adv_cleared >= v_defense_adv_total)
      );
  END IF;

  IF p_event IN ('training_score', 'sync') THEN
    SELECT v_candidate_ids || COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
    INTO v_candidate_ids
    FROM public.badges AS b
    WHERE b.is_active AND b.condition_type = 'training_category_rank'
      AND EXISTS (
        SELECT 1
        FROM public.training_categories AS tc
        WHERE b.category = 'training_' || tc.slug
          AND NOT EXISTS (
            SELECT 1 FROM public.trainings AS t
            WHERE t.category_id = tc.id AND t.is_active IS NOT FALSE
              AND NOT EXISTS (
                SELECT 1 FROM public.training_scores AS ts
                WHERE ts.user_id = v_uid AND ts.training_id = t.id
                  AND (
                    (b.condition_value = 2 AND ts.best_rank IN ('S','A','B'))
                    OR (b.condition_value = 3 AND ts.best_rank IN ('S','A'))
                    OR (b.condition_value = 4 AND ts.best_rank = 'S')
                  )
              )
          )
      );
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
