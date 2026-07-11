-- 開発者テスト MQ 1-1 ガイド voice 4: 音源を本番 MQ 1-1 と同じ count-in MP3 に統一
-- （1-1.musicxml ベース・loop_measures=25・loop_duration_sec=60）

BEGIN;

UPDATE public.ear_training_phrases
SET
  audio_url = 'https://jazzify-cdn.com/sozai/Cblues_24bars_100BPM_count-in.mp3?v=20260623',
  loop_duration_sec = 60,
  audio_duration_sec = 60,
  updated_at = now()
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-osmd-ph0'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-mq-b1-q1-guide-voice4-cue-osmd-ph0')
);

COMMIT;
