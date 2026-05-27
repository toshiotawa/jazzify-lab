-- 風船ラッシュ（レッスン専用）ステージ・吹き出し台本 + lesson_songs 統合
BEGIN;

CREATE TABLE IF NOT EXISTS public.balloon_rush_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_en text,
  description text,
  description_en text,
  stage_type text NOT NULL CHECK (stage_type IN ('random', 'progression')),
  chord_suffix text NOT NULL DEFAULT 'major',
  root_pattern text CHECK (root_pattern IS NULL OR root_pattern IN ('cde', 'fgab', 'sharp', 'flat', 'all')),
  allowed_chords jsonb DEFAULT NULL,
  chord_progression jsonb DEFAULT NULL,
  time_limit_sec integer NOT NULL DEFAULT 90 CHECK (time_limit_sec > 0 AND time_limit_sec <= 3600),
  pop_quota integer NOT NULL DEFAULT 20 CHECK (pop_quota > 0 AND pop_quota <= 999),
  balloon_lifetime_sec numeric NOT NULL DEFAULT 10 CHECK (balloon_lifetime_sec > 0 AND balloon_lifetime_sec <= 300),
  max_concurrent integer NOT NULL DEFAULT 5 CHECK (max_concurrent >= 1 AND max_concurrent <= 20),
  respawn_delay_sec numeric NOT NULL DEFAULT 5 CHECK (respawn_delay_sec >= 0 AND respawn_delay_sec <= 120),
  bgm_url text,
  key_fifths integer NOT NULL DEFAULT 0 CHECK (key_fifths >= -7 AND key_fifths <= 7),
  lesson_only boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT balloon_rush_stages_progression_or_random_chk CHECK (
    (stage_type = 'random' AND chord_progression IS NULL)
    OR (stage_type = 'progression')
  )
);

COMMENT ON TABLE public.balloon_rush_stages IS 'レッスン課題「風船ラッシュ」用ステージ定義（survival_stages とは別）';
COMMENT ON COLUMN public.balloon_rush_stages.allowed_chords IS 'random モード時のコード名配列 JSON。NULL のとき chord_suffix/root_pattern で生成。';

CREATE TABLE IF NOT EXISTS public.balloon_rush_play_dialogues (
  stage_id uuid PRIMARY KEY REFERENCES public.balloon_rush_stages(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT '',
  title_en text NOT NULL DEFAULT '',
  script jsonb NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.balloon_rush_play_dialogues IS '風船ラッシュゲーム中の fai/jajii タイムド吹き出し（survival_stage_play_dialogues と同型 script）';

ALTER TABLE public.balloon_rush_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.balloon_rush_play_dialogues ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS balloon_rush_stages_select_all ON public.balloon_rush_stages;
CREATE POLICY balloon_rush_stages_select_all ON public.balloon_rush_stages
  FOR SELECT USING (
    COALESCE(is_active, true)
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(is_admin, false))
  );

DROP POLICY IF EXISTS balloon_rush_stages_insert_admin ON public.balloon_rush_stages;
CREATE POLICY balloon_rush_stages_insert_admin ON public.balloon_rush_stages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(is_admin, false))
  );

DROP POLICY IF EXISTS balloon_rush_stages_update_admin ON public.balloon_rush_stages;
CREATE POLICY balloon_rush_stages_update_admin ON public.balloon_rush_stages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(is_admin, false))
  );

DROP POLICY IF EXISTS balloon_rush_play_dialogues_select_all ON public.balloon_rush_play_dialogues;
CREATE POLICY balloon_rush_play_dialogues_select_all ON public.balloon_rush_play_dialogues
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.balloon_rush_stages s
      WHERE s.id = balloon_rush_play_dialogues.stage_id
        AND (
          COALESCE(s.is_active, true)
          OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND COALESCE(p.is_admin, false))
        )
    )
  );

DROP POLICY IF EXISTS balloon_rush_play_dialogues_admin ON public.balloon_rush_play_dialogues;
CREATE POLICY balloon_rush_play_dialogues_admin ON public.balloon_rush_play_dialogues
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(is_admin, false))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(is_admin, false))
  );

