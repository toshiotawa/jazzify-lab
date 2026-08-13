-- Fブルース コール＆レスポンス: Voice4 cue 生成時に消していた聞き小節の休符を復元したのでキャッシュバスト
UPDATE public.ear_training_phrases p
SET music_xml_url = regexp_replace(p.music_xml_url, '\?v=[0-9]+$', '?v=202608131530')
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND (
    p.music_xml_url LIKE '%/mq-b5-6-1-2-guide-voice4-cue.musicxml%'
    OR p.music_xml_url LIKE '%/mq-b5-6-4-6-guide-voice4-cue.musicxml%'
    OR p.music_xml_url LIKE '%/mq-b5-6-5-2-guide-voice4-cue.musicxml%'
    OR p.music_xml_url LIKE '%/mq-b5-6-5-3-guide-voice4-cue.musicxml%'
    OR p.music_xml_url LIKE '%/mq-b5-6-5-4-guide-voice4-cue.musicxml%'
    OR p.music_xml_url LIKE '%/mq-b5-6-6-2-guide-voice4-cue.musicxml%'
    OR p.music_xml_url LIKE '%/mq-b5-6-7-2-guide-voice4-cue.musicxml%'
    OR p.music_xml_url LIKE '%/mq-b5-6-7-2-precision.musicxml%'
  );

UPDATE public.ear_training_tutorial_scripts
SET
  script = replace(
    script::text,
    'guide-voice4-cue.musicxml?v=202608121000',
    'guide-voice4-cue.musicxml?v=202608131530'
  )::jsonb,
  updated_at = now()
WHERE id IN ('mq-b5-q1-1-v1', 'mq-b5-q5-4-v1', 'mq-b5-q6-1-v1');
