-- Major II-V-I Bebop Licks: Call/Response 変換で欠落していた休符を復元した MusicXML のキャッシュバスト
BEGIN;

UPDATE public.ear_training_phrases p
SET
  music_xml_url = regexp_replace(music_xml_url, '\?v=[^&]+$', '') || '?v=202608011920',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug LIKE 'm251-s1-%'
  AND p.music_xml_url LIKE 'https://jazzify-cdn.com/sozai/major-251-licks/%';

COMMIT;
