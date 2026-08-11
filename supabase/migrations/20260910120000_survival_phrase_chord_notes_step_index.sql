-- Survival Phrases: simultaneous-note grouping within a chunk (step_index).
-- NULL = legacy one-note-per-step (existing rows unchanged).

ALTER TABLE public.survival_phrase_chord_notes
  ADD COLUMN IF NOT EXISTS step_index smallint
  CHECK (step_index IS NULL OR step_index >= 0);

COMMENT ON COLUMN public.survival_phrase_chord_notes.step_index IS
  'Simultaneous-note group within the chunk. NULL = own step (legacy: one note per step).';
