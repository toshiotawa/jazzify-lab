-- Hide selected lessons from shipped iOS and production web.
-- The input-setup quest is inserted in this same migration so it is never
-- visible without the gate.

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS min_ios_app_version text,
  ADD COLUMN IF NOT EXISTS web_visibility text NOT NULL DEFAULT 'production';

ALTER TABLE public.lessons
  DROP CONSTRAINT IF EXISTS lessons_web_visibility_check;

ALTER TABLE public.lessons
  ADD CONSTRAINT lessons_web_visibility_check
  CHECK (web_visibility IN ('production', 'staging'));

COMMENT ON COLUMN public.lessons.min_ios_app_version IS
  'NULL means every iOS build. Otherwise the app version must be greater or equal.';
COMMENT ON COLUMN public.lessons.web_visibility IS
  'production is visible on the web. staging is visible only when the web client sends a staging header.';

CREATE OR REPLACE FUNCTION public.app_version_gte(actual text, minimum text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  a text[];
  b text[];
  i int;
  av int;
  bv int;
BEGIN
  IF actual IS NULL OR minimum IS NULL THEN
    RETURN false;
  END IF;
  IF actual !~ '^[0-9]+(\.[0-9]+){0,2}$' OR minimum !~ '^[0-9]+(\.[0-9]+){0,2}$' THEN
    RETURN false;
  END IF;
  a := string_to_array(actual, '.');
  b := string_to_array(minimum, '.');
  FOR i IN 1..3 LOOP
    av := COALESCE(a[i], '0')::int;
    bv := COALESCE(b[i], '0')::int;
    IF av > bv THEN
      RETURN true;
    ELSIF av < bv THEN
      RETURN false;
    END IF;
  END LOOP;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.lesson_visible_to_request(
  min_ios_app_version text,
  web_visibility text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  headers json;
  info text;
  platform text;
  value text;
BEGIN
  BEGIN
    headers := nullif(current_setting('request.headers', true), '')::json;
  EXCEPTION WHEN others THEN
    RETURN false;
  END;
  IF headers IS NULL THEN
    RETURN false;
  END IF;

  info := lower(coalesce(headers->>'x-client-info', ''));
  platform := split_part(info, '/', 1);
  value := split_part(info, '/', 2);

  IF platform = 'jazzify-ios' THEN
    IF min_ios_app_version IS NULL THEN
      RETURN true;
    END IF;
    RETURN public.app_version_gte(value, min_ios_app_version);
  END IF;

  IF platform = 'jazzify-web' THEN
    IF web_visibility = 'production' THEN
      RETURN value IN ('production', 'staging');
    END IF;
    RETURN web_visibility = 'staging' AND value = 'staging';
  END IF;

  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.app_version_gte(text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.lesson_visible_to_request(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_version_gte(text, text) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.lesson_visible_to_request(text, text) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS lessons_client_release_gate ON public.lessons;
CREATE POLICY lessons_client_release_gate ON public.lessons
AS RESTRICTIVE
FOR SELECT
USING (
  (min_ios_app_version IS NULL AND web_visibility = 'production')
  OR public.lesson_visible_to_request(min_ios_app_version, web_visibility)
);

-- Completion counts must ignore lessons the caller cannot see.
CREATE OR REPLACE FUNCTION public.check_block_completion(
  p_user_id uuid,
  p_course_id uuid,
  p_block_number integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_lessons integer;
  completed_lessons integer;
BEGIN
  SELECT count(*)
  INTO total_lessons
  FROM public.lessons l
  WHERE l.course_id = p_course_id
    AND l.block_number = p_block_number
    AND (
      (l.min_ios_app_version IS NULL AND l.web_visibility = 'production')
      OR public.lesson_visible_to_request(l.min_ios_app_version, l.web_visibility)
    );

  SELECT count(*)
  INTO completed_lessons
  FROM public.user_lesson_progress ulp
  JOIN public.lessons l ON l.id = ulp.lesson_id
  WHERE ulp.user_id = p_user_id
    AND ulp.course_id = p_course_id
    AND l.block_number = p_block_number
    AND ulp.completed = true
    AND (
      (l.min_ios_app_version IS NULL AND l.web_visibility = 'production')
      OR public.lesson_visible_to_request(l.min_ios_app_version, l.web_visibility)
    );

  RETURN total_lessons > 0 AND total_lessons = completed_lessons;
END;
$$;

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS is_input_tutorial boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.lesson_songs.is_input_tutorial IS
  'レッスン実習: 入力方法の初回設定。他の課題フラグとは排他。';

DO $$
DECLARE
  existing text;
  inner_expr text;
  input_branch text;
BEGIN
  SELECT pg_get_constraintdef(oid)
  INTO existing
  FROM pg_constraint
  WHERE conname = 'lesson_songs_content_check'
    AND conrelid = 'public.lesson_songs'::regclass;

  IF existing IS NULL OR existing NOT LIKE 'CHECK (%' THEN
    RAISE EXCEPTION 'lesson_songs_content_check was not found';
  END IF;

  inner_expr := substring(existing FROM 8);
  inner_expr := left(inner_expr, length(inner_expr) - 1);

  input_branch := $branch$
    COALESCE(is_input_tutorial, false) = true
    AND COALESCE(is_fantasy, false) = false
    AND COALESCE(is_survival, false) = false
    AND COALESCE(is_ear_training, false) = false
    AND COALESCE(is_balloon_rush, false) = false
    AND COALESCE(is_survival_tutorial, false) = false
    AND COALESCE(is_ear_training_tutorial, false) = false
    AND COALESCE(is_video_lesson, false) = false
    AND COALESCE(is_defense, false) = false
    AND COALESCE(is_training, false) = false
    AND COALESCE(is_training_goal_set, false) = false
    AND fantasy_stage_id IS NULL
    AND survival_stage_number IS NULL
    AND survival_composite_config IS NULL
    AND ear_training_stage_id IS NULL
    AND balloon_rush_stage_id IS NULL
    AND survival_tutorial_script_id IS NULL
    AND ear_training_tutorial_script_id IS NULL
    AND video_lesson_stage_id IS NULL
    AND defense_stage_id IS NULL
    AND training_id IS NULL
    AND training_lesson_config IS NULL
    AND training_goal_set_id IS NULL
  $branch$;

  EXECUTE 'ALTER TABLE public.lesson_songs DROP CONSTRAINT lesson_songs_content_check';
  EXECUTE
    'ALTER TABLE public.lesson_songs ADD CONSTRAINT lesson_songs_content_check CHECK ('
    || '(COALESCE(is_input_tutorial, false) = false AND ('
    || inner_expr
    || ')) OR ('
    || input_branch
    || '))';
END $$;

INSERT INTO public.lessons (
  id, course_id, title, title_en, description, description_en,
  premium_only, order_index, block_number, block_name, block_name_en,
  assignment_description, assignment_description_en,
  min_ios_app_version, web_visibility
) VALUES
(
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-piano'),
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'はじめての設定',
  'First-time setup',
  '入力方法を選んで、ド・レ・ミを演奏します。',
  'Choose an input method and play do, re, and mi.',
  false,
  -1,
  1,
  'ドとソでジャズの返事',
  'Jazz Reply with Do and Sol',
  '入力方法を設定して、譜面のド・レ・ミを演奏しましょう。',
  'Set up your input and play do, re, and mi on the staff.',
  '1.4.10',
  'staging'
),
(
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-all'),
  'd58b1750-d896-5273-b98b-57115ccfb5fa'::uuid,
  'はじめての設定',
  'First-time setup',
  '入力方法を選んで、ド・レ・ミを演奏します。',
  'Choose an input method and play do, re, and mi.',
  false,
  -1,
  1,
  'ドとソでジャズの返事',
  'Jazz Reply with Do and Sol',
  '入力方法を設定して、譜面のド・レ・ミを演奏しましょう。',
  'Set up your input and play do, re, and mi on the staff.',
  '1.4.10',
  'staging'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.lesson_songs (
  id, lesson_id, order_index, title, title_en,
  is_input_tutorial, is_clear_required, clear_conditions
) VALUES
(
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-piano-song'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-piano'),
  0,
  'はじめての設定',
  'First-time setup',
  true,
  true,
  '{"count":1,"rank":"C"}'::jsonb
),
(
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-all-song'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-input-tutorial-all'),
  0,
  'はじめての設定',
  'First-time setup',
  true,
  true,
  '{"count":1,"rank":"C"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Users who already cleared anything in the course must not get later blocks locked.
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
  AND NOT EXISTS (
    SELECT 1
    FROM public.user_lesson_requirements_progress AS existing
    WHERE existing.user_id = ulp.user_id
      AND existing.lesson_song_id = ls.id
  );
