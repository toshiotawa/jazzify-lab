-- Bluesy Licks 等: ユーザー向け文言から OSMD を除去（日英）
BEGIN;

UPDATE public.courses
SET
  description = 'F ブルースの定番リックを、スロー版と等倍版で耳コピバトル練習します。',
  description_en = 'Practice classic F blues licks in slow and full tempo with ear-copy battles.',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks');

UPDATE public.lessons
SET
  description = replace(description, 'の OSMD 耳コピバトル', 'の耳コピバトル'),
  description_en = replace(description_en, 'OSMD ear-copy battle:', 'Ear-copy battle:'),
  updated_at = now()
WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-bluesy-licks')
  AND (description ILIKE '%OSMD%' OR description_en ILIKE '%OSMD%');

UPDATE public.ear_training_stages
SET
  description = replace(description, '・OSMD リズムバトル', '・リズムバトル'),
  description_en = replace(description_en, ' OSMD rhythm battle', ' rhythm battle'),
  updated_at = now()
WHERE slug LIKE 'bl-%'
  AND (description ILIKE '%OSMD%' OR description_en ILIKE '%OSMD%');

COMMIT;
