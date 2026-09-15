-- Training chord title renames (Japanese display names)
BEGIN;

UPDATE public.trainings
SET title_ja = replace(title_ja, 'サス4トライアド', 'sus4'),
    updated_at = now()
WHERE title_ja LIKE '%サス4トライアド%';

UPDATE public.trainings
SET title_ja = replace(title_ja, 'サス4', 'sus4'),
    updated_at = now()
WHERE title_ja LIKE '%サス4%';

UPDATE public.trainings
SET title_ja = replace(title_ja, '7サス4', '7sus4'),
    updated_at = now()
WHERE title_ja LIKE '%7サス4%';

UPDATE public.trainings
SET title_ja = replace(title_ja, '6和音', '6th'),
    updated_at = now()
WHERE title_ja LIKE '%6和音%';

UPDATE public.trainings
SET title_ja = replace(title_ja, 'マイナー6', 'マイナー6th'),
    updated_at = now()
WHERE title_ja LIKE '%マイナー6%'
  AND title_ja NOT LIKE '%マイナー6th%';

COMMIT;
