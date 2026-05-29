-- Key C composite phrase stages: replace drum loop BGM with Dm7-G7 backing track.
BEGIN;

UPDATE public.survival_composite_phrase_stages
SET
  bgm_url = 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-dm7-g7-loop.mp3',
  updated_at = now()
WHERE map_category = 'phrases'
  AND key_fifths = 0
  AND stage_number IN (6, 12, 18, 24, 30, 36, 42);

COMMIT;
