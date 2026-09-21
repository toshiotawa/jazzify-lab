-- Ch5 Q1 チュートリアル: Voice4 cue ではなく原譜 MusicXML を OSMD 表示に使う
-- （cue は DOCTYPE 始まり・2段譜 backup 増で OSMD が reject する）
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,mq-b4-5-1-1-osmd,phrases,0,music_xml_url}',
    '"https://jazzify-cdn.com/sozai/mq-b4-5-1-1.musicxml?v=202609211200"'::jsonb
  ),
  updated_at = now()
WHERE id = 'mq-b4-q1-osmd-v1';
