-- Keep public latest marketing version at 1.4.5 for native update notices
-- (app MARKETING_VERSION may be ahead while App Store / notice stay on 1.4.5).

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
  '1.4.5',
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
