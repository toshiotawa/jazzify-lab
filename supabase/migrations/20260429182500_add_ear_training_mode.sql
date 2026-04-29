-- Add ear training battle mode tables and lesson_songs integration.

CREATE TABLE IF NOT EXISTS public.ear_training_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  title_en text,
  description text,
  description_en text,
  bpm integer NOT NULL DEFAULT 120 CHECK (bpm > 0 AND bpm <= 320),
  beats_per_measure integer NOT NULL DEFAULT 4 CHECK (beats_per_measure > 0 AND beats_per_measure <= 16),
  beat_type integer NOT NULL DEFAULT 4 CHECK (beat_type IN (2, 4, 8, 16)),
  loop_measures integer NOT NULL DEFAULT 2 CHECK (loop_measures > 0 AND loop_measures <= 32),
  max_loops_per_phrase integer NOT NULL DEFAULT 6 CHECK (max_loops_per_phrase > 0 AND max_loops_per_phrase <= 16),
  count_in_beats integer NOT NULL DEFAULT 4 CHECK (count_in_beats >= 0 AND count_in_beats <= 16),
  time_limit_sec integer NOT NULL DEFAULT 120 CHECK (time_limit_sec > 0 AND time_limit_sec <= 1800),
  player_hp integer NOT NULL DEFAULT 100 CHECK (player_hp > 0),
  enemy_hp integer NOT NULL DEFAULT 100 CHECK (enemy_hp > 0),
  per_correct_note_damage integer NOT NULL DEFAULT 1 CHECK (per_correct_note_damage >= 0),
  good_completion_damage integer NOT NULL DEFAULT 8 CHECK (good_completion_damage >= 0),
  great_completion_damage integer NOT NULL DEFAULT 12 CHECK (great_completion_damage >= 0),
  perfect_completion_damage integer NOT NULL DEFAULT 16 CHECK (perfect_completion_damage >= 0),
  miss_damage integer NOT NULL DEFAULT 3 CHECK (miss_damage >= 0),
  fail_damage integer NOT NULL DEFAULT 10 CHECK (fail_damage >= 0),
  perfect_max_misses integer NOT NULL DEFAULT 0 CHECK (perfect_max_misses >= 0),
  great_max_misses integer NOT NULL DEFAULT 2 CHECK (great_max_misses >= 0),
  background_theme text NOT NULL DEFAULT 'blue_club',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ear_training_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.ear_training_stages(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  title text,
  title_en text,
  music_xml_url text,
  audio_url text NOT NULL,
  loop_duration_sec numeric NOT NULL DEFAULT 4 CHECK (loop_duration_sec > 0),
  audio_duration_sec numeric NOT NULL DEFAULT 24 CHECK (audio_duration_sec > 0),
  note_count integer NOT NULL DEFAULT 0 CHECK (note_count >= 0 AND note_count <= 32),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.ear_training_phrase_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_id uuid NOT NULL REFERENCES public.ear_training_phrases(id) ON DELETE CASCADE,
  note_index integer NOT NULL CHECK (note_index >= 0 AND note_index < 32),
  pitch_midi integer NOT NULL CHECK (pitch_midi >= 0 AND pitch_midi <= 127),
  pitch_class integer NOT NULL CHECK (pitch_class >= 0 AND pitch_class <= 11),
  note_name text NOT NULL,
  octave integer,
  measure_number integer CHECK (measure_number IS NULL OR measure_number >= 1),
  beat_offset numeric CHECK (beat_offset IS NULL OR beat_offset >= 0),
  tied_from_previous boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phrase_id, note_index)
);

CREATE TABLE IF NOT EXISTS public.ear_training_phrase_chords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_id uuid NOT NULL REFERENCES public.ear_training_phrases(id) ON DELETE CASCADE,
  order_index integer NOT NULL DEFAULT 0 CHECK (order_index >= 0),
  chord_name text NOT NULL,
  measure_number integer CHECK (measure_number IS NULL OR measure_number >= 1),
  beat_offset numeric CHECK (beat_offset IS NULL OR beat_offset >= 0),
  duration_beats numeric CHECK (duration_beats IS NULL OR duration_beats > 0),
  start_time_sec numeric CHECK (start_time_sec IS NULL OR start_time_sec >= 0),
  end_time_sec numeric CHECK (end_time_sec IS NULL OR end_time_sec >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phrase_id, order_index)
);

CREATE TABLE IF NOT EXISTS public.ear_training_phrase_demo_loops (
  phrase_id uuid NOT NULL REFERENCES public.ear_training_phrases(id) ON DELETE CASCADE,
  loop_number integer NOT NULL CHECK (loop_number >= 1 AND loop_number <= 16),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (phrase_id, loop_number)
);

CREATE INDEX IF NOT EXISTS idx_ear_training_phrases_stage_id
  ON public.ear_training_phrases(stage_id);
CREATE INDEX IF NOT EXISTS idx_ear_training_phrase_notes_phrase_id
  ON public.ear_training_phrase_notes(phrase_id);
CREATE INDEX IF NOT EXISTS idx_ear_training_phrase_chords_phrase_id
  ON public.ear_training_phrase_chords(phrase_id);

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_ear_training boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ear_training_stage_id uuid REFERENCES public.ear_training_stages(id) ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS idx_lesson_songs_ear_training_stage_id
  ON public.lesson_songs(ear_training_stage_id)
  WHERE ear_training_stage_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_lesson_songs_unique_ear_training
  ON public.lesson_songs(lesson_id, ear_training_stage_id)
  WHERE ear_training_stage_id IS NOT NULL;

