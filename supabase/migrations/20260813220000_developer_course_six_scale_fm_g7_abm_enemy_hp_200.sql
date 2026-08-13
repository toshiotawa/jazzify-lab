-- 6音スケール（Fm・G7alt・Abm）: 敵HPを約200に調整

BEGIN;

UPDATE public.ear_training_stages
SET enemy_hp = 200, updated_at = now()
WHERE slug LIKE 'dev-six-scale-fm-g7-abm-adlib-a%';

COMMIT;
