-- Training mode: categories, trainings, scores, ranking RPCs, lesson_songs extension
BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Core tables
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.training_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title_ja text NOT NULL,
  title_en text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_free boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.trainings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL REFERENCES public.training_categories(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  title_ja text NOT NULL,
  title_en text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  kind text NOT NULL CHECK (kind IN ('note_reading', 'interval', 'chord', 'scale', 'voicing', 'progression')),
  clef_mode text NOT NULL DEFAULT 'instrument' CHECK (clef_mode IN ('instrument', 'bass_concert', 'grand_concert')),
  use_key_signature boolean NOT NULL DEFAULT false,
  play_root_on_correct boolean NOT NULL DEFAULT true,
  bgm_url text NOT NULL DEFAULT 'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trainings_category_sort ON public.trainings(category_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_trainings_kind ON public.trainings(kind);

CREATE TABLE IF NOT EXISTS public.training_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  training_id uuid NOT NULL REFERENCES public.trainings(id) ON DELETE CASCADE,
  best_score integer NOT NULL DEFAULT 0 CHECK (best_score >= 0),
  best_rank text NOT NULL DEFAULT 'F' CHECK (best_rank IN ('S', 'A', 'B', 'C', 'D', 'E', 'F')),
  achieved_at timestamptz NOT NULL DEFAULT now(),
  play_count integer NOT NULL DEFAULT 1 CHECK (play_count >= 1),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, training_id)
);

CREATE INDEX IF NOT EXISTS idx_training_scores_ranking
  ON public.training_scores(training_id, best_score DESC, achieved_at ASC);

COMMENT ON TABLE public.training_categories IS 'Training mode category grouping.';
COMMENT ON TABLE public.trainings IS 'Training mode drill definitions (config jsonb per kind).';
COMMENT ON TABLE public.training_scores IS 'Best score per user per training (production mode only).';

-- ---------------------------------------------------------------------------
-- 2) Rank helper
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.training_score_to_rank(p_score integer)
RETURNS text AS $$
BEGIN
  IF p_score >= 60 THEN RETURN 'S'; END IF;
  IF p_score >= 50 THEN RETURN 'A'; END IF;
  IF p_score >= 40 THEN RETURN 'B'; END IF;
  IF p_score >= 30 THEN RETURN 'C'; END IF;
  IF p_score >= 20 THEN RETURN 'D'; END IF;
  IF p_score >= 10 THEN RETURN 'E'; END IF;
  RETURN 'F';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------------------------------------------------------------------------
-- 3) RPCs
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
  v_rank text;
  v_prev integer;
  v_new integer;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_score IS NULL OR p_score < 0 THEN
    RAISE EXCEPTION 'Invalid score';
  END IF;

  v_rank := public.training_score_to_rank(p_score);

  INSERT INTO public.training_scores (user_id, training_id, best_score, best_rank, achieved_at, play_count, updated_at)
  VALUES (v_uid, p_training_id, p_score, v_rank, now(), 1, now())
  ON CONFLICT (user_id, training_id) DO UPDATE SET
    play_count = public.training_scores.play_count + 1,
    updated_at = now(),
    best_score = GREATEST(public.training_scores.best_score, EXCLUDED.best_score),
    best_rank = public.training_score_to_rank(GREATEST(public.training_scores.best_score, EXCLUDED.best_score)),
    achieved_at = CASE
      WHEN EXCLUDED.best_score > public.training_scores.best_score THEN now()
      ELSE public.training_scores.achieved_at
    END
  RETURNING
    public.training_scores.best_score,
    public.training_scores.best_rank,
    (public.training_scores.best_score = p_score AND p_score > COALESCE(v_prev, -1))
  INTO best_score, best_rank, is_new_best;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.rpc_get_training_ranking(
  p_training_id uuid,
  limit_count integer DEFAULT 100
)
RETURNS TABLE (
  rank_position bigint,
  user_id uuid,
  nickname text,
  avatar_url text,
  player_level integer,
  best_score integer,
  best_rank text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY ts.best_score DESC, ts.achieved_at ASC) AS rank_position,
    ts.user_id,
    p.nickname,
    p.avatar_url,
    p.player_level,
    ts.best_score,
    ts.best_rank
  FROM public.training_scores ts
  JOIN public.profiles p ON p.id = ts.user_id
  WHERE ts.training_id = p_training_id
    AND ts.best_score > 0
    AND p.nickname IS NOT NULL
    AND p.nickname != '退会ユーザー'
    AND p.email NOT LIKE '%@deleted.local'
  ORDER BY ts.best_score DESC, ts.achieved_at ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.rpc_get_my_training_summary()
