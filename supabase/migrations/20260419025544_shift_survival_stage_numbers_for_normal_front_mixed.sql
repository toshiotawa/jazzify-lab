-- Normal 前半末尾(m7b5ブロック末尾)に新 Mixed ステージを挿入(stage 32)するため、
-- 既存の stage_number >= 32 のクリア記録・進捗を +1 シフトする。
-- 確認済み: 現行データは最大 stage_number=25 なので実ユーザ影響なし。
-- 降順で更新して UNIQUE (user_id, stage_number) 等への衝突を避ける。

BEGIN;

UPDATE public.survival_stage_clears
   SET stage_number = stage_number + 1
 WHERE stage_number >= 32;

UPDATE public.survival_stage_progress
   SET current_stage_number = current_stage_number + 1
 WHERE current_stage_number >= 32;

COMMIT;
