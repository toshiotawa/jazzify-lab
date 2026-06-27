-- 音楽理論初級 v2: 表示名を「その1／その2」「Part 1/2」に統一（既存DB向け差分）
-- 初回フル投入後に シングル／ランダム進行 のままの行を更新する
BEGIN;

UPDATE public.fantasy_stages
SET
  name = REPLACE(REPLACE(name, '・シングル', 'その1'), '・ランダム進行', 'その2'),
  name_en = REPLACE(REPLACE(name_en, '· Random progression', '· Part 2'), '· Single', '· Part 1')
WHERE stage_number ~ '^MT-';

UPDATE public.lessons
SET
  title = REPLACE(REPLACE(title, '・シングル', 'その1'), '・ランダム進行', 'その2'),
  title_en = REPLACE(REPLACE(title_en, '· Random progression', '· Part 2'), '· Single', '· Part 1')
WHERE course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner');

UPDATE public.lesson_songs ls
SET title = REPLACE(REPLACE(ls.title, '・シングル', 'その1'), '・ランダム進行', 'その2')
FROM public.lessons l
WHERE ls.lesson_id = l.id
  AND l.course_id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner')
  AND ls.is_fantasy = true;

COMMIT;
