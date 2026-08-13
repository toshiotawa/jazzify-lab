-- クエスト4: 4つのリズムパターン課題を パターン1〜4 両手 にリネーム

UPDATE public.lesson_songs SET title = '4-1. パターン1 両手', title_en = '4-1. Pattern 1 (both hands)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-1-lsong');

UPDATE public.lesson_songs SET title = '4-2. パターン2 両手', title_en = '4-2. Pattern 2 (both hands)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-2-lsong');

UPDATE public.lesson_songs SET title = '4-3. パターン3 両手', title_en = '4-3. Pattern 3 (both hands)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-3-lsong');

UPDATE public.lesson_songs SET title = '4-4. パターン4 両手', title_en = '4-4. Pattern 4 (both hands)'
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000004'::uuid, 'mq-b5-q4-4-lsong');

UPDATE public.ear_training_stages SET title = 'パターン1 両手', title_en = 'Pattern 1 (both hands)', updated_at = now()
WHERE slug = 'mq-b5-6-4-2-osmd';

UPDATE public.ear_training_stages SET title = 'パターン2 両手', title_en = 'Pattern 2 (both hands)', updated_at = now()
WHERE slug = 'mq-b5-6-4-3-osmd';

UPDATE public.ear_training_stages SET title = 'パターン3 両手', title_en = 'Pattern 3 (both hands)', updated_at = now()
WHERE slug = 'mq-b5-6-4-4-osmd';

UPDATE public.ear_training_stages SET title = 'パターン4 両手', title_en = 'Pattern 4 (both hands)', updated_at = now()
WHERE slug = 'mq-b5-6-4-5-osmd';
