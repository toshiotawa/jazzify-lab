-- MQ 第3章 Ch3 Q1/Q2 OSMD: voice 4 ガイド豆譜（1 小節前・is_swing 済み）MusicXML へ差し替え
-- 生成: node scripts/build-mq-b2-guide-voice4-musicxml.mjs --cue
-- R2: node scripts/upload-sozai-main-quest-block2-r2.mjs
BEGIN;

UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,mq-b2-q1-osmd,phrases,0,music_xml_url}',
    '"https://jazzify-cdn.com/sozai/mq-b2-domifa-guide-voice4-cue.musicxml?v=202607201000"'::jsonb
  ),
  updated_at = now()
WHERE id = 'mq-b2-q1-osmd-v1';

UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,mq-b2-q2-osmd,phrases,0,music_xml_url}',
    '"https://jazzify-cdn.com/sozai/mq-b2-soshido-guide-voice4-cue.musicxml?v=202607201000"'::jsonb
  ),
  updated_at = now()
WHERE id = 'mq-b2-q2-osmd-v1';

COMMIT;
