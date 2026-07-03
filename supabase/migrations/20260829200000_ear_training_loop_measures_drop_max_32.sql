-- ear_training_stages.loop_measures の上限 32 を撤廃（全モード共通の DB 制約）。
-- 33 小節以上の譜面（例: Donna Lee コンピング）を登録可能にする。

BEGIN;

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_loop_measures_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_loop_measures_check
  CHECK (loop_measures > 0);

UPDATE public.ear_training_stages
SET
  loop_measures = 33,
  updated_at = now()
WHERE slug = 'dev-donna-lee-comping-precision';

COMMIT;
