-- 両手パターン2（1頭3ウラ）と同・精密の音源を、両手パターン1（1頭のみ）の mp3 に揃える。
BEGIN;

UPDATE public.ear_training_phrases AS p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/mq-b3-4-2-2.mp3?v=202607292330',
  updated_at = now()
FROM public.ear_training_stages AS s
WHERE p.stage_id = s.id
  AND s.slug IN ('mq-b3-4-2-4-osmd', 'mq-b3-4-2-4-precision');

COMMIT;
