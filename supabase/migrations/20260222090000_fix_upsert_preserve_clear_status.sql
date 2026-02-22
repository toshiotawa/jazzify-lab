-- ゲームオーバー時にクリア状態・ランク・HP等が下方上書きされるバグを修正
-- clear_type, remaining_hp, rank はクリア済みの場合に保護する

CREATE OR REPLACE FUNCTION public.upsert_fantasy_stage_clear(
    p_user_id UUID,
    p_stage_id UUID,
    p_score INTEGER,
    p_clear_type TEXT,
    p_remaining_hp INTEGER,
    p_max_hp INTEGER,
    p_total_questions INTEGER,
    p_correct_answers INTEGER,
    p_rank TEXT
)
RETURNS TABLE (
    id UUID,
    best_rank TEXT,
    total_clear_credit INTEGER,
    clear_count INTEGER,
    is_new_best_rank BOOLEAN
) AS $$
DECLARE
    v_existing_record fantasy_stage_clears%ROWTYPE;
    v_clear_credit INTEGER;
    v_is_new_best BOOLEAN := FALSE;
    v_new_id UUID;
    v_new_best_rank TEXT;
    v_new_total_credit INTEGER;
    v_new_clear_count INTEGER;
BEGIN
    -- クリア換算回数を計算（Sランク=10、それ以外=1、ゲームオーバー=0）
    IF p_clear_type = 'gameover' THEN
        v_clear_credit := 0;
    ELSIF p_rank = 'S' THEN
        v_clear_credit := 10;
    ELSE
        v_clear_credit := 1;
    END IF;

    -- 既存レコードを取得
    SELECT * INTO v_existing_record
    FROM fantasy_stage_clears
    WHERE user_id = p_user_id AND stage_id = p_stage_id;

    IF v_existing_record.id IS NOT NULL THEN
        -- 既存レコードがある場合は更新
        v_is_new_best := fantasy_is_better_rank(p_rank, v_existing_record.best_rank);
        v_new_best_rank := CASE 
            WHEN v_is_new_best THEN p_rank 
            ELSE v_existing_record.best_rank 
        END;
        v_new_total_credit := v_existing_record.total_clear_credit + v_clear_credit;
        v_new_clear_count := CASE 
            WHEN p_clear_type = 'clear' THEN v_existing_record.clear_count + 1 
            ELSE v_existing_record.clear_count 
        END;

        UPDATE fantasy_stage_clears
        SET
            cleared_at = NOW(),
            score = GREATEST(score, p_score),
            -- クリア状態は一度 'clear' になったら gameover で下方上書きしない
            clear_type = CASE
                WHEN v_existing_record.clear_type = 'clear' OR p_clear_type = 'clear' THEN 'clear'
                ELSE p_clear_type
            END,
            -- remaining_hp / rank / questions / answers はスコアが更新された場合のみ上書き
            remaining_hp = CASE
                WHEN p_score > v_existing_record.score THEN p_remaining_hp
                ELSE v_existing_record.remaining_hp
            END,
            max_hp = p_max_hp,
            total_questions = CASE
                WHEN p_score > v_existing_record.score THEN p_total_questions
                ELSE v_existing_record.total_questions
            END,
            correct_answers = CASE
                WHEN p_score > v_existing_record.score THEN p_correct_answers
                ELSE v_existing_record.correct_answers
            END,
            rank = CASE
                WHEN p_score > v_existing_record.score THEN p_rank
                ELSE v_existing_record.rank
            END,
            best_rank = v_new_best_rank,
            total_clear_credit = v_new_total_credit,
            clear_count = v_new_clear_count
        WHERE fantasy_stage_clears.id = v_existing_record.id
        RETURNING fantasy_stage_clears.id INTO v_new_id;

        RETURN QUERY SELECT v_new_id, v_new_best_rank, v_new_total_credit, v_new_clear_count, v_is_new_best;
    ELSE
        -- 新規レコードを作成
        v_new_best_rank := p_rank;
        v_new_total_credit := v_clear_credit;
        v_new_clear_count := CASE WHEN p_clear_type = 'clear' THEN 1 ELSE 0 END;

        INSERT INTO fantasy_stage_clears (
            user_id, stage_id, score, clear_type, remaining_hp, max_hp,
            total_questions, correct_answers, rank, best_rank, 
            total_clear_credit, clear_count
        ) VALUES (
            p_user_id, p_stage_id, p_score, p_clear_type, p_remaining_hp, p_max_hp,
            p_total_questions, p_correct_answers, p_rank, v_new_best_rank,
            v_new_total_credit, v_new_clear_count
        )
        RETURNING fantasy_stage_clears.id INTO v_new_id;

        RETURN QUERY SELECT v_new_id, v_new_best_rank, v_new_total_credit, v_new_clear_count, FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
