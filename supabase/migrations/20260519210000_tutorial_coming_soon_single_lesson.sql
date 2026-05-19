-- チュートリアルコースを「準備中」1レッスンに再編し、手動完了を無効化

BEGIN;

ALTER TABLE public.lessons
  ADD COLUMN IF NOT EXISTS manual_completion_disabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.lessons.manual_completion_disabled IS
  'true のときレッスン詳細で完了ボタンを非表示にし、user_lesson_progress の completed=true を拒否する';

-- チュートリアルコース既存レッスン削除（進捗・関連データ含む）
CREATE TEMP TABLE _tutorial_lesson_ids ON COMMIT DROP AS
  SELECT id FROM public.lessons
  WHERE course_id = 'a0000000-0000-0000-0000-000000000001'::uuid;

CREATE TEMP TABLE _tutorial_fantasy_stage_ids ON COMMIT DROP AS
  SELECT DISTINCT ls.fantasy_stage_id AS id
  FROM public.lesson_songs ls
  WHERE ls.lesson_id IN (SELECT id FROM _tutorial_lesson_ids)
    AND ls.fantasy_stage_id IS NOT NULL;

CREATE TEMP TABLE _tutorial_ear_stage_ids ON COMMIT DROP AS
  SELECT DISTINCT ls.ear_training_stage_id AS id
  FROM public.lesson_songs ls
  WHERE ls.lesson_id IN (SELECT id FROM _tutorial_lesson_ids)
    AND ls.ear_training_stage_id IS NOT NULL;

DELETE FROM public.user_lesson_requirements_progress
WHERE lesson_id IN (SELECT id FROM _tutorial_lesson_ids);

DELETE FROM public.user_lesson_progress
WHERE course_id = 'a0000000-0000-0000-0000-000000000001'::uuid;

DELETE FROM public.fantasy_stage_clears
WHERE stage_id IN (SELECT id FROM _tutorial_fantasy_stage_ids);

DELETE FROM public.user_challenge_fantasy_progress
WHERE fantasy_stage_id IN (SELECT id FROM _tutorial_fantasy_stage_ids);

DELETE FROM public.challenge_fantasy_tracks
WHERE fantasy_stage_id IN (SELECT id FROM _tutorial_fantasy_stage_ids);

DELETE FROM public.ear_training_phrase_demo_loops
WHERE phrase_id IN (
  SELECT p.id FROM public.ear_training_phrases p
  WHERE p.stage_id IN (SELECT id FROM _tutorial_ear_stage_ids)
);

DELETE FROM public.ear_training_phrase_chords
WHERE phrase_id IN (
  SELECT p.id FROM public.ear_training_phrases p
  WHERE p.stage_id IN (SELECT id FROM _tutorial_ear_stage_ids)
);

DELETE FROM public.ear_training_phrase_notes
WHERE phrase_id IN (
  SELECT p.id FROM public.ear_training_phrases p
  WHERE p.stage_id IN (SELECT id FROM _tutorial_ear_stage_ids)
);

DELETE FROM public.ear_training_phrases
WHERE stage_id IN (SELECT id FROM _tutorial_ear_stage_ids);

DELETE FROM public.ear_training_chord_quiz_items
WHERE stage_id IN (SELECT id FROM _tutorial_ear_stage_ids);

DELETE FROM public.lesson_attachments
WHERE lesson_id IN (SELECT id FROM _tutorial_lesson_ids);

DELETE FROM public.lesson_videos
WHERE lesson_id IN (SELECT id FROM _tutorial_lesson_ids);

DELETE FROM public.lesson_tracks
WHERE lesson_id IN (SELECT id FROM _tutorial_lesson_ids);

DELETE FROM public.lesson_songs
WHERE lesson_id IN (SELECT id FROM _tutorial_lesson_ids);

DELETE FROM public.fantasy_stages
WHERE id IN (SELECT id FROM _tutorial_fantasy_stage_ids);

DELETE FROM public.ear_training_stages
WHERE id IN (SELECT id FROM _tutorial_ear_stage_ids);

DELETE FROM public.lessons
WHERE id IN (SELECT id FROM _tutorial_lesson_ids);

UPDATE public.courses SET
  description = 'チュートリアルは現在準備中です。しばらくお待ちください。',
  description_en = 'The tutorial is being updated. Please check back soon.'
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND COALESCE(is_tutorial, false) = true;

INSERT INTO public.lessons (
  id,
  course_id,
  title,
  title_en,
  description,
  description_en,
  order_index,
  block_number,
  block_name,
  block_name_en,
  nav_links,
  manual_completion_disabled
) VALUES (
  'c0000000-0000-4000-8000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '準備中',
  'Coming Soon',
  'パワーアップして帰ってきます。',
  'We''re powering up and coming back soon.',
  0,
  1,
  'チュートリアル',
  'Tutorial',
  '[]'::jsonb,
  true
);

CREATE OR REPLACE FUNCTION public.reject_lesson_progress_when_manual_completion_disabled()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.completed IS TRUE THEN
    IF EXISTS (
      SELECT 1
      FROM public.lessons l
      WHERE l.id = NEW.lesson_id
        AND l.manual_completion_disabled IS TRUE
    ) THEN
      RAISE EXCEPTION 'lesson_manual_completion_disabled'
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_reject_manual_completion_disabled_lesson ON public.user_lesson_progress;

CREATE TRIGGER trg_reject_manual_completion_disabled_lesson
  BEFORE INSERT OR UPDATE OF completed ON public.user_lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.reject_lesson_progress_when_manual_completion_disabled();

COMMIT;
