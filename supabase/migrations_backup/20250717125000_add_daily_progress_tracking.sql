-- 日ごとの進捗を詳細に追跡するためのカラムを追加
ALTER TABLE public.user_lesson_requirements_progress
ADD COLUMN IF NOT EXISTS daily_progress jsonb DEFAULT '{}';

-- daily_progress の構造:
-- {
--   "2025-01-17": { "count": 3, "completed": false },
--   "2025-01-18": { "count": 5, "completed": true },
--   ...
-- }

-- 実習課題の進捗を更新する関数を更新
CREATE OR REPLACE FUNCTION public.update_lesson_requirement_progress(
    p_user_id uuid,
    p_lesson_id uuid,
    p_song_id uuid,
    p_rank text,
    p_clear_conditions jsonb
)
RETURNS boolean
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
BEGIN
    v_today := CURRENT_DATE;
    v_today_str := v_today::text;
    
    -- clear_conditionsから必要な値を取得
    v_required_count := COALESCE((p_clear_conditions->>'count')::integer, 1);
    v_required_rank := COALESCE(p_clear_conditions->>'rank', 'B');
    v_daily_count := COALESCE((p_clear_conditions->>'daily_count')::integer, 1);
    v_requires_days := COALESCE((p_clear_conditions->>'requires_days')::boolean, false);
    
    -- 現在の進捗を取得
    SELECT clear_dates, clear_count, daily_progress 
    INTO v_clear_dates, v_clear_count, v_daily_progress
    FROM public.user_lesson_requirements_progress
    WHERE user_id = p_user_id AND lesson_id = p_lesson_id AND song_id = p_song_id;
    
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
    
    -- ランクが条件を満たしているかチェック
    IF (p_rank = 'S') OR 
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
            
            -- 今日の必要回数を達成した場合
            IF v_today_count = v_daily_count AND v_today != ALL(v_clear_dates) THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
            
            -- 完了した日数をカウント
            v_completed_days := array_length(v_clear_dates, 1);
            IF v_completed_days IS NULL THEN
                v_completed_days := 0;
            END IF;
            
            -- 完了判定
            v_is_completed := v_completed_days >= v_required_count;
            
            -- 総クリア回数も更新
            v_clear_count := v_clear_count + 1;
        ELSE
            -- 回数条件の場合（従来通り）
            v_clear_count := v_clear_count + 1;
            v_is_completed := v_clear_count >= v_required_count;
            
            -- 今日のクリアがまだ記録されていない場合（互換性のため）
            IF v_today != ALL(v_clear_dates) THEN
                v_clear_dates := array_append(v_clear_dates, v_today);
            END IF;
        END IF;
    END IF;
    
    -- 進捗を更新または挿入
    INSERT INTO public.user_lesson_requirements_progress (
        user_id, lesson_id, song_id, clear_count, clear_dates, 
        best_rank, last_cleared_at, is_completed, daily_progress
    ) VALUES (
        p_user_id, p_lesson_id, p_song_id, v_clear_count, v_clear_dates,
        p_rank, now(), v_is_completed, v_daily_progress
    )
    ON CONFLICT (user_id, lesson_id, song_id)
    DO UPDATE SET
        clear_count = v_clear_count,
        clear_dates = v_clear_dates,
        best_rank = CASE 
            WHEN user_lesson_requirements_progress.best_rank IS NULL THEN p_rank
            WHEN p_rank = 'S' THEN 'S'
            WHEN p_rank = 'A' AND user_lesson_requirements_progress.best_rank != 'S' THEN 'A'
            WHEN p_rank = 'B' AND user_lesson_requirements_progress.best_rank NOT IN ('S', 'A') THEN 'B'
            ELSE user_lesson_requirements_progress.best_rank
        END,
        last_cleared_at = now(),
        is_completed = v_is_completed,
        daily_progress = v_daily_progress,
        updated_at = now();
    
    RETURN v_is_completed;
END;
$$; 