-- サバイバル本編BGMを難易度別/WAVE別からステージ種別別へ切り替える
-- random / progression それぞれに1曲だけ設定し、ゲーム中のBGM切替は行わない。

CREATE TABLE IF NOT EXISTS public.survival_bgm_settings (
  stage_type text PRIMARY KEY CHECK (stage_type IN ('random', 'progression')),
  bgm_url text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.survival_bgm_settings IS 'Survival gameplay BGM settings keyed by stage type.';
COMMENT ON COLUMN public.survival_bgm_settings.stage_type IS 'Survival stage type: random or progression.';
COMMENT ON COLUMN public.survival_bgm_settings.bgm_url IS 'Looped BGM URL used for the entire gameplay session.';

INSERT INTO public.survival_bgm_settings (stage_type, bgm_url)
VALUES
  ('random', 'https://jazzify-cdn.com/fantasy-bgm/c0371aef-0afb-482c-91b6-c2cbf73b588e.mp3'),
  ('progression', 'https://jazzify-cdn.com/fantasy-bgm/116797c5-c714-4a4d-85c6-5212af860d0b.mp3')
ON CONFLICT (stage_type) DO UPDATE
SET
  bgm_url = EXCLUDED.bgm_url,
  updated_at = now();

ALTER TABLE public.survival_bgm_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS survival_bgm_settings_select_all ON public.survival_bgm_settings;
CREATE POLICY survival_bgm_settings_select_all ON public.survival_bgm_settings
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS survival_bgm_settings_insert_admin ON public.survival_bgm_settings;
CREATE POLICY survival_bgm_settings_insert_admin ON public.survival_bgm_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_bgm_settings_update_admin ON public.survival_bgm_settings;
CREATE POLICY survival_bgm_settings_update_admin ON public.survival_bgm_settings
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

DROP POLICY IF EXISTS survival_bgm_settings_delete_admin ON public.survival_bgm_settings;
CREATE POLICY survival_bgm_settings_delete_admin ON public.survival_bgm_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );
