-- Survival Tutorial V4 developer-v4-native: demo BPM 160 + CM7 セリフ話者修正
BEGIN;

UPDATE public.survival_tutorial_scripts
SET
  script = jsonb_set(
    jsonb_set(
      script,
      '{scenes,1,bpm}',
      '160'::jsonb
    ),
    '{scenes,1,lines,2,speaker}',
    '"jajii"'::jsonb
  ),
  updated_at = now()
WHERE id = 'developer-v4-native';

COMMIT;
