-- レッスン用ファンタジーステージでもランク条件をチェックするように修正
-- ファンタジーステージはS=10回分のボーナスは適用せず、常に1回クリアでカウント

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
    v_rank_meets_requirement boolean;
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
    
    -- 既存のレコードを検索（lesson_song_idまたはsong_idで）
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
    
    -- レコードが存在しない場合は初期化
    IF v_existing_id IS NULL THEN
        v_clear_dates := ARRAY[]::date[];
        v_clear_count := 0;
        v_daily_progress := '{}'::jsonb;
    END IF;
    
    -- daily_progressがNULLの場合は初期化
    IF v_daily_progress IS NULL THEN
        v_daily_progress := '{}'::jsonb;
    END IF;
    
    -- ランク条件の判定（ファンタジーステージも通常の楽曲も同じロジック）
    v_rank_meets_requirement := (
       (p_rank = 'S') OR 
       (p_rank IN ('S', 'A') AND v_required_rank IN ('A', 'B', 'C', 'D')) OR
       (p_rank IN ('S', 'A', 'B') AND v_required_rank IN ('B', 'C', 'D')) OR
       (p_rank IN ('S', 'A', 'B', 'C') AND v_required_rank IN ('C', 'D')) OR
       (v_required_rank = 'D') -- D以上なら全てのランクで達成
    );
    
    -- ランクが条件を満たしている場合のみ進捗を記録
    IF v_rank_meets_requirement THEN
        
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
            -- 回数条件の場合（ファンタジーでも通常楽曲でも1回=1回）
            v_clear_count := v_clear_count + 1;
            IF NOT (v_today = ANY(v_clear_dates)) THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
            v_is_completed := v_clear_count >= v_required_count;
        END IF;
        
        -- 既存レコードがある場合は更新、ない場合は挿入
        IF v_existing_id IS NOT NULL THEN
            -- 更新
            UPDATE public.user_lesson_requirements_progress
            SET 
                clear_count = CASE WHEN v_requires_days THEN array_length(v_clear_dates, 1) ELSE v_clear_count END,
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
            -- 挿入
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
            );
        END IF;
            
        RETURN TRUE;
    ELSE
        -- ランク条件を満たしていない場合はFALSEを返す
        RETURN FALSE;
    END IF;
END;
$$;
