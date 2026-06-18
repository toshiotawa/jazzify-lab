-- 両手ヴォイシングコース修正 (1/8): schema
BEGIN;

ALTER TABLE public.ear_training_chord_quiz_items
  ADD COLUMN IF NOT EXISTS key_fifths smallint NOT NULL DEFAULT 0;

COMMIT;