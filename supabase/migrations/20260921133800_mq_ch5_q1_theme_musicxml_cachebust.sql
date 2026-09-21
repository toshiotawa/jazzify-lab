-- Ch5 Q1: ブラウザ/Netlify の 1 年キャッシュを避けるため、新規ファイル名の DOCTYPE なし原譜へ差し替え。
-- 音源は変更しない。
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,mq-b4-5-1-1-osmd,phrases,0,music_xml_url}',
    '"https://jazzify-cdn.com/sozai/mq-b4-5-1-1-theme.musicxml?v=202609211338"'::jsonb
  ),
  updated_at = now()
WHERE id = 'mq-b4-q1-osmd-v1';
