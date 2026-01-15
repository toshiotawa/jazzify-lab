-- ファンタジーモード ランクシステム追加
-- 作成日: 2026-01-16
-- 説明: ステージクリア時のランク付けと次ステージ開放条件の実装

-- ============================================
-- 1. fantasy_stages テーブルに必要クリア回数カラムを追加
-- ============================================
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS required_clears_for_next INTEGER NOT NULL DEFAULT 5;

COMMENT ON COLUMN fantasy_stages.required_clears_for_next IS '次のステージ開放に必要なクリア換算回数（Sランク=10回換算、それ以外=1回）';

-- ============================================
-- 2. fantasy_stage_clears テーブルにランク関連カラムを追加
-- ============================================

-- 直近のクリアランク（S/A/B/C/D）
ALTER TABLE fantasy_stage_clears 
ADD COLUMN IF NOT EXISTS rank TEXT DEFAULT NULL;

-- 最高ランク
ALTER TABLE fantasy_stage_clears 
ADD COLUMN IF NOT EXISTS best_rank TEXT DEFAULT NULL;

-- 累積クリア換算回数（Sランク=10、それ以外=1）
ALTER TABLE fantasy_stage_clears 
ADD COLUMN IF NOT EXISTS total_clear_credit INTEGER NOT NULL DEFAULT 0;

-- クリア回数（実際のクリア回数、ランク換算なし）
ALTER TABLE fantasy_stage_clears 
ADD COLUMN IF NOT EXISTS clear_count INTEGER NOT NULL DEFAULT 0;

-- ============================================
-- 3. ランク比較用関数の作成
-- ============================================
CREATE OR REPLACE FUNCTION fantasy_rank_to_number(rank_text TEXT)
RETURNS INTEGER AS $$
BEGIN
    RETURN CASE rank_text
        WHEN 'S' THEN 5
        WHEN 'A' THEN 4
        WHEN 'B' THEN 3
        WHEN 'C' THEN 2
        WHEN 'D' THEN 1
        ELSE 0
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION fantasy_is_better_rank(new_rank TEXT, old_rank TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    IF old_rank IS NULL THEN
        RETURN TRUE;
    END IF;
    RETURN fantasy_rank_to_number(new_rank) > fantasy_rank_to_number(old_rank);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 4. クリア記録更新用のRPC関数
-- ============================================
CREATE OR REPLACE FUNCTION upsert_fantasy_stage_clear(
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
            clear_type = p_clear_type,
            remaining_hp = p_remaining_hp,
            max_hp = p_max_hp,
            total_questions = p_total_questions,
            correct_answers = p_correct_answers,
            rank = p_rank,
            best_rank = v_new_best_rank,
            total_clear_credit = v_new_total_credit,
            clear_count = v_new_clear_count
        WHERE id = v_existing_record.id
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

        RETURN QUERY SELECT v_new_id, v_new_best_rank, v_new_total_credit, v_new_clear_count, TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. 次ステージ開放状況を確認する関数
-- ============================================
CREATE OR REPLACE FUNCTION get_next_stage_unlock_status(
    p_user_id UUID,
    p_current_stage_id UUID
)
RETURNS TABLE (
    current_clear_credit INTEGER,
    required_clears INTEGER,
    is_unlocked BOOLEAN,
    remaining_clears INTEGER
) AS $$
DECLARE
    v_clear_credit INTEGER;
    v_required INTEGER;
BEGIN
    -- 現在のステージのクリア換算回数を取得
    SELECT COALESCE(total_clear_credit, 0) INTO v_clear_credit
    FROM fantasy_stage_clears
    WHERE user_id = p_user_id AND stage_id = p_current_stage_id;

    IF v_clear_credit IS NULL THEN
        v_clear_credit := 0;
    END IF;

    -- 必要クリア回数を取得
    SELECT required_clears_for_next INTO v_required
    FROM fantasy_stages
    WHERE id = p_current_stage_id;

    IF v_required IS NULL THEN
        v_required := 5;
    END IF;

    RETURN QUERY SELECT 
        v_clear_credit,
        v_required,
        v_clear_credit >= v_required,
        GREATEST(0, v_required - v_clear_credit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. 既存データの移行（best_rank と total_clear_credit の初期化）
-- ============================================
-- clear_type が 'clear' の既存レコードに対して、
-- ノーダメージならSランク、それ以外は仮でBランクを設定
UPDATE fantasy_stage_clears
SET 
    best_rank = CASE 
        WHEN clear_type = 'clear' AND remaining_hp = max_hp THEN 'S'
        WHEN clear_type = 'clear' THEN 'B'
        WHEN clear_type = 'gameover' THEN 'D'
        ELSE NULL
    END,
    rank = CASE 
        WHEN clear_type = 'clear' AND remaining_hp = max_hp THEN 'S'
        WHEN clear_type = 'clear' THEN 'B'
        WHEN clear_type = 'gameover' THEN 'D'
        ELSE NULL
    END,
    total_clear_credit = CASE 
        WHEN clear_type = 'clear' AND remaining_hp = max_hp THEN 10
        WHEN clear_type = 'clear' THEN 1
        ELSE 0
    END,
    clear_count = CASE 
        WHEN clear_type = 'clear' THEN 1
        ELSE 0
    END
WHERE best_rank IS NULL OR total_clear_credit = 0;

-- ============================================
-- 7. コメント追加
-- ============================================
COMMENT ON COLUMN fantasy_stage_clears.rank IS '直近のクリアランク（S/A/B/C/D）';
COMMENT ON COLUMN fantasy_stage_clears.best_rank IS '最高ランク（S/A/B/C/D）';
COMMENT ON COLUMN fantasy_stage_clears.total_clear_credit IS '累積クリア換算回数（Sランク=10、それ以外=1）';
COMMENT ON COLUMN fantasy_stage_clears.clear_count IS '実際のクリア回数';

COMMENT ON FUNCTION upsert_fantasy_stage_clear IS 'ファンタジーステージのクリア記録を挿入または更新する';
COMMENT ON FUNCTION get_next_stage_unlock_status IS '次ステージの開放状況を確認する';
COMMENT ON FUNCTION fantasy_rank_to_number IS 'ランク文字列を数値に変換（比較用）';
COMMENT ON FUNCTION fantasy_is_better_rank IS '新しいランクが既存より良いか判定';
