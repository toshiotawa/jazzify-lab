CREATE TABLE IF NOT EXISTS public.app_release_versions (
  platform text PRIMARY KEY CHECK (platform <> ''),
  latest_version text NOT NULL CHECK (latest_version <> ''),
  app_store_url text NOT NULL CHECK (app_store_url <> ''),
  title text NOT NULL,
  message text NOT NULL,
  title_en text,
  message_en text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.app_release_versions IS 'Latest public app release versions used by native clients to show optional update notices.';
COMMENT ON COLUMN public.app_release_versions.platform IS 'Native app platform key, e.g. ios.';
COMMENT ON COLUMN public.app_release_versions.latest_version IS 'Latest App Store marketing version for this platform.';
COMMENT ON COLUMN public.app_release_versions.app_store_url IS 'App Store URL opened from the native update notice.';

INSERT INTO public.app_release_versions (
  platform,
  latest_version,
  app_store_url,
  title,
  message,
  title_en,
  message_en,
  is_active
)
VALUES (
  'ios',
  '1.2.4',
  'https://apps.apple.com/us/app/jazzify/id6761457001',
  '新しいバージョンがあります',
  'App Storeで最新バージョンにアップデートできます。',
  'A new version is available',
  'Update to the latest version on the App Store.',
  true
)
ON CONFLICT (platform) DO UPDATE
SET
  latest_version = EXCLUDED.latest_version,
  app_store_url = EXCLUDED.app_store_url,
  title = EXCLUDED.title,
  message = EXCLUDED.message,
  title_en = EXCLUDED.title_en,
  message_en = EXCLUDED.message_en,
  is_active = EXCLUDED.is_active,
  updated_at = now();

CREATE OR REPLACE FUNCTION public.set_app_release_versions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS app_release_versions_updated_at_trigger ON public.app_release_versions;
CREATE TRIGGER app_release_versions_updated_at_trigger
  BEFORE UPDATE ON public.app_release_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.set_app_release_versions_updated_at();

ALTER TABLE public.app_release_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS app_release_versions_select_all ON public.app_release_versions;
CREATE POLICY app_release_versions_select_all ON public.app_release_versions
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS app_release_versions_insert_admin ON public.app_release_versions;
CREATE POLICY app_release_versions_insert_admin ON public.app_release_versions
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS app_release_versions_update_admin ON public.app_release_versions;
CREATE POLICY app_release_versions_update_admin ON public.app_release_versions
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS app_release_versions_delete_admin ON public.app_release_versions;
CREATE POLICY app_release_versions_delete_admin ON public.app_release_versions
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );
