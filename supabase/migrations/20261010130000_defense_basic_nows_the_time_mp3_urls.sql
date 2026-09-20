-- Now's The Time shared-progression test: mp3 URLs for Web Audio decode compatibility
BEGIN;

UPDATE public.defense_phrases
SET audio_url = 'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-phrase-1.mp3'
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-test-phrase-0'
);

UPDATE public.defense_phrases
SET audio_url = 'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-phrase-2.mp3'
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'defense-basic-nows-the-time-test-phrase-1'
);

COMMIT;
