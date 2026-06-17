-- 両手ヴォイシング chord_voicing マイナスワン audio_url 一括適用
-- phrase_chords / 課題定義は変更しない

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q1-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q1-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q1'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q2-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q2-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q2'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q3-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q3-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q3'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q4-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q4'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q4-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q4'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q5-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q5'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q5-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q5'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q6-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q6'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b1-q6-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b1-q6'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q1-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q1-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q1'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q2-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q2-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q2'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q3-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q3-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q3'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q4-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q4'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q4-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q4'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q5-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q5'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q5-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q5'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q6-ph0-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q6'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-voicing-b2-q6-ph1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-voicing-b2-q6'
  AND p.order_index = 1;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-m7-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-m7-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-m7-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-m7-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-m7-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-m7-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-mn7-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-mn7-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-mn7-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-mn7-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-mn7-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-mn7-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-7alt-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-7alt-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-7alt-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-7alt-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-7alt-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-7alt-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-mm7-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-mm7-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-mm7-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-mm7-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-mm7-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-mm7-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-7-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-7-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-7-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-7-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-7-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-7-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-m7b5-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-m7b5-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-m7b5-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-m7b5-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thvi-b3-voicing-b3-m7b5-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thvi-b3-voicing-b3-m7b5-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-minm7-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-m7-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-minm7-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-m7-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-minm7-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-m7-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-majM7-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-M7-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-majM7-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-M7-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-majM7-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-M7-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-7alt-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-7alt-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-7alt-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-7alt-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-7alt-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-7alt-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-mm7-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-mm7-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-mm7-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-mm7-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-mm7-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-mm7-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-m7b5-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-m7b5-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-m7b5-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-m7b5-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-m7b5-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-m7b5-p3'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-7s11-p1-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-7s11-p1'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-7s11-p2-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-7s11-p2'
  AND p.order_index = 0;

UPDATE public.ear_training_phrases p
SET
  audio_url = 'https://jazzify-cdn.com/sozai/thva-voicing-b1-7s11-p3-minus-one.mp3',
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug = 'thva-voicing-b1-7s11-p3'
  AND p.order_index = 0;

