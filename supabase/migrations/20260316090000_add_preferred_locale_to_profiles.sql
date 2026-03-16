ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferred_locale text;

DO $$ BEGIN
  ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preferred_locale_chk
  CHECK (preferred_locale IS NULL OR preferred_locale IN ('ja', 'en'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
