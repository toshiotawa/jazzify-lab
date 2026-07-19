-- 両手ヴォイシング まとめクイズ: measure_number を II-V-I 単位に修正
-- 誤: order_index % 3 + 1 → 機能別の3巨大問に潰れ、コードネーム表示と判定が乖離
-- 正: order_index / 3 + 1 → キーごとの II-V-I を1問（12問）

BEGIN;

UPDATE public.ear_training_chord_quiz_items AS i
SET
  measure_number = (i.order_index / 3) + 1,
  updated_at = now()
FROM public.ear_training_stages AS s
WHERE i.stage_id = s.id
  AND s.slug IN (
    'thvi-quiz-b1-q7',
    'thvi-quiz-b2-q7',
    'thva-quiz-b1-major-ii-v-i-summary',
    'thva-quiz-b1-minor-ii-v-i-summary',
    'thvi-b3-quiz-b3-ii-valt-i-summary',
    'thvi-b3-quiz-b3-minor-ii-valt-i-summary'
  );

COMMIT;
