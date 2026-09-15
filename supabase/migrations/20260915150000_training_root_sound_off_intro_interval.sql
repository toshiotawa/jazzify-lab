-- Training: disable root correct sound for note reading and interval kinds
BEGIN;

UPDATE public.trainings
SET play_root_on_correct = false, updated_at = now()
WHERE kind IN ('note_reading', 'interval');

COMMIT;
