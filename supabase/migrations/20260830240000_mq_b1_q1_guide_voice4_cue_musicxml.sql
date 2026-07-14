-- MQ 1-1 (osmd-timing-adjustment-v1): 本編 OSMD をガイド豆譜（voice 4 cue）MusicXML へ差し替え
-- タイミング調整用 1-1_count-in.musicxml は変更しない
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,mq-b1-q1-osmd,phrases,0,music_xml_url}',
    '"https://jazzify-cdn.com/sozai/dev-mq-b1-q1-osmd-guide-voice4-cue.musicxml?v=202607092045"'::jsonb
  ),
  updated_at = now()
WHERE id = 'osmd-timing-adjustment-v1';
