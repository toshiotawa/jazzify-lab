-- User instrument at signup and notation instrument preference (settings modal).

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS instrument text;

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS notation_instrument text;

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_instrument_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_instrument_check
CHECK (
  instrument IS NULL OR instrument IN (
    'piano', 'flute', 'oboe', 'violin', 'guitar', 'ukulele',
    'trumpet_bb', 'clarinet_bb', 'soprano_sax', 'alto_sax', 'tenor_sax', 'baritone_sax',
    'french_horn_f', 'bass_clarinet_bb',
    'trombone', 'euphonium', 'tuba', 'cello', 'bassoon', 'electric_bass', 'double_bass'
  )
);

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_notation_instrument_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_notation_instrument_check
CHECK (
  notation_instrument IS NULL OR notation_instrument IN (
    'piano', 'flute', 'oboe', 'violin', 'guitar', 'ukulele',
    'trumpet_bb', 'clarinet_bb', 'soprano_sax', 'alto_sax', 'tenor_sax', 'baritone_sax',
    'french_horn_f', 'bass_clarinet_bb',
    'trombone', 'euphonium', 'tuba', 'cello', 'bassoon', 'electric_bass', 'double_bass'
  )
);

COMMENT ON COLUMN public.profiles.instrument IS
  'Instrument selected at signup (analytics / onboarding).';

COMMENT ON COLUMN public.profiles.notation_instrument IS
  'Notation instrument preset for sheet music display (settings modal).';
