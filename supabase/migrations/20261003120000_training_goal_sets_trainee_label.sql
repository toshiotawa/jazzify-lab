-- Rename training goal-set trainer labels to trainee
BEGIN;

UPDATE public.training_goal_sets SET
  title_ja = replace(title_ja, 'トレーナー', 'トレーニー'),
  title_en = replace(title_en, 'Trainer', 'Trainee'),
  updated_at = now()
WHERE title_ja LIKE '%トレーナー%'
   OR title_en LIKE '%Trainer%';

UPDATE public.training_ui_texts SET
  text_ja = replace(
    text_ja,
    '各カテゴリにビギナー・トレーナー・マスターの目標セットがあります。',
    '各カテゴリにビギナー・トレーニー・マスターの目標セットがあります。'
  ),
  text_en = replace(
    text_en,
    'Each category has Beginner, Trainer, and Master goal sets.',
    'Each category has Beginner, Trainee, and Master goal sets.'
  ),
  updated_at = now()
WHERE key = 'page_info';

COMMIT;