RETURNS TABLE (
  training_id uuid,
  best_score integer,
  best_rank text,
  rank_position bigint
) AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ts.training_id,
    ts.best_score,
    ts.best_rank,
    ranked.rn AS rank_position
  FROM public.training_scores ts
  LEFT JOIN LATERAL (
    SELECT COUNT(*) + 1 AS rn
    FROM public.training_scores other
    JOIN public.profiles op ON op.id = other.user_id
    WHERE other.training_id = ts.training_id
      AND (
        other.best_score > ts.best_score
        OR (other.best_score = ts.best_score AND other.achieved_at < ts.achieved_at)
      )
      AND op.nickname IS NOT NULL
      AND op.nickname != '退会ユーザー'
      AND op.email NOT LIKE '%@deleted.local'
  ) ranked ON true
  WHERE ts.user_id = v_uid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.rpc_upsert_training_score(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rpc_get_training_ranking(uuid, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.rpc_get_my_training_summary() TO authenticated;

-- ---------------------------------------------------------------------------
-- 4) RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.training_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY training_categories_select_all ON public.training_categories
  FOR SELECT USING (true);

CREATE POLICY trainings_select_all ON public.trainings
  FOR SELECT USING (true);

CREATE POLICY training_scores_select_all ON public.training_scores
  FOR SELECT USING (true);

CREATE POLICY training_scores_insert_own ON public.training_scores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY training_scores_update_own ON public.training_scores
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY training_categories_admin ON public.training_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY trainings_admin ON public.trainings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

GRANT SELECT ON public.training_categories TO authenticated, anon;
GRANT SELECT ON public.trainings TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON public.training_scores TO authenticated;

-- ---------------------------------------------------------------------------
-- 5) lesson_songs extension
-- ---------------------------------------------------------------------------
ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_training boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS training_id uuid REFERENCES public.trainings(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS training_lesson_config jsonb;

CREATE INDEX IF NOT EXISTS idx_lesson_songs_training_id
  ON public.lesson_songs(training_id)
  WHERE training_id IS NOT NULL;

COMMENT ON COLUMN public.lesson_songs.is_training IS 'レッスン実習: トレーニング課題';
COMMENT ON COLUMN public.lesson_songs.training_id IS 'trainings の参照（is_training=true 時）';
COMMENT ON COLUMN public.lesson_songs.training_lesson_config IS '出題上書き・順序指定など';

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_content_check;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_content_check CHECK (
    (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND song_id IS NOT NULL
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
    )
    OR (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND COALESCE(is_video_lesson, false) = false
      AND COALESCE(is_defense, false) = false
      AND COALESCE(is_training, false) = false
      AND song_id IS NULL
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
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
      AND video_lesson_stage_id IS NULL
      AND defense_stage_id IS NULL
      AND training_id IS NULL
      AND training_lesson_config IS NULL
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
      AND song_id IS NULL
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
      AND song_id IS NULL
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
      AND song_id IS NULL
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
      AND song_id IS NULL
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
      AND song_id IS NULL
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
      AND song_id IS NULL
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
      AND song_id IS NULL
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
      AND song_id IS NULL
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
    )
  );

COMMIT;
