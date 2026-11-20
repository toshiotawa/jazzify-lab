-- Publish main-quest input tutorial lessons on Web production.
-- Re-backfill progress for users who cleared another quest in the same course
-- before this release so block completion stays consistent.

DO $$
DECLARE
  piano_lesson_id uuid;
  all_lesson_id uuid;
BEGIN
  piano_lesson_id := uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'mq-input-tutorial-piano'
  );
  all_lesson_id := uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'mq-input-tutorial-all'
  );

  INSERT INTO public.user_lesson_progress (
    user_id, lesson_id, course_id, completed, completion_date, is_unlocked, updated_at
  )
  SELECT DISTINCT
    ulp.user_id,
    gated.id,
    gated.course_id,
    true,
    now(),
    true,
    now()
  FROM public.user_lesson_progress AS ulp
  JOIN public.lessons AS existing
    ON existing.id = ulp.lesson_id
   AND existing.course_id = ulp.course_id
  JOIN public.lessons AS gated
    ON gated.course_id = existing.course_id
   AND gated.id IN (piano_lesson_id, all_lesson_id)
  WHERE ulp.user_id IS NOT NULL
    AND ulp.completed = true
    AND existing.id <> gated.id
    AND NOT EXISTS (
      SELECT 1
      FROM public.user_lesson_progress AS done
      WHERE done.user_id = ulp.user_id
        AND done.lesson_id = gated.id
        AND done.completed = true
    )
  ON CONFLICT (user_id, lesson_id) DO UPDATE
  SET
    completed = true,
    is_unlocked = true,
    completion_date = COALESCE(public.user_lesson_progress.completion_date, EXCLUDED.completion_date),
    updated_at = now();

  INSERT INTO public.user_lesson_requirements_progress (
    user_id, lesson_id, lesson_song_id,
    clear_count, is_completed, best_rank, last_cleared_at
  )
  SELECT
    ulp.user_id,
    ls.lesson_id,
    ls.id,
    1,
    true,
    'S',
    now()
  FROM public.user_lesson_progress AS ulp
  JOIN public.lesson_songs AS ls
    ON ls.lesson_id = ulp.lesson_id
   AND ls.is_input_tutorial = true
  WHERE ulp.completed = true
    AND ulp.user_id IS NOT NULL
    AND ulp.lesson_id IN (piano_lesson_id, all_lesson_id)
  ON CONFLICT (user_id, lesson_id, lesson_song_id) WHERE lesson_song_id IS NOT NULL
  DO NOTHING;

  UPDATE public.lessons
  SET
    web_visibility = 'production',
    updated_at = now()
  WHERE id IN (piano_lesson_id, all_lesson_id)
    AND web_visibility <> 'production';
END $$;