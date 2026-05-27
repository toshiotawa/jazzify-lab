-- 風船ラッシュ BGM を Drums160 ループ（CDN: survival-composite-phrases-drums160-loop.mp3）に統一

UPDATE public.balloon_rush_stages
SET bgm_url = 'https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3'
WHERE bgm_url IS NULL
   OR bgm_url NOT LIKE '%survival-composite-phrases-drums160-loop%';
