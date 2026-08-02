-- Major II-V-I Bebop Licks: ユーザー向け文言から OSMD を除去
BEGIN;

UPDATE public.courses
SET
  description = replace(replace(description, 'OSMDバトル', 'バトル'), 'OSMD battle', 'battle'),
  description_en = replace(replace(description_en, 'OSMD Battle', 'Battle'), 'OSMD battle', 'battle'),
  updated_at = now()
WHERE title = 'Major II-V-I Bebop Licks';

UPDATE public.lessons l
SET
  description = replace(replace(l.description, 'OSMDバトル', 'バトル'), 'OSMD battle', 'battle'),
  description_en = replace(replace(l.description_en, 'OSMD Battle', 'Battle'), 'OSMD battle', 'battle'),
  assignment_description = replace(replace(l.assignment_description, 'OSMDバトル', 'バトル'), 'OSMD battle', 'battle'),
  assignment_description_en = replace(replace(l.assignment_description_en, 'OSMD Battle', 'Battle'), 'OSMD battle', 'battle'),
  updated_at = now()
FROM public.courses c
WHERE l.course_id = c.id
  AND c.title = 'Major II-V-I Bebop Licks';

UPDATE public.lesson_songs ls
SET
  title = replace(ls.title, 'OSMDバトル', 'バトル'),
  title_en = replace(ls.title_en, 'OSMD Battle', 'Battle')
FROM public.lessons l
JOIN public.courses c ON c.id = l.course_id
WHERE ls.lesson_id = l.id
  AND c.title = 'Major II-V-I Bebop Licks';

UPDATE public.ear_training_stages
SET
  title = replace(title, 'OSMDバトル', 'バトル'),
  title_en = replace(title_en, 'OSMD Battle', 'Battle'),
  description = replace(replace(description, 'OSMDバトル', 'バトル'), 'OSMD battle', 'battle'),
  description_en = replace(replace(description_en, 'OSMD Battle', 'Battle'), 'OSMD battle', 'battle'),
  updated_at = now()
WHERE slug LIKE 'm251-s1-%';

UPDATE public.ear_training_phrases p
SET
  title = replace(p.title, 'OSMDバトル', 'バトル'),
  title_en = replace(p.title_en, 'OSMD Battle', 'Battle'),
  updated_at = now()
FROM public.ear_training_stages s
WHERE p.stage_id = s.id
  AND s.slug LIKE 'm251-s1-%';

COMMIT;
