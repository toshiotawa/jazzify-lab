-- Bluesy Licks: MusicXML 更新後もブラウザが旧ファイルを返すのを防ぐ（Cache-Control max-age=31536000 対策）
BEGIN;

UPDATE public.ear_training_phrases
SET
  music_xml_url = regexp_replace(
    music_xml_url,
    '\?v=[^&]+$',
    ''
  ) || '?v=2026063016',
  updated_at = now()
WHERE music_xml_url LIKE 'https://jazzify-cdn.com/sozai/bluesy-licks/bluesy-licks-%_loop4_ci.musicxml%';

COMMIT;
