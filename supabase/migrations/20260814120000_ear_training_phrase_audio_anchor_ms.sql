-- フレーズ MP3 の先頭無音・エンコード遅延を正本 startSec で吸収する
BEGIN;

ALTER TABLE public.ear_training_phrases
  ADD COLUMN IF NOT EXISTS audio_anchor_ms integer NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.ear_training_phrases.audio_anchor_ms IS
  'フレーズ MP3 の先頭無音・エンコード遅延補正（ms）。OSMD/精密の正本 startSec に加算';

COMMIT;
