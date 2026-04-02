-- 日数課題の仕様変更:
-- 1. 連続日数 → 合計完了日数（日が空いてもOK）
-- 2. 未完了の過去日はリセット（daily_progressから除去）

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
    v_requires_days boolean;
    v_lesson_song_id uuid;
    v_is_fantasy boolean;
    v_existing_id uuid;
    v_rank_meets_requirement boolean;
BEGIN
    v_today := CURRENT_DATE;
    v_today_str := v_today::text;
    
    SELECT id, is_fantasy INTO v_lesson_song_id, v_is_fantasy
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
    
    v_rank_meets_requirement := (
       (p_rank = 'S') OR 
       (p_rank IN ('S', 'A') AND v_required_rank IN ('A', 'B', 'C', 'D')) OR
       (p_rank IN ('S', 'A', 'B') AND v_required_rank IN ('B', 'C', 'D')) OR
       (p_rank IN ('S', 'A', 'B', 'C') AND v_required_rank IN ('C', 'D')) OR
       (v_required_rank = 'D')
    );
    
    IF v_rank_meets_requirement THEN
        
        IF v_requires_days THEN
            -- 過去の未完了日をリセット（完了済みエントリと当日エントリのみ保持）
            SELECT COALESCE(jsonb_object_agg(key, value), '{}'::jsonb)
            INTO v_daily_progress
            FROM jsonb_each(v_daily_progress) AS x(key, value)
            WHERE key = v_today_str 
               OR (value->>'completed')::boolean = true;
            
            v_today_count := COALESCE((v_daily_progress->v_today_str->>'count')::integer, 0);
            v_today_count := v_today_count + 1;
            
            v_daily_progress := v_daily_progress || jsonb_build_object(
                v_today_str, jsonb_build_object(
                    'count', v_today_count,
                    'completed', v_today_count >= v_daily_count
                )
            );
            
            IF NOT (v_today = ANY(v_clear_dates)) AND v_today_count >= v_daily_count THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
            
            -- 完了判定: 合計完了日数（非連続でOK）
            v_is_completed := COALESCE(array_length(v_clear_dates, 1), 0) >= v_required_count;
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
                    WHEN best_rank = 'C' OR p_rank = 'C' THEN 'C'
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