GRANT SELECT ON public.balloon_rush_stages TO anon, authenticated;
GRANT SELECT ON public.balloon_rush_play_dialogues TO anon, authenticated;

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_balloon_rush boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS balloon_rush_stage_id uuid REFERENCES public.balloon_rush_stages(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_lesson_songs_balloon_rush_stage_id
  ON public.lesson_songs(balloon_rush_stage_id)
  WHERE balloon_rush_stage_id IS NOT NULL;

COMMENT ON COLUMN public.lesson_songs.is_balloon_rush IS 'レッスン実習: 風船ラッシュ課題';
COMMENT ON COLUMN public.lesson_songs.balloon_rush_stage_id IS 'balloon_rush_stages の参照（is_balloon_rush=true 時）';

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
      AND song_id IS NOT NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NOT NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NOT NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = true
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NOT NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = true
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NOT NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = true
      AND COALESCE(is_ear_training_tutorial, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NOT NULL
      AND ear_training_tutorial_script_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = true
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NOT NULL
    )
  );

CREATE OR REPLACE FUNCTION public.set_balloon_rush_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_balloon_rush_stages_updated_at ON public.balloon_rush_stages;
CREATE TRIGGER trg_balloon_rush_stages_updated_at
  BEFORE UPDATE ON public.balloon_rush_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_balloon_rush_updated_at();

DROP TRIGGER IF EXISTS trg_balloon_rush_play_dialogues_updated_at ON public.balloon_rush_play_dialogues;
CREATE TRIGGER trg_balloon_rush_play_dialogues_updated_at
  BEFORE UPDATE ON public.balloon_rush_play_dialogues
  FOR EACH ROW
  EXECUTE FUNCTION public.set_balloon_rush_updated_at();

