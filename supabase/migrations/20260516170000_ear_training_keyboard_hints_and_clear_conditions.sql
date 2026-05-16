ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS show_keyboard_hints_in_battle boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_stages.show_keyboard_hints_in_battle IS
  'OSMD/コードクイズ/コードヴォイシング本番モードで鍵盤の正解候補ハイライトを表示する';

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
    v_existing_id uuid;
BEGIN
    v_today := CURRENT_DATE;
    v_today_str := v_today::text;

    SELECT id, COALESCE(is_fantasy, false), COALESCE(is_ear_training, false)
    INTO v_lesson_song_id, v_is_fantasy, v_is_ear_training
    FROM public.lesson_songs
    WHERE id = p_song_id
    LIMIT 1;

    IF FOUND THEN
        p_song_id := NULL;
    ELSE
        SELECT id, COALESCE(is_fantasy, false), COALESCE(is_ear_training, false)
        INTO v_lesson_song_id, v_is_fantasy, v_is_ear_training
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
