-- Add country column to profiles
-- ISO 3166-1 alpha-2 country code (e.g., JP, US). Null allowed initially for existing users.
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS country text;

-- Optional: set existing rows based on heuristic later; leave NULL for now

-- Optional: add a check constraint to limit length to 2-3 chars (alpha-2 or special values like 'OVERSEAS')
DO $$ BEGIN
  ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_country_length_chk CHECK (char_length(country) BETWEEN 2 AND 16);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Optional index if we will filter by country
DO $$ BEGIN
  CREATE INDEX IF NOT EXISTS profiles_country_idx ON public.profiles (country);
EXCEPTION WHEN duplicate_table THEN NULL; END $$;