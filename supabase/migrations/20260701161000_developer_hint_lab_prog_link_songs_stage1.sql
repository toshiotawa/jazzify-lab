-- 本番ヒント Progression 検証課題: lesson/2 → songs/1（既存 II-V-I Part 1）へ紐づけ直し
BEGIN;

UPDATE public.lesson_songs
SET
  survival_stage_number = 1,
  survival_map_category = 'songs'
WHERE lesson_id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'developer-production-hint-lab-prog-lesson'
);

UPDATE public.lessons
SET
  description = 'Songs マップ stage 1（II-V-I Part 1）で譜面ヒント A と鍵盤 HINT B の override を 6 通り検証します。',
  description_en = 'Six tasks on songs map stage 1 (II-V-I Part 1) with distinct staff (A) × keyboard (B) overrides.'
WHERE id = uuid_generate_v5(
  'a0000000-0000-4000-8000-000000000001'::uuid,
  'developer-production-hint-lab-prog-lesson'
);

COMMIT;
