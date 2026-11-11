-- Hide granted tutorial progress from clients that cannot see the quest,
-- and keep granting it when those clients clear another quest in the course.

CREATE OR REPLACE FUNCTION public.lesson_progress_visible_to_request(p_lesson_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (
      SELECT
        (lesson.min_ios_app_version IS NULL AND lesson.web_visibility = 'production')
        OR public.lesson_visible_to_request(lesson.min_ios_app_version, lesson.web_visibility)
      FROM public.lessons AS lesson
      WHERE lesson.id = p_lesson_id
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.lesson_progress_visible_to_request(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.lesson_progress_visible_to_request(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS user_lesson_progress_client_release_gate ON public.user_lesson_progress;
CREATE POLICY user_lesson_progress_client_release_gate
ON public.user_lesson_progress
AS RESTRICTIVE
FOR SELECT
USING (public.lesson_progress_visible_to_request(lesson_id));

DROP POLICY IF EXISTS user_lesson_requirements_progress_client_release_gate
ON public.user_lesson_requirements_progress;
CREATE POLICY user_lesson_requirements_progress_client_release_gate
ON public.user_lesson_requirements_progress
AS RESTRICTIVE
FOR SELECT
USING (public.lesson_progress_visible_to_request(lesson_id));

CREATE OR REPLACE FUNCTION public.grant_hidden_input_tutorial_on_course_clear()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  gated_lesson_id uuid;
  gated_course_id uuid;
  gated_min_ios text;
  gated_web_visibility text;
  tutorial_song_id uuid;
BEGIN
  IF NEW.completed IS NOT TRUE OR NEW.user_id IS NULL OR NEW.course_id IS NULL THEN
    RETURN NEW;
  END IF;

  gated_lesson_id := CASE NEW.course_id
    WHEN 'a0000000-0000-0000-0000-000000000001'::uuid THEN
      extensions.uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-piano'::text)
    WHEN 'd58b1750-d896-5273-b98b-57115ccfb5fa'::uuid THEN
      extensions.uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-all'::text)
    ELSE NULL
  END;

  IF gated_lesson_id IS NULL OR gated_lesson_id = NEW.lesson_id THEN
    RETURN NEW;
  END IF;

  SELECT lesson.course_id, lesson.min_ios_app_version, lesson.web_visibility
  INTO gated_course_id, gated_min_ios, gated_web_visibility
  FROM public.lessons AS lesson
  WHERE lesson.id = gated_lesson_id;

  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  IF public.lesson_visible_to_request(gated_min_ios, gated_web_visibility) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_lesson_progress (
    user_id, lesson_id, course_id, completed, completion_date, is_unlocked, updated_at
  ) VALUES (
    NEW.user_id, gated_lesson_id, gated_course_id, true, now(), true, now()
  )
  ON CONFLICT (user_id, lesson_id) DO UPDATE
  SET
    completed = true,
    is_unlocked = true,
    completion_date = COALESCE(public.user_lesson_progress.completion_date, EXCLUDED.completion_date),
    updated_at = now();

  SELECT song.id
  INTO tutorial_song_id
  FROM public.lesson_songs AS song
  WHERE song.lesson_id = gated_lesson_id
    AND song.is_input_tutorial = true
  LIMIT 1;

  IF tutorial_song_id IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_lesson_requirements_progress (
    user_id, lesson_id, lesson_song_id,
    clear_count, is_completed, best_rank, last_cleared_at
  ) VALUES (
    NEW.user_id, gated_lesson_id, tutorial_song_id,
    1, true, 'S', now()
  )
  ON CONFLICT (user_id, lesson_id, lesson_song_id) WHERE lesson_song_id IS NOT NULL
  DO NOTHING;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.grant_hidden_input_tutorial_on_course_clear() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_hidden_input_tutorial_on_course_clear() TO authenticated, service_role;

DROP TRIGGER IF EXISTS grant_hidden_input_tutorial_on_course_clear ON public.user_lesson_progress;
CREATE TRIGGER grant_hidden_input_tutorial_on_course_clear
AFTER INSERT OR UPDATE OF completed ON public.user_lesson_progress
FOR EACH ROW
WHEN (NEW.completed IS TRUE)
EXECUTE FUNCTION public.grant_hidden_input_tutorial_on_course_clear();

-- Catch users who cleared a quest after the original grant and before this trigger.
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
 AND gated.id IN (
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-piano'),
   uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-all')
 )
WHERE ulp.user_id IS NOT NULL
  AND ulp.completed = true
  AND existing.id <> gated.id
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
  AND ulp.lesson_id IN (
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-piano'),
    uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-all')
  )
ON CONFLICT (user_id, lesson_id, lesson_song_id) WHERE lesson_song_id IS NOT NULL
DO NOTHING;
