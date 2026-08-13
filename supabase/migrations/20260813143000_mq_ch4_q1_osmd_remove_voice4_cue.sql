-- Ch4 Q1（左手コンピング）OSMD 3課題: voice 4 先行ガイドを外し、voice 1 のみの原譜へ差し替え
BEGIN;

UPDATE public.ear_training_phrases AS p
SET
  music_xml_url = CASE s.slug
    WHEN 'mq-b3-4-1-2-osmd' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-1-2.musicxml?v=202608131430'
    WHEN 'mq-b3-4-1-3-osmd' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-1-3.musicxml?v=202608131430'
    WHEN 'mq-b3-4-1-4-osmd' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-1-4.musicxml?v=202608131430'
  END,
  updated_at = now()
FROM public.ear_training_stages AS s
WHERE p.stage_id = s.id
  AND s.slug IN (
    'mq-b3-4-1-2-osmd',
    'mq-b3-4-1-3-osmd',
    'mq-b3-4-1-4-osmd'
  );

COMMIT;
