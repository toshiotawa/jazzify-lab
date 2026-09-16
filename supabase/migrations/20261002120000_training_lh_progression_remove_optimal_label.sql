-- Remove "(最適配置)" / "(Optimal Voicing)" from left-hand voicing progression titles.
BEGIN;

UPDATE public.trainings
SET
  title_ja = 'II-V-I in All Key',
  title_en = 'II-V-I in All Keys',
  updated_at = now()
WHERE slug = 'lh-ii-v-i-all-key';

UPDATE public.trainings
SET
  title_ja = 'II-V(alt)-I in All Key',
  title_en = 'II-V(alt)-I in All Keys',
  updated_at = now()
WHERE slug = 'lh-ii-v-alt-i-all-key';

UPDATE public.trainings
SET
  title_ja = 'Minor II-V-I in All Key',
  title_en = 'Minor II-V-I in All Keys',
  updated_at = now()
WHERE slug = 'lh-minor-ii-v-i-all-key';

UPDATE public.trainings
SET
  title_ja = 'F Blues',
  title_en = 'F Blues',
  updated_at = now()
WHERE slug = 'lh-f-blues';

UPDATE public.trainings
SET
  title_ja = 'Bb Blues',
  title_en = 'Bb Blues',
  updated_at = now()
WHERE slug = 'lh-bb-blues';

COMMIT;
