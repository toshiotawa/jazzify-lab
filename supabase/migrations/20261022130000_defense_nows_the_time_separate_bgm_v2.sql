-- Basic 5 separate-tracks BGM: synthesized C3 quarter notes, cache-busted URL.
UPDATE public.defense_stages
SET audio_url = 'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-separate-bgm-v2.wav'
WHERE slug = 'defense-basic-nows-the-time-separate-tracks';
