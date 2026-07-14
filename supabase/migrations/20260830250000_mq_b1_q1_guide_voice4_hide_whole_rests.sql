-- Voice 4 全休符を print-object="no" にした MusicXML を反映（キャッシュバスト）
-- MQ 1-1 台本 + 開発者テストコースの cue フレーズ
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,mq-b1-q1-osmd,phrases,0,music_xml_url}',
    '"https://jazzify-cdn.com/sozai/dev-mq-b1-q1-osmd-guide-voice4-cue.musicxml?v=202607141330"'::jsonb
  ),
  updated_at = now()
WHERE id = 'osmd-timing-adjustment-v1';

UPDATE public.ear_training_phrases
SET
  music_xml_url = 'https://jazzify-cdn.com/sozai/dev-mq-b1-q1-osmd-guide-voice4-cue.musicxml?v=202607141330',
  updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-mq-b1-q1-guide-voice4-cue-osmd-ph0'
);

UPDATE public.ear_training_phrases
SET
  music_xml_url = 'https://jazzify-cdn.com/sozai/dev-mq-b1-q1-osmd-guide-voice4.musicxml?v=202607141330',
  updated_at = now()
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'dev-mq-b1-q1-guide-voice4-osmd-ph0'
);
