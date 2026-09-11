-- Main quest split: piano (existing) + all-instruments duplicate course.
BEGIN;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS main_quest_instrument text DEFAULT NULL;

ALTER TABLE public.courses
  DROP CONSTRAINT IF EXISTS courses_main_quest_instrument_check;

ALTER TABLE public.courses
  ADD CONSTRAINT courses_main_quest_instrument_check
  CHECK (main_quest_instrument IS NULL OR main_quest_instrument IN ('piano', 'all'));

COMMENT ON COLUMN public.courses.main_quest_instrument IS
  'When is_main_course=true: piano = piano/keyboard track; all = all-instruments track.';

-- Tag existing main course as piano
UPDATE public.courses
SET main_quest_instrument = 'piano', updated_at = now()
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND is_main_course IS TRUE;

-- All-instruments main quest course
INSERT INTO public.courses (
  id, title, title_en, description, description_en,
  premium_only, order_index, audience, is_tutorial, is_visible,
  difficulty_tier, is_developer_only, is_main_course, main_quest_instrument
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-main-quest-all-instruments'),
  'メインクエスト（全楽器）',
  'Main Quest (All Instruments)',
  'ピアノ以外の楽器向け。コード演奏や左手課題を除いた一本道コース。',
  'For non-piano instruments. Excludes chord-play and left-hand focused quests.',
  c.premium_only,
  c.order_index + 1,
  c.audience,
  c.is_tutorial,
  c.is_visible,
  c.difficulty_tier,
  c.is_developer_only,
  true,
  'all'
FROM public.courses AS c
WHERE c.id = 'a0000000-0000-0000-0000-000000000001'::uuid
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  is_main_course = true,
  main_quest_instrument = 'all',
  updated_at = now();

-- ---------------------------------------------------------------------------
-- Tasks (lesson_songs) to exclude from the all-instruments copy:
--   survival / balloon rush / defense / training / chord-based ear training /
--   left-hand or two-hand titled tasks.
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _mq_exclude_tasks ON COMMIT DROP AS
SELECT ls.id AS lesson_song_id
FROM public.lesson_songs AS ls
JOIN public.lessons AS l ON l.id = ls.lesson_id
WHERE l.course_id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND (
    COALESCE(ls.is_survival, false)
    OR COALESCE(ls.is_survival_tutorial, false)
    OR COALESCE(ls.is_balloon_rush, false)
    OR COALESCE(ls.is_defense, false)
    OR COALESCE(ls.is_training, false)
    OR (
      COALESCE(ls.is_ear_training, false)
      AND ls.ear_training_stage_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM public.ear_training_stages AS ets
        WHERE ets.id = ls.ear_training_stage_id
          AND ets.mode IN ('chord_quiz', 'chord_voicing', 'chord_osmd', 'chord_precision')
      )
    )
    OR COALESCE(ls.title, '') ~* '(左手|両手|left.?hand|two.?hand)'
    OR COALESCE(ls.title_en, '') ~* '(left.?hand|two.?hand)'
  );

-- Lessons to copy: keep a lesson if it still has at least one task or a video.
CREATE TEMP TABLE _mq_copy_lessons ON COMMIT DROP AS
SELECT l.id AS lesson_id
FROM public.lessons AS l
WHERE l.course_id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND (
    EXISTS (
      SELECT 1 FROM public.lesson_songs AS ls
      WHERE ls.lesson_id = l.id
        AND ls.id NOT IN (SELECT lesson_song_id FROM _mq_exclude_tasks)
    )
    OR EXISTS (SELECT 1 FROM public.lesson_videos AS lv WHERE lv.lesson_id = l.id)
  );

-- Copy eligible lessons
INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  block_description, block_description_en, nav_links,
  assignment_description, assignment_description_en, manual_completion_disabled
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-all-' || l.id::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'course-main-quest-all-instruments'),
  l.title, l.title_en, l.description, l.description_en,
  l.premium_only, l.order_index, l.block_number, l.block_name, l.block_name_en,
  l.block_description, l.block_description_en, l.nav_links,
  l.assignment_description, l.assignment_description_en, l.manual_completion_disabled
FROM public.lessons AS l
WHERE l.id IN (SELECT lesson_id FROM _mq_copy_lessons)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  title_en = EXCLUDED.title_en,
  description = EXCLUDED.description,
  description_en = EXCLUDED.description_en,
  order_index = EXCLUDED.order_index,
  block_number = EXCLUDED.block_number,
  block_name = EXCLUDED.block_name,
  block_name_en = EXCLUDED.block_name_en,
  updated_at = now();

-- Copy remaining tasks
INSERT INTO public.lesson_songs (
  id, lesson_id, song_id, order_index, clear_conditions, is_clear_required,
  override_repeat_transposition_mode, override_start_key,
  override_production_staff_hint_mode, override_production_keyboard_hint_mode,
  is_fantasy, fantasy_stage_id,
  is_ear_training, ear_training_stage_id,
  is_ear_training_tutorial, ear_training_tutorial_script_id,
  is_video_lesson, video_lesson_stage_id,
  title, title_en
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-all-lsong-' || ls.id::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-all-' || ls.lesson_id::text),
  ls.song_id, ls.order_index, ls.clear_conditions, ls.is_clear_required,
  ls.override_repeat_transposition_mode, ls.override_start_key,
  ls.override_production_staff_hint_mode, ls.override_production_keyboard_hint_mode,
  ls.is_fantasy, ls.fantasy_stage_id,
  ls.is_ear_training, ls.ear_training_stage_id,
  ls.is_ear_training_tutorial, ls.ear_training_tutorial_script_id,
  ls.is_video_lesson, ls.video_lesson_stage_id,
  ls.title, ls.title_en
FROM public.lesson_songs AS ls
WHERE ls.lesson_id IN (SELECT lesson_id FROM _mq_copy_lessons)
  AND ls.id NOT IN (SELECT lesson_song_id FROM _mq_exclude_tasks)
ON CONFLICT (id) DO NOTHING;

-- Copy videos
INSERT INTO public.lesson_videos (
  id, lesson_id, vimeo_url, order_index, content_type, video_url, r2_key, locale_scope
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-all-video-' || lv.id::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-all-' || lv.lesson_id::text),
  lv.vimeo_url, lv.order_index, lv.content_type, lv.video_url, lv.r2_key, lv.locale_scope
FROM public.lesson_videos AS lv
WHERE lv.lesson_id IN (SELECT lesson_id FROM _mq_copy_lessons)
ON CONFLICT (id) DO NOTHING;

-- Copy attachments (unique on lesson_id + r2_key)
INSERT INTO public.lesson_attachments (
  id, lesson_id, file_name, url, r2_key, content_type, size, order_index, platinum_only, locale_scope
)
SELECT
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-all-att-' || la.id::text),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-all-' || la.lesson_id::text),
  la.file_name, la.url, la.r2_key, la.content_type, la.size, la.order_index, la.platinum_only, la.locale_scope
FROM public.lesson_attachments AS la
WHERE la.lesson_id IN (SELECT lesson_id FROM _mq_copy_lessons)
ON CONFLICT DO NOTHING;

COMMIT;
