-- Ch5 Q1 チュートリアル: 他章の成功 OSMD と同じく DOCTYPE なし原譜を使う。
-- 音源 URL / BPM / 尺は変更しない。キャッシュバスティングのみ。
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,mq-b4-5-1-1-osmd,phrases,0,music_xml_url}',
    '"https://jazzify-cdn.com/sozai/mq-b4-5-1-1.musicxml?v=202609211330"'::jsonb
  ),
  updated_at = now()
WHERE id = 'mq-b4-q1-osmd-v1';
