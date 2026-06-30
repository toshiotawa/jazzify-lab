-- Legend mode (vertical scroll song play) removal: drop songs tables and related data.

BEGIN;

-- 1. Progress rows tied to legend songs (song_id on progress, no lesson_song_id)
DELETE FROM public.user_lesson_requirements_progress
WHERE song_id IS NOT NULL
  AND lesson_song_id IS NULL;

DELETE FROM public.user_song_play_progress;
DELETE FROM public.user_song_stats;
DELETE FROM public.user_song_progress;
DELETE FROM public.challenge_tracks;
DELETE FROM public.challenges WHERE category = 'song_clear';

-- Legend-only lesson_songs rows (song_id set, no mode flags)
DELETE FROM public.lesson_songs
WHERE song_id IS NOT NULL
  AND COALESCE(is_fantasy, false) = false
  AND COALESCE(is_survival, false) = false
  AND COALESCE(is_ear_training, false) = false
  AND COALESCE(is_balloon_rush, false) = false
  AND COALESCE(is_survival_tutorial, false) = false
  AND COALESCE(is_ear_training_tutorial, false) = false;

DELETE FROM public.lesson_tracks;

-- Legacy song FK dependents (no longer used after legend mode removal)
DELETE FROM public.xp_history WHERE song_id IS NOT NULL;
ALTER TABLE public.xp_history DROP CONSTRAINT IF EXISTS xp_history_song_id_fkey;
ALTER TABLE public.xp_history DROP COLUMN IF EXISTS song_id;
DROP TABLE IF EXISTS public.song_play_conditions;
DROP TABLE IF EXISTS public.track_clears;

DROP INDEX IF EXISTS public.idx_user_lesson_requirements_progress_unique_song;
DROP INDEX IF EXISTS public.idx_user_lesson_requirements_progress_song_id;

ALTER TABLE public.user_lesson_requirements_progress
  DROP CONSTRAINT IF EXISTS user_lesson_requirements_progress_user_id_lesson_id_song_id_key;

ALTER TABLE public.user_lesson_requirements_progress
  DROP COLUMN IF EXISTS song_id;

DROP FUNCTION IF EXISTS public.update_song_clear_progress(uuid, uuid, text, boolean, integer);
DROP FUNCTION IF EXISTS public.update_song_clear_progress(uuid, uuid, text, boolean);
DROP FUNCTION IF EXISTS public.update_song_clear_progress(uuid, uuid, text);

ALTER TABLE public.lesson_songs DROP CONSTRAINT IF EXISTS lesson_songs_content_check;

ALTER TABLE public.lesson_songs DROP COLUMN IF EXISTS song_id;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_content_check CHECK (
    (
      COALESCE(is_fantasy, false) = true
      AND COALESCE(is_survival, false) = false
      AND COALESCE(is_ear_training, false) = false
      AND COALESCE(is_balloon_rush, false) = false
      AND COALESCE(is_survival_tutorial, false) = false
      AND COALESCE(is_ear_training_tutorial, false) = false
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
      AND fantasy_stage_id IS NULL
      AND survival_stage_number IS NULL
      AND survival_composite_config IS NULL
      AND ear_training_stage_id IS NULL
      AND balloon_rush_stage_id IS NULL
      AND survival_tutorial_script_id IS NULL
      AND ear_training_tutorial_script_id IS NOT NULL
    )
  );

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
      AND lesson_id = p_lesson_id
    LIMIT 1;

    IF NOT FOUND THEN
        RETURN FALSE;
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
      AND lesson_song_id = v_lesson_song_id
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

DROP TABLE IF EXISTS public.challenge_tracks;
DROP TABLE IF EXISTS public.lesson_tracks;
DROP TABLE IF EXISTS public.user_song_play_progress;
DROP TABLE IF EXISTS public.user_song_stats;
DROP TABLE IF EXISTS public.user_song_progress;
DROP TABLE IF EXISTS public.songs;

COMMIT;
