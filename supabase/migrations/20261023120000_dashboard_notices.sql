-- Dashboard notice cards (separate from announcements feed)

CREATE TABLE IF NOT EXISTS public.dashboard_notices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL CHECK (platform IN ('ios', 'web')),
  locale text NOT NULL CHECK (locale IN ('ja', 'en')),
  title text NOT NULL,
  body text NOT NULL,
  action_label text NOT NULL,
  action_kind text NOT NULL CHECK (action_kind IN ('external', 'tab')),
  action_target text NOT NULL,
  is_published boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT dashboard_notices_action_target_check CHECK (
    (action_kind = 'external' AND action_target ~ '^https://')
    OR (
      action_kind = 'tab'
      AND action_target IN ('account', 'quest', 'play', 'training', 'top')
    )
  )
);

CREATE INDEX IF NOT EXISTS dashboard_notices_published_idx
  ON public.dashboard_notices (platform, locale, is_published, sort_order, created_at DESC);

ALTER TABLE public.dashboard_notices ENABLE ROW LEVEL SECURITY;

CREATE POLICY dashboard_notices_public_read ON public.dashboard_notices
  FOR SELECT USING (is_published = true);

CREATE POLICY dashboard_notices_admin_read ON public.dashboard_notices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin IS TRUE
    )
  );

CREATE POLICY dashboard_notices_admin_modify ON public.dashboard_notices
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin IS TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_admin IS TRUE
    )
  );

GRANT SELECT ON public.dashboard_notices TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.dashboard_notices TO authenticated;

-- Test seed rows (all published)
INSERT INTO public.dashboard_notices (
  platform, locale, title, body, action_label, action_kind, action_target, is_published, sort_order
) VALUES
  (
    'ios', 'ja',
    'Jazzify 公式サイト',
    '練習のヒントや最新情報は公式サイトでもチェックできます。',
    'サイトを見る →',
    'external', 'https://jazzify.jp/',
    true, 0
  ),
  (
    'ios', 'en',
    'Jazzify official site',
    'Get practice tips and the latest news on our official site.',
    'Visit site →',
    'external', 'https://en.jazzify.jp/',
    true, 0
  ),
  (
    'web', 'ja',
    'アカウント設定',
    'プロフィールやプラン、通知設定はアカウント画面から変更できます。',
    'アカウントへ →',
    'tab', 'account',
    true, 0
  ),
  (
    'web', 'en',
    'Account settings',
    'Update your profile, plan, and notification preferences from Account.',
    'Go to Account →',
    'tab', 'account',
    true, 0
  );
