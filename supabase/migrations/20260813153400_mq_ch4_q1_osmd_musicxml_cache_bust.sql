-- Ch4 Q1 左手 OSMD: キャッシュバスト（Voice4 cue 譜を使わない原譜 URL を再掲）
UPDATE public.ear_training_phrases p
SET music_xml_url = CASE s.slug
    WHEN 'mq-b3-4-1-2-osmd' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-1-2.musicxml?v=202608131534'
    WHEN 'mq-b3-4-1-3-osmd' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-1-3.musicxml?v=202608131534'
    WHEN 'mq-b3-4-1-4-osmd' THEN 'https://jazzify-cdn.com/sozai/mq-b3-4-1-4.musicxml?v=202608131534'
    ELSE p.music_xml_url
  END
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug IN (
    'mq-b3-4-1-2-osmd',
    'mq-b3-4-1-3-osmd',
    'mq-b3-4-1-4-osmd'
  );
