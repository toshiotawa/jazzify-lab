-- Web signup device context (captured once at profile creation)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_device_category text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_os text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signup_browser text;

COMMENT ON COLUMN public.profiles.signup_device_category IS
  'desktop|mobile|tablet at profile creation (web signups)';
COMMENT ON COLUMN public.profiles.signup_os IS
  'ios|android|windows|macos|other at profile creation';
COMMENT ON COLUMN public.profiles.signup_browser IS
  'safari|chrome|firefox|edge|other at profile creation';