-- Seed: balloon-rush-dm7-01 (development)
INSERT INTO public.balloon_rush_stages (
  slug, title, title_en, description, description_en,
  stage_type, chord_suffix, root_pattern,
  chord_progression, time_limit_sec, pop_quota,
  balloon_lifetime_sec, max_concurrent, respawn_delay_sec,
  bgm_url, key_fifths, lesson_only, is_active
) VALUES (
  'balloon-rush-dm7-01',
  '風船ラッシュ Dm7',
  'Balloon Rush Dm7',
  '10秒ごとに風船が消えます。B列で〇個割ってクリア。',
  'Balloons expire every 10s. Pop ○ with melee (B slot) to clear.',
  'progression',
  'm7',
  NULL,
  '[
    {"name":"Dm7","voicing":[50,53,57,60,64,69],"voicing_names":["D3","F3","A3","C4","E4","A4"],"key_fifths":0,"voicing_staves":[2,2,2,2,1,1]}
  ]'::jsonb,
  90,
  20,
  10,
  5,
  5,
  'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3',
  0,
  true,
  true
)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.balloon_rush_play_dialogues (
  stage_id, title, title_en, script, is_active
)
SELECT id, '', '', $brscript${
  "lineDurationSeconds": 6,
  "lines": [
    {
      "atSeconds": 1,
      "speaker": "jajii",
      "text": { "ja": "風船じゃワシは触らんぞい。", "en": "Those balloons—I will not poke them myself." }
    },
    {
      "atSeconds": 7,
      "speaker": "fai",
      "text": { "ja": "B列で割ってね。", "en": "Pop them with B slot melee." }
    }
  ]
}$brscript$::jsonb, true
FROM public.balloon_rush_stages
WHERE slug = 'balloon-rush-dm7-01'
ON CONFLICT (stage_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.update_lesson_requirement_progress(
    p_user_id uuid,
    p_lesson_id uuid,
    p_song_id uuid,
    p_rank text,
    p_clear_conditions jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_today date;
    v_clear_dates date[];
    v_clear_count integer;
    v_required_count integer;
    v_required_rank text;
    v_is_completed boolean;
    v_daily_count integer;
    v_daily_progress jsonb;
    v_today_str text;
    v_today_count integer;
    v_completed_days integer;
    v_requires_days boolean;
    v_lesson_song_id uuid;
    v_is_fantasy boolean;
    v_is_ear_training boolean;
    v_is_balloon_rush boolean;
    v_existing_id uuid;
BEGIN
    v_today := CURRENT_DATE;
    v_today_str := v_today::text;

    SELECT id,
           COALESCE(is_fantasy, false),
           COALESCE(is_ear_training, false),
           COALESCE(is_balloon_rush, false)
    INTO v_lesson_song_id, v_is_fantasy, v_is_ear_training, v_is_balloon_rush
    FROM public.lesson_songs
    WHERE id = p_song_id
    LIMIT 1;

    IF FOUND THEN
        p_song_id := NULL;
    ELSE
        SELECT id,
               COALESCE(is_fantasy, false),
               COALESCE(is_ear_training, false),
               COALESCE(is_balloon_rush, false)
        INTO v_lesson_song_id, v_is_fantasy, v_is_ear_training, v_is_balloon_rush
        FROM public.lesson_songs
        WHERE lesson_id = p_lesson_id AND song_id = p_song_id
        LIMIT 1;
    END IF;

    v_required_count := COALESCE((p_clear_conditions->>'count')::integer, 1);
    v_required_rank := COALESCE(p_clear_conditions->>'rank', 'B');
    v_daily_count := COALESCE((p_clear_conditions->>'daily_count')::integer, 1);
    v_requires_days := COALESCE((p_clear_conditions->>'requires_days')::boolean, false);

    SELECT id, clear_dates, clear_count, daily_progress
    INTO v_existing_id, v_clear_dates, v_clear_count, v_daily_progress
    FROM public.user_lesson_requirements_progress
    WHERE user_id = p_user_id
      AND lesson_id = p_lesson_id
      AND (
        (v_lesson_song_id IS NOT NULL AND lesson_song_id = v_lesson_song_id) OR
        (p_song_id IS NOT NULL AND song_id = p_song_id)
      )
    LIMIT 1;

    IF v_existing_id IS NULL THEN
        v_clear_dates := ARRAY[]::date[];
        v_clear_count := 0;
        v_daily_progress := '{}'::jsonb;
    END IF;

    IF v_daily_progress IS NULL THEN
        v_daily_progress := '{}'::jsonb;
    END IF;

    IF v_is_fantasy OR
       v_is_ear_training OR
       v_is_balloon_rush OR
       (p_rank = 'S') OR
       (p_rank IN ('S', 'A') AND v_required_rank IN ('A', 'B', 'C')) OR
       (p_rank IN ('S', 'A', 'B') AND v_required_rank IN ('B', 'C')) OR
       (p_rank IN ('S', 'A', 'B', 'C') AND v_required_rank = 'C') THEN

        IF v_requires_days THEN
            v_today_count := COALESCE((v_daily_progress->v_today_str->>'count')::integer, 0);
            v_today_count := v_today_count + 1;

            v_daily_progress := v_daily_progress || jsonb_build_object(
                v_today_str, jsonb_build_object(
                    'count', v_today_count,
                    'completed', v_today_count >= v_daily_count
                )
            );

            v_completed_days := 0;
            FOR i IN 0..(v_required_count - 1) LOOP
                IF v_daily_progress->(v_today - i)::text->>'completed' = 'true' THEN
                    v_completed_days := v_completed_days + 1;
                ELSE
                    EXIT;
                END IF;
            END LOOP;

            IF NOT (v_today = ANY(v_clear_dates)) AND v_today_count >= v_daily_count THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;

            v_is_completed := v_completed_days >= v_required_count;
        ELSE
            v_clear_count := v_clear_count + 1;
            IF NOT (v_today = ANY(v_clear_dates)) THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
            v_is_completed := v_clear_count >= v_required_count;
        END IF;

        IF v_existing_id IS NOT NULL THEN
            UPDATE public.user_lesson_requirements_progress
            SET
                clear_count = CASE WHEN v_requires_days THEN COALESCE(array_length(v_clear_dates, 1), 0) ELSE v_clear_count END,
                clear_dates = v_clear_dates,
                best_rank = CASE
                    WHEN best_rank = 'S' THEN 'S'
                    WHEN p_rank = 'S' THEN 'S'
                    WHEN best_rank = 'A' OR p_rank = 'A' THEN 'A'
                    WHEN best_rank = 'B' OR p_rank = 'B' THEN 'B'
                    ELSE p_rank
                END,
                last_cleared_at = now(),
                is_completed = v_is_completed,
                daily_progress = v_daily_progress,
                lesson_song_id = v_lesson_song_id
            WHERE id = v_existing_id;
        ELSE
            INSERT INTO public.user_lesson_requirements_progress (
                user_id,
                lesson_id,
                song_id,
                lesson_song_id,
                clear_count,
                clear_dates,
                best_rank,
                last_cleared_at,
                is_completed,
                daily_progress
            ) VALUES (
                p_user_id,
                p_lesson_id,
                p_song_id,
                v_lesson_song_id,
                CASE WHEN v_requires_days THEN COALESCE(array_length(v_clear_dates, 1), 0) ELSE v_clear_count END,
                v_clear_dates,
                p_rank,
                now(),
                v_is_completed,
                v_daily_progress
            );
        END IF;

        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

COMMIT;