ALTER TABLE public.lesson_songs
  DROP CONSTRAINT IF EXISTS lesson_songs_check_fantasy_or_song,
  DROP CONSTRAINT IF EXISTS lesson_songs_content_check;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_content_check CHECK (
    (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND song_id IS NOT NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NOT NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = true
      AND COALESCE(is_ear_training, false) = false
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NOT NULL
      AND ear_training_stage_id IS NULL
    )
    OR (
      COALESCE(is_fantasy, false) = false
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = true
      AND song_id IS NULL
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND ear_training_stage_id IS NOT NULL
    )
  ) NOT VALID;

CREATE OR REPLACE FUNCTION public.ear_training_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ear_training_stages_updated_at_trigger ON public.ear_training_stages;
CREATE TRIGGER ear_training_stages_updated_at_trigger
  BEFORE UPDATE ON public.ear_training_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.ear_training_touch_updated_at();

DROP TRIGGER IF EXISTS ear_training_phrases_updated_at_trigger ON public.ear_training_phrases;
CREATE TRIGGER ear_training_phrases_updated_at_trigger
  BEFORE UPDATE ON public.ear_training_phrases
  FOR EACH ROW
  EXECUTE FUNCTION public.ear_training_touch_updated_at();

ALTER TABLE public.ear_training_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ear_training_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ear_training_phrase_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ear_training_phrase_chords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ear_training_phrase_demo_loops ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ear training stages are readable" ON public.ear_training_stages;
CREATE POLICY "Ear training stages are readable"
ON public.ear_training_stages
FOR SELECT
USING (
  is_active = true
  OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
);

DROP POLICY IF EXISTS "Admins can manage ear training stages" ON public.ear_training_stages;
CREATE POLICY "Admins can manage ear training stages"
ON public.ear_training_stages
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true));

DROP POLICY IF EXISTS "Ear training phrases are readable" ON public.ear_training_phrases;
CREATE POLICY "Ear training phrases are readable"
ON public.ear_training_phrases
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ear_training_stages s
    WHERE s.id = stage_id
      AND (
        s.is_active = true
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
      )
  )
);

DROP POLICY IF EXISTS "Admins can manage ear training phrases" ON public.ear_training_phrases;
CREATE POLICY "Admins can manage ear training phrases"
ON public.ear_training_phrases
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true));

DROP POLICY IF EXISTS "Ear training notes are readable" ON public.ear_training_phrase_notes;
CREATE POLICY "Ear training notes are readable"
ON public.ear_training_phrase_notes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ear_training_phrases ph
    JOIN public.ear_training_stages s ON s.id = ph.stage_id
    WHERE ph.id = phrase_id
      AND (
        s.is_active = true
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
      )
  )
);

DROP POLICY IF EXISTS "Admins can manage ear training notes" ON public.ear_training_phrase_notes;
CREATE POLICY "Admins can manage ear training notes"
ON public.ear_training_phrase_notes
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true));

DROP POLICY IF EXISTS "Ear training chords are readable" ON public.ear_training_phrase_chords;
CREATE POLICY "Ear training chords are readable"
ON public.ear_training_phrase_chords
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ear_training_phrases ph
    JOIN public.ear_training_stages s ON s.id = ph.stage_id
    WHERE ph.id = phrase_id
      AND (
        s.is_active = true
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
      )
  )
);

DROP POLICY IF EXISTS "Admins can manage ear training chords" ON public.ear_training_phrase_chords;
CREATE POLICY "Admins can manage ear training chords"
ON public.ear_training_phrase_chords
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true));

DROP POLICY IF EXISTS "Ear training demo loops are readable" ON public.ear_training_phrase_demo_loops;
CREATE POLICY "Ear training demo loops are readable"
ON public.ear_training_phrase_demo_loops
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ear_training_phrases ph
    JOIN public.ear_training_stages s ON s.id = ph.stage_id
    WHERE ph.id = phrase_id
      AND (
        s.is_active = true
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
      )
  )
);

DROP POLICY IF EXISTS "Admins can manage ear training demo loops" ON public.ear_training_phrase_demo_loops;
CREATE POLICY "Admins can manage ear training demo loops"
ON public.ear_training_phrase_demo_loops
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true));

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
    v_existing_id uuid;
BEGIN
    v_today := CURRENT_DATE;
    v_today_str := v_today::text;

    SELECT id, COALESCE(is_fantasy, false)
    INTO v_lesson_song_id, v_is_fantasy
    FROM public.lesson_songs
    WHERE id = p_song_id
    LIMIT 1;

    IF FOUND THEN
        p_song_id := NULL;
    ELSE
        SELECT id INTO v_lesson_song_id
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

GRANT SELECT ON public.ear_training_stages TO authenticated;
GRANT SELECT ON public.ear_training_phrases TO authenticated;
GRANT SELECT ON public.ear_training_phrase_notes TO authenticated;
GRANT SELECT ON public.ear_training_phrase_chords TO authenticated;
GRANT SELECT ON public.ear_training_phrase_demo_loops TO authenticated;
GRANT SELECT ON public.lesson_songs TO authenticated;

COMMENT ON TABLE public.ear_training_stages IS '耳コピバトルのステージ定義';
COMMENT ON TABLE public.ear_training_phrases IS '耳コピバトルのフレーズ定義。音源生成manifest由来の秒数を保持する';
COMMENT ON TABLE public.ear_training_phrase_notes IS '耳コピ判定対象の単旋律ノート';
COMMENT ON TABLE public.ear_training_phrase_chords IS '耳コピ画面に表示するコード進行';
COMMENT ON TABLE public.ear_training_phrase_demo_loops IS '模範フレーズが含まれるループ番号';
COMMENT ON COLUMN public.lesson_songs.is_ear_training IS 'Indicates whether this lesson item is an ear training battle stage';
COMMENT ON COLUMN public.lesson_songs.ear_training_stage_id IS 'Reference to ear_training_stages table when is_ear_training is true';
