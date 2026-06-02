-- Input-disabled regions (listen-only) and phrase-pair step quotes for ear training battles.

ALTER TABLE public.ear_training_phrase_chords
  ADD COLUMN IF NOT EXISTS input_disabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_phrase_chords.input_disabled IS
  'When true, MIDI/piano input is ignored for battle judgment (sound still plays). Adlib / chord voicing.';

ALTER TABLE public.ear_training_phrase_pair_adlib_steps
  ADD COLUMN IF NOT EXISTS quote text,
  ADD COLUMN IF NOT EXISTS input_disabled boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_phrase_pair_adlib_steps.quote IS
  'Player speech bubble text while this timed step is active (measure-tied via step window).';

COMMENT ON COLUMN public.ear_training_phrase_pair_adlib_steps.input_disabled IS
  'When true, input has no battle effect; matcher buffer resets on step entry.';
