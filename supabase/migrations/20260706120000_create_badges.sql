BEGIN;

CREATE TABLE IF NOT EXISTS public.badges (
  id text PRIMARY KEY,
  category text NOT NULL
    CONSTRAINT badges_category_check
      CHECK (category = ANY (ARRAY[
        'survival_basic'::text,
        'survival_songs'::text,
        'survival_phrases'::text,
        'player_level'::text,
        'quest_clear'::text
      ])),
  rank integer NOT NULL
    CONSTRAINT badges_rank_check CHECK (rank BETWEEN 1 AND 3),
  name text NOT NULL,
  name_en text NOT NULL,
  condition_type text NOT NULL
    CONSTRAINT badges_condition_type_check
      CHECK (condition_type = ANY (ARRAY[
        'survival_stage_clear'::text,
        'player_level_reached'::text,
        'quest_clear_count'::text
      ])),
  condition_value integer NOT NULL
    CONSTRAINT badges_condition_value_check CHECK (condition_value > 0),
  condition_text text NOT NULL,
  condition_text_en text NOT NULL,
  image_path text NOT NULL,
  sort_order integer NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT badges_category_rank_unique UNIQUE (category, rank)
);

CREATE TABLE IF NOT EXISTS public.user_badges (
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  badge_id text NOT NULL REFERENCES public.badges (id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  grant_reason text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user_earned
  ON public.user_badges (user_id, earned_at DESC);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS badges_select_all ON public.badges;
CREATE POLICY badges_select_all
  ON public.badges
  FOR SELECT
  TO anon, authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS user_badges_select_own ON public.user_badges;
CREATE POLICY user_badges_select_own
  ON public.user_badges
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON TABLE public.badges TO anon, authenticated;
GRANT SELECT ON TABLE public.user_badges TO authenticated;

INSERT INTO public.badges (
  id, category, rank, name, name_en, condition_type, condition_value,
  condition_text, condition_text_en, image_path, sort_order
)
VALUES
  ('survival_basic_1', 'survival_basic', 1, '基礎の第一歩', 'Basic Starter', 'survival_stage_clear', 1, 'サバイバル Basic のステージ1を初回クリア', 'Clear Survival Basic stage 1 for the first time', '/achivement/achievement_monster_02.png', 10),
  ('survival_basic_50', 'survival_basic', 2, '基礎固め', 'Basic Builder', 'survival_stage_clear', 50, 'サバイバル Basic のステージ50を初回クリア', 'Clear Survival Basic stage 50 for the first time', '/achivement/achievement_monster_09.png', 20),
  ('survival_basic_100', 'survival_basic', 3, '基礎の達人', 'Basic Master', 'survival_stage_clear', 100, 'サバイバル Basic のステージ100を初回クリア', 'Clear Survival Basic stage 100 for the first time', '/achivement/achievement_monster_11.png', 30),
  ('survival_songs_1', 'survival_songs', 1, '曲に挑む者', 'Song Challenger', 'survival_stage_clear', 1, 'サバイバル Songs のステージ1を初回クリア', 'Clear Survival Songs stage 1 for the first time', '/achivement/achievement_monster_13.png', 40),
  ('survival_songs_50', 'survival_songs', 2, '曲を渡る者', 'Song Voyager', 'survival_stage_clear', 50, 'サバイバル Songs のステージ50を初回クリア', 'Clear Survival Songs stage 50 for the first time', '/achivement/achievement_monster_19.png', 50),
  ('survival_songs_100', 'survival_songs', 3, '曲を制する者', 'Song Conqueror', 'survival_stage_clear', 100, 'サバイバル Songs のステージ100を初回クリア', 'Clear Survival Songs stage 100 for the first time', '/achivement/achievement_monster_22.png', 60),
  ('survival_phrases_1', 'survival_phrases', 1, 'フレーズ見習い', 'Phrase Apprentice', 'survival_stage_clear', 1, 'サバイバル Phrases のステージ1を初回クリア', 'Clear Survival Phrases stage 1 for the first time', '/achivement/achievement_monster_33.png', 70),
  ('survival_phrases_50', 'survival_phrases', 2, 'フレーズ使い', 'Phrase Handler', 'survival_stage_clear', 50, 'サバイバル Phrases のステージ50を初回クリア', 'Clear Survival Phrases stage 50 for the first time', '/achivement/achievement_monster_35.png', 80),
  ('survival_phrases_100', 'survival_phrases', 3, 'フレーズマスター', 'Phrase Master', 'survival_stage_clear', 100, 'サバイバル Phrases のステージ100を初回クリア', 'Clear Survival Phrases stage 100 for the first time', '/achivement/achievement_monster_45.png', 90),
  ('player_level_2', 'player_level', 1, '駆け出しプレイヤー', 'Rising Player', 'player_level_reached', 2, 'プレイヤーレベル2に到達', 'Reach player level 2', '/achivement/achievement_monster_47.png', 100),
  ('player_level_50', 'player_level', 2, '実力派プレイヤー', 'Skilled Player', 'player_level_reached', 50, 'プレイヤーレベル50に到達', 'Reach player level 50', '/achivement/achievement_monster_49.png', 110),
  ('player_level_100', 'player_level', 3, '熟練プレイヤー', 'Veteran Player', 'player_level_reached', 100, 'プレイヤーレベル100に到達', 'Reach player level 100', '/achivement/achievement_monster_51.png', 120),
  ('quest_clear_1', 'quest_clear', 1, 'クエスト見習い', 'Quest Rookie', 'quest_clear_count', 1, 'クエストを1個完了', 'Complete 1 quest', '/achivement/achievement_monster_53.png', 130),
  ('quest_clear_50', 'quest_clear', 2, 'クエスト冒険者', 'Quest Adventurer', 'quest_clear_count', 50, 'クエストを50個完了', 'Complete 50 quests', '/achivement/achievement_monster_55.png', 140),
  ('quest_clear_100', 'quest_clear', 3, 'クエスト制覇者', 'Quest Champion', 'quest_clear_count', 100, 'クエストを100個完了', 'Complete 100 quests', '/achivement/achievement_monster_59.png', 150)
ON CONFLICT (id) DO UPDATE
SET
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
  p_player_level integer DEFAULT NULL
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
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'not_authenticated');
  END IF;

  SELECT p.player_level
  INTO v_level
  FROM public.profiles AS p
  WHERE p.id = v_uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'profile_not_found');
  END IF;

  IF p_player_level IS NOT NULL THEN
    v_level := GREATEST(v_level, p_player_level);
  END IF;

  SELECT COUNT(*)
  INTO v_quest_count
  FROM public.user_lesson_progress AS ulp
  WHERE ulp.user_id = v_uid
    AND ulp.completed IS TRUE;

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
      WHERE b.is_active
        AND b.category = v_category
        AND b.condition_type = 'survival_stage_clear'
        AND b.condition_value <= p_stage_number
        AND EXISTS (
          SELECT 1
          FROM public.survival_stage_clears AS sc
          WHERE sc.user_id = v_uid
            AND sc.map_category = p_map_category
            AND sc.stage_number = b.condition_value
        );
    ELSE
      SELECT COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
      INTO v_candidate_ids
      FROM public.badges AS b
      WHERE b.is_active
        AND b.condition_type = 'survival_stage_clear'
        AND EXISTS (
          SELECT 1
          FROM public.survival_stage_clears AS sc
          WHERE sc.user_id = v_uid
            AND sc.stage_number = b.condition_value
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
    WHERE b.is_active
      AND b.condition_type = 'player_level_reached'
      AND b.condition_value <= v_level;
  END IF;

  IF p_event IN ('quest_clear', 'sync') THEN
    SELECT v_candidate_ids || COALESCE(array_agg(b.id ORDER BY b.sort_order), ARRAY[]::text[])
    INTO v_candidate_ids
    FROM public.badges AS b
    WHERE b.is_active
      AND b.condition_type = 'quest_clear_count'
      AND b.condition_value <= v_quest_count;
  END IF;

  IF p_event NOT IN ('survival_stage_clear', 'level_reached', 'quest_clear', 'sync') THEN
    RETURN jsonb_build_object('error', 'invalid_event');
  END IF;

  WITH candidates AS (
    SELECT DISTINCT unnest(v_candidate_ids) AS badge_id
  ),
  inserted AS (
    INSERT INTO public.user_badges (user_id, badge_id, grant_reason)
    SELECT v_uid, c.badge_id, p_event
    FROM candidates AS c
    JOIN public.badges AS b ON b.id = c.badge_id
    WHERE b.is_active
    ON CONFLICT (user_id, badge_id) DO NOTHING
    RETURNING badge_id, earned_at
  )
  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'badge_id', inserted.badge_id,
        'earned_at', inserted.earned_at
      )
      ORDER BY b.sort_order
    ),
    '[]'::jsonb
  )
  INTO v_inserted
  FROM inserted
  JOIN public.badges AS b ON b.id = inserted.badge_id;

  RETURN v_inserted;
END;
$$;

COMMENT ON TABLE public.badges IS 'Achievement title definitions.';
COMMENT ON TABLE public.user_badges IS 'Earned achievement titles; one row per user/title with immutable earned_at.';
COMMENT ON FUNCTION public.grant_user_badges_for_event(text, text, integer, integer)
  IS 'Validates current DB state and idempotently grants achievement titles for gameplay events.';

REVOKE ALL ON FUNCTION public.grant_user_badges_for_event(text, text, integer, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_user_badges_for_event(text, text, integer, integer) TO authenticated;

COMMIT;
