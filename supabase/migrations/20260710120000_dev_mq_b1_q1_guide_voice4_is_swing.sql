-- MQ 1-1 guide voice 4 開発テスト: 本番 MQ 1-1 と同様に Swing タイミングを有効化
-- アプローチ円・ハンマーは buildChordOsmdRhythmTargets の is_swing フラグで targetTimeSec を生成する

BEGIN;

UPDATE public.ear_training_stages
SET
  is_swing = true,
  updated_at = now()
WHERE slug IN (
  'dev-mq-b1-q1-guide-voice4-cue-osmd',
  'dev-mq-b1-q1-guide-voice4-osmd'
);

COMMIT;
