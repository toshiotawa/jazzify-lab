-- Add concert_melody (単音楽器・コンサートキー) to profile instrument checks.

ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_instrument_check;

ALTER TABLE public.profiles
ADD CONSTRAINT profiles_instrument_check
CHECK (
  instrument IS NULL OR instrument IN (
    'piano', 'concert_melody', 'flute', 'oboe', 'violin', 'guitar', 'ukulele',
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
    'piano', 'concert_melody', 'flute', 'oboe', 'violin', 'guitar', 'ukulele',
    'trumpet_bb', 'clarinet_bb', 'soprano_sax', 'alto_sax', 'tenor_sax', 'baritone_sax',
    'french_horn_f', 'bass_clarinet_bb',
    'trombone', 'euphonium', 'tuba', 'cello', 'bassoon', 'electric_bass', 'double_bass'
  )
);
