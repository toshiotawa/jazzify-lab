-- 音楽理論初級: ファンタジー BASIC ステージを1ステージ=1レッスンで紐付け
-- 楽譜読み取り系（is_sheet_music_mode）のステージは除外。クリア条件: Bランク以上・1回。
BEGIN;

INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial
) VALUES (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  '音楽理論初級',
  'Introductory Music Theory',
  '',
  '',
  false,
  23,
  'both',
  false
)
ON CONFLICT (id) DO NOTHING;

WITH src AS (
  SELECT
    fs.id AS fantasy_stage_id,
    fs.stage_number,
    fs.name,
    COALESCE(NULLIF(trim(fs.name_en), ''), fs.name) AS name_en,
    ROW_NUMBER() OVER (
      ORDER BY
        split_part(fs.stage_number, '-', 1)::int,
        split_part(fs.stage_number, '-', 2)::int
    )::int AS ord
  FROM public.fantasy_stages fs
  WHERE fs.stage_tier = 'basic'
    AND fs.usage_type IN ('fantasy', 'both')
    AND fs.stage_number IS NOT NULL
    AND fs.stage_number NOT ILIKE 'DC-%'
    AND COALESCE(fs.is_sheet_music_mode, false) = false
)
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  order_index, block_number, block_name, block_name_en,
  premium_only, assignment_description, nav_links
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-lesson-' || src.stage_number),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-music-theory-beginner'),
  src.name,
  src.name_en,
  '',
  '',
  src.ord - 1,
  split_part(src.stage_number, '-', 1)::int,
  'ランク ' || split_part(src.stage_number, '-', 1),
  'Rank ' || split_part(src.stage_number, '-', 1),
  false,
  NULL,
  '[]'::jsonb
FROM src
ON CONFLICT (id) DO NOTHING;

WITH src AS (
  SELECT
    fs.id AS fantasy_stage_id,
    fs.stage_number,
    fs.name,
    ROW_NUMBER() OVER (
      ORDER BY
        split_part(fs.stage_number, '-', 1)::int,
        split_part(fs.stage_number, '-', 2)::int
    )::int AS ord
  FROM public.fantasy_stages fs
  WHERE fs.stage_tier = 'basic'
    AND fs.usage_type IN ('fantasy', 'both')
    AND fs.stage_number IS NOT NULL
    AND fs.stage_number NOT ILIKE 'DC-%'
    AND COALESCE(fs.is_sheet_music_mode, false) = false
)
INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions,
  is_fantasy, fantasy_stage_id, title
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-lsg-' || src.stage_number),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mtb-lesson-' || src.stage_number),
  NULL,
  0,
  '{"rank":"B","count":1}'::jsonb,
  true,
  src.fantasy_stage_id,
  src.name
FROM src
ON CONFLICT (id) DO NOTHING;

COMMIT;
