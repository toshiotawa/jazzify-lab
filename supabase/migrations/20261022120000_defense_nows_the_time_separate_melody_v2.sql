-- Basic 5 separate-tracks melody: cache-bust the synthesized quarter-note phrase.
UPDATE public.defense_stages
SET melody_audio_url = 'https://jazzify-cdn.com/fantasy-bgm/defense-nows-the-time-separate-melody-v2.wav'
WHERE slug = 'defense-basic-nows-the-time-separate-tracks';
