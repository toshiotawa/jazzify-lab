-- Bump public latest marketing version reference for native update notices (aligned with MARKETING_VERSION 1.2.8).

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
  '1.2.8',
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
