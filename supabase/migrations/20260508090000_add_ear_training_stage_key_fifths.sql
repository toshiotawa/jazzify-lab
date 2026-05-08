ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS key_fifths integer NOT NULL DEFAULT 0
  CHECK (key_fifths >= -7 AND key_fifths <= 7);

COMMENT ON COLUMN public.ear_training_stages.key_fifths IS
  'Music key signature fifths count for battle-mode staff rendering (-7 flats to +7 sharps).';
