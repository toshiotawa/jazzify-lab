-- Add lesson_song_id column to user_lesson_requirements_progress table

-- 1. Add new column for lesson_songs reference
ALTER TABLE public.user_lesson_requirements_progress 
ADD COLUMN IF NOT EXISTS lesson_song_id UUID REFERENCES public.lesson_songs(id) ON DELETE CASCADE;

-- 2. Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_lesson_requirements_progress_lesson_song_id 
ON public.user_lesson_requirements_progress(lesson_song_id);

-- 3. Update the RPC function to handle fantasy stages
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
BEGIN
    v_today := CURRENT_DATE;
    v_today_str := v_today::text;
    
    -- Check if this is a fantasy stage (p_song_id is actually lesson_songs.id)
    SELECT id, is_fantasy INTO v_lesson_song_id, v_is_fantasy
    FROM public.lesson_songs
    WHERE id = p_song_id
    LIMIT 1;
    
    -- If found, it's a fantasy stage
    IF FOUND THEN
        -- For fantasy stages, use lesson_song_id
        p_song_id := NULL; -- Clear song_id as it's not a real song
    ELSE
        -- For regular songs, find the lesson_song_id
        SELECT id INTO v_lesson_song_id
        FROM public.lesson_songs
        WHERE lesson_id = p_lesson_id AND song_id = p_song_id
        LIMIT 1;
    END IF;
    
    -- clear_conditionsから必要な値を取得
    v_required_count := COALESCE((p_clear_conditions->>'count')::integer, 1);
    v_required_rank := COALESCE(p_clear_conditions->>'rank', 'B');
    v_daily_count := COALESCE((p_clear_conditions->>'daily_count')::integer, 1);
    v_requires_days := COALESCE((p_clear_conditions->>'requires_days')::boolean, false);
    
    -- 現在の進捗を取得 (lesson_song_idで検索)
    SELECT clear_dates, clear_count, daily_progress 
    INTO v_clear_dates, v_clear_count, v_daily_progress
    FROM public.user_lesson_requirements_progress
    WHERE user_id = p_user_id 
      AND lesson_id = p_lesson_id 
      AND (
        (v_lesson_song_id IS NOT NULL AND lesson_song_id = v_lesson_song_id) OR
        (v_lesson_song_id IS NULL AND song_id = p_song_id)
      );
    
    -- レコードが存在しない場合は初期化
    IF NOT FOUND THEN
        v_clear_dates := ARRAY[]::date[];
        v_clear_count := 0;
        v_daily_progress := '{}'::jsonb;
    END IF;
    
    -- daily_progressがNULLの場合は初期化
    IF v_daily_progress IS NULL THEN
        v_daily_progress := '{}'::jsonb;
    END IF;
    
    -- ファンタジーステージの場合、またはランクが条件を満たしている場合
    IF v_is_fantasy OR
       (p_rank = 'S') OR 
       (p_rank IN ('S', 'A') AND v_required_rank IN ('A', 'B', 'C')) OR
       (p_rank IN ('S', 'A', 'B') AND v_required_rank IN ('B', 'C')) OR
       (p_rank IN ('S', 'A', 'B', 'C') AND v_required_rank = 'C') THEN
        
        IF v_requires_days THEN
            -- 日数条件の場合
            -- 今日の進捗を取得
            v_today_count := COALESCE((v_daily_progress->v_today_str->>'count')::integer, 0);
            v_today_count := v_today_count + 1;
            
            -- 今日の進捗を更新
            v_daily_progress := v_daily_progress || jsonb_build_object(
                v_today_str, jsonb_build_object(
                    'count', v_today_count,
                    'completed', v_today_count >= v_daily_count
                )
            );
            
            -- 完了した日数をカウント
            v_completed_days := 0;
            FOR i IN 0..(v_required_count - 1) LOOP
                IF v_daily_progress->(v_today - i)::text->>'completed' = 'true' THEN
                    v_completed_days := v_completed_days + 1;
                ELSE
                    EXIT; -- 連続していない場合は終了
                END IF;
            END LOOP;
            
            -- 今日が初めてのクリアで、かつ今日の必要回数を達成した場合
            IF NOT (v_today = ANY(v_clear_dates)) AND v_today_count >= v_daily_count THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
            
            -- 完了判定（連続した日数が必要日数に達した場合）
            v_is_completed := v_completed_days >= v_required_count;
        ELSE
            -- 回数条件の場合
            v_clear_count := v_clear_count + 1;
            IF NOT (v_today = ANY(v_clear_dates)) THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
            v_is_completed := v_clear_count >= v_required_count;
        END IF;
        
        -- 進捗を更新
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
            p_song_id, -- NULLの場合もある
            v_lesson_song_id,
            CASE WHEN v_requires_days THEN array_length(v_clear_dates, 1) ELSE v_clear_count END,
            v_clear_dates,
            p_rank,
            now(),
            v_is_completed,
            v_daily_progress
        )
        ON CONFLICT (user_id, lesson_id, song_id) 
        DO UPDATE SET
            clear_count = CASE WHEN v_requires_days THEN array_length(v_clear_dates, 1) ELSE EXCLUDED.clear_count END,
            clear_dates = EXCLUDED.clear_dates,
            best_rank = CASE 
                WHEN user_lesson_requirements_progress.best_rank = 'S' THEN 'S'
                WHEN EXCLUDED.best_rank = 'S' THEN 'S'
                WHEN user_lesson_requirements_progress.best_rank = 'A' OR EXCLUDED.best_rank = 'A' THEN 'A'
                WHEN user_lesson_requirements_progress.best_rank = 'B' OR EXCLUDED.best_rank = 'B' THEN 'B'
                ELSE EXCLUDED.best_rank
            END,
            last_cleared_at = EXCLUDED.last_cleared_at,
            is_completed = EXCLUDED.is_completed,
            daily_progress = EXCLUDED.daily_progress,
            lesson_song_id = EXCLUDED.lesson_song_id;
            
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;

-- 4. Update the unique constraint to allow null song_id
ALTER TABLE public.user_lesson_requirements_progress
DROP CONSTRAINT IF EXISTS user_lesson_requirements_progress_user_id_lesson_id_song_id_key;

-- 5. Add new unique constraint that considers lesson_song_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lesson_requirements_progress_unique 
ON public.user_lesson_requirements_progress(user_id, lesson_id, lesson_song_id) 
WHERE lesson_song_id IS NOT NULL;

-- 6. Keep the old unique constraint for backward compatibility
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_lesson_requirements_progress_unique_song 
ON public.user_lesson_requirements_progress(user_id, lesson_id, song_id) 
WHERE song_id IS NOT NULL;