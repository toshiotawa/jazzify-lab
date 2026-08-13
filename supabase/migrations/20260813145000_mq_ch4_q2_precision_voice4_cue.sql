-- Ch4 Q2 精密: OSMD と同じ Voice4 cue 譜を使い、豆譜・半透明・非ターゲットにする。
BEGIN;

UPDATE public.ear_training_phrases AS p
SET
  music_xml_url = CASE s.slug
    WHEN 'mq-b3-4-2-2-precision' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-2-2-guide-voice4-cue.musicxml?v=202608131440'
    WHEN 'mq-b3-4-2-4-precision' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-2-4-guide-voice4-cue.musicxml?v=202608131440'
  END,
  updated_at = now()
FROM public.ear_training_stages AS s
WHERE p.stage_id = s.id
  AND s.slug IN ('mq-b3-4-2-2-precision', 'mq-b3-4-2-4-precision');

COMMIT;
