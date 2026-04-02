-- チュートリアルコースの英語説明（description_en）
-- JA: ジャズ学習の基本操作を学ぶチュートリアルコースです。

UPDATE public.courses
SET description_en = $en$A tutorial course that teaches the essential basics of using Jazzify for jazz study.$en$
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND COALESCE(is_tutorial, false) = true;
