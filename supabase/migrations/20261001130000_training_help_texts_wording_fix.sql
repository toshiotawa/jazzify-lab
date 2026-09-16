-- Training help text wording fix
BEGIN;

UPDATE public.training_ui_texts SET
  text_ja = replace(
    text_ja,
    'セット内のすべてのトレーニングでランクC以上を達成するとクリアです。',
    '目標ランク以上を達成するとクリアです。'
  ),
  text_en = replace(
    text_en,
    'Clear it by reaching rank C or higher on every training in the set.',
    'Clear it by reaching each training''s target rank or higher.'
  ),
  updated_at = now()
WHERE key = 'page_info';

UPDATE public.training_categories SET
  description_ja = replace(
    description_ja,
    'II-V-I、ブルース、スタンダードなどの両手ヴォイシングを練習するモードです。現在は Drop2 II-V-I の A-B-A / B-A-B フォームを全キーで練習できます。',
    'II-V-I、ブルース、スタンダードなどの両手ヴォイシングを練習するモードです。'
  ),
  description_en = replace(
    description_en,
    'Practice two-hand voicings over II-V-I, blues, and standard progressions. Currently available: Drop2 II-V-I in A-B-A and B-A-B forms across all keys.',
    'Practice two-hand voicings over II-V-I, blues, and standard progressions.'
  ),
  updated_at = now()
WHERE slug = 'two_hand_voicing_progression';

UPDATE public.training_goal_sets AS gs SET
  description_ja = tc.description_ja,
  description_en = tc.description_en,
  updated_at = now()
FROM public.training_categories AS tc
WHERE tc.slug = 'two_hand_voicing_progression'
  AND gs.slug = 'goal-two_hand_voicing_progression';

COMMIT;
