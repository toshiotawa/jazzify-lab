-- 既存 Major II-V-I Bebop Licks コース名を II-V-I Short 1Bar に変更

BEGIN;

UPDATE public.courses
SET
  title = 'II-V-I Short 1Bar',
  title_en = 'II-V-I Short 1Bar',
  description = 'メジャー II-V-I の Short 1Bar ビバップリックを、全キー・バトルと精密モードで練習します。',
  description_en = 'Practice major II-V-I Short 1Bar bebop licks in all keys with battle and precision modes.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-major-251-bebop-licks');

COMMIT;
