-- onboarding-v1: シーン1 冒頭3セリフの間隔をゆっくりに（2/2/2.2s → 3/3/3.5s）

UPDATE public.survival_tutorial_scripts
SET script = jsonb_set(
  jsonb_set(
    jsonb_set(
      script,
      '{steps,5,seconds}',
      '3'::jsonb
    ),
    '{steps,7,seconds}',
    '3'::jsonb
  ),
  '{steps,9,seconds}',
  '3.5'::jsonb
)
WHERE id = 'onboarding-v1';
