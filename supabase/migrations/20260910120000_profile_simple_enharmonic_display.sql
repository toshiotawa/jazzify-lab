-- Simplified enharmonic display preference (settings modal, all modes).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS simple_enharmonic_display boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.simple_enharmonic_display IS
  'When true, re-spell double sharps/flats and white-key accidentals (E#, B#, Fb, Cb) as natural notes in sheet music display.';
