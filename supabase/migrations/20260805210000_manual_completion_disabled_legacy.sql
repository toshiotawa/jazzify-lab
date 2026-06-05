BEGIN;

DROP TRIGGER IF EXISTS trg_reject_manual_completion_disabled_lesson ON public.user_lesson_progress;

DROP FUNCTION IF EXISTS public.reject_lesson_progress_when_manual_completion_disabled();

COMMENT ON COLUMN public.lessons.manual_completion_disabled IS
  'legacy flag from tutorial coming-soon state; no longer controls manual lesson completion';

COMMIT;
