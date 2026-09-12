-- Rename piano main quest course title from legacy tutorial label.
BEGIN;

UPDATE public.courses
SET
  title = 'メインクエスト(ピアノ)',
  title_en = 'Main Quest (Piano)',
  updated_at = now()
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND main_quest_instrument = 'piano';

COMMIT;
