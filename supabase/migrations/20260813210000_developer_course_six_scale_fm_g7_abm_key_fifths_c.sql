-- 6音スケール（Fm・G7alt・Abm）: 全課題の調号を C（key_fifths=0）に統一

BEGIN;

UPDATE public.ear_training_adlib_pattern_groups
SET key_fifths = 0, updated_at = now()
WHERE name LIKE 'SixScale-FmG7Abm-A%';

UPDATE public.ear_training_phrase_pair_adlib_config cfg
SET key_fifths = 0, updated_at = now()
FROM public.ear_training_stages s
WHERE cfg.stage_id = s.id
  AND s.slug LIKE 'dev-six-scale-fm-g7-abm-adlib-a%';

UPDATE public.ear_training_phrases p
SET key_fifths = 0, updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug LIKE 'dev-six-scale-fm-g7-abm-adlib-a%';

COMMIT;
