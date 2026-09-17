-- Tension resolve: root on first voicing complete only
BEGIN;

UPDATE public.training_categories
SET
  description_ja = 'テンションからルートへ解決する両手ヴォイシングを、1小節に2〜3ヴォイシング並べて練習します。
1ヴォイシング完成で攻撃。最初のヴォイシング完成時のみルート音が鳴ります。
In C固定（移調楽器の影響なし）。コード進行は調号付き。',
  description_en = 'Practice two-hand voicings that resolve tension to the root, with 2–3 voicings per measure.
Complete each voicing to attack. The root sounds only when you complete the first voicing.
Concert pitch (In C). Progressions use key signatures.',
  updated_at = now()
WHERE slug = 'tension_resolve';

UPDATE public.trainings
SET
  config = (config - 'play_root_on_first_correct') || '{"play_root_on_first_voicing_complete": true}'::jsonb,
  updated_at = now()
WHERE category_id = uuid_generate_v5('b0000000-0000-4000-8000-000000000001'::uuid, 'training-category-tension_resolve')
  AND is_active IS NOT FALSE;

COMMIT;

