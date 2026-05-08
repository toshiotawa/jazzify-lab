-- Per-phrase key signature for chord-voicing staff. NULL inherits ear_training_stages.key_fifths.
-- Dev chord-voicing test: phrase1 Gb major (-6), phrase2 B major (+5); chord names / MIDI unchanged.

ALTER TABLE public.ear_training_phrases
  ADD COLUMN IF NOT EXISTS key_fifths integer NULL;

ALTER TABLE public.ear_training_phrases
  DROP CONSTRAINT IF EXISTS ear_training_phrases_key_fifths_check;

ALTER TABLE public.ear_training_phrases
  ADD CONSTRAINT ear_training_phrases_key_fifths_check
  CHECK (key_fifths IS NULL OR (key_fifths >= -7 AND key_fifths <= 7));

COMMENT ON COLUMN public.ear_training_phrases.key_fifths IS
  'Optional MusicXML-style fifths for staff (-7..7). NULL uses stage key_fifths.';

UPDATE public.ear_training_phrases
SET key_fifths = -6
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-1');

UPDATE public.ear_training_phrases
SET key_fifths = 5
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'dev-ear-chord-phrase-2');
