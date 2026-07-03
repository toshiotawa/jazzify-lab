-- Donna Lee コンピング: ユーザー差し替え MusicXML（表現記号除去済み）CDN キャッシュ回避

BEGIN;

UPDATE public.ear_training_phrases
SET
  music_xml_url = 'https://jazzify-cdn.com/sozai/Comping/Donna%20Lee%20Comping%20precision_lyrics.musicxml?v=202607032220',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-donna-lee-comping-ph0');

COMMIT;
