-- Bluesy Licks: MusicXML 差し替え後のブラウザキャッシュ回避（upload-bluesy-licks-r2.mjs 自動生成）
BEGIN;

UPDATE public.ear_training_phrases
SET
  music_xml_url = regexp_replace(
    music_xml_url,
    '\?v=[^&]+$',
    ''
  ) || '?v=202607120229',
  updated_at = now()
WHERE music_xml_url LIKE 'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-%_loop4_ci.musicxml%';

COMMIT;
