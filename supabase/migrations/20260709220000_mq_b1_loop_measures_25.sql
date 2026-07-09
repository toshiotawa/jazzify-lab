-- MQ 1-1: 演奏ループを 25 小節に統一（count_in_beats は 0 のまま）
-- チュートリアル台本は小節 2〜25 の聴く/返す構成のため loop_measures=25 が正しい。

BEGIN;

UPDATE public.ear_training_stages
SET
  loop_measures = 25,
  updated_at = now()
WHERE slug IN (
  'dev-mq-b1-q1-guide-voice4-osmd',
  'dev-mq-b1-q1-guide-voice4-cue-osmd'
);

UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,mq-b1-q1-osmd,stage,loop_measures}',
    '25'::jsonb,
    true
  ),
  updated_at = now()
WHERE id = 'mq-b1-q1-osmd-v1';

COMMIT;
