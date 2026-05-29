-- Non-C composite phrase stages: replace drum loop BGM with per-key karaoke backing tracks.
BEGIN;

UPDATE public.survival_composite_phrase_stages
SET
  bgm_url = CASE key_fifths
    WHEN -6 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-gb.mp3'
    WHEN -5 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-db.mp3'
    WHEN -4 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-ab.mp3'
    WHEN -3 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-eb.mp3'
    WHEN -2 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-bb.mp3'
    WHEN -1 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-f.mp3'
    WHEN 1 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-g.mp3'
    WHEN 2 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-d.mp3'
    WHEN 3 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-a.mp3'
    WHEN 4 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-e.mp3'
    WHEN 5 THEN 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-karaoke-b.mp3'
  END,
  updated_at = now()
WHERE map_category = 'phrases'
  AND key_fifths <> 0;

COMMIT;
