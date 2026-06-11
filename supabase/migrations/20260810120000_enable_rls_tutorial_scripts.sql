-- Enable RLS on tutorial script tables (Supabase security advisor: rls_disabled_in_public)
BEGIN;

ALTER TABLE public.survival_tutorial_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ear_training_tutorial_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS survival_tutorial_scripts_select_all ON public.survival_tutorial_scripts;
CREATE POLICY survival_tutorial_scripts_select_all ON public.survival_tutorial_scripts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS survival_tutorial_scripts_insert_admin ON public.survival_tutorial_scripts;
CREATE POLICY survival_tutorial_scripts_insert_admin ON public.survival_tutorial_scripts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_tutorial_scripts_update_admin ON public.survival_tutorial_scripts;
CREATE POLICY survival_tutorial_scripts_update_admin ON public.survival_tutorial_scripts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS survival_tutorial_scripts_delete_admin ON public.survival_tutorial_scripts;
CREATE POLICY survival_tutorial_scripts_delete_admin ON public.survival_tutorial_scripts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS ear_training_tutorial_scripts_select_all ON public.ear_training_tutorial_scripts;
CREATE POLICY ear_training_tutorial_scripts_select_all ON public.ear_training_tutorial_scripts
  FOR SELECT USING (true);

DROP POLICY IF EXISTS ear_training_tutorial_scripts_insert_admin ON public.ear_training_tutorial_scripts;
CREATE POLICY ear_training_tutorial_scripts_insert_admin ON public.ear_training_tutorial_scripts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS ear_training_tutorial_scripts_update_admin ON public.ear_training_tutorial_scripts;
CREATE POLICY ear_training_tutorial_scripts_update_admin ON public.ear_training_tutorial_scripts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS ear_training_tutorial_scripts_delete_admin ON public.ear_training_tutorial_scripts;
CREATE POLICY ear_training_tutorial_scripts_delete_admin ON public.ear_training_tutorial_scripts
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

CREATE OR REPLACE FUNCTION public.set_survival_tutorial_scripts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_survival_tutorial_scripts_updated_at ON public.survival_tutorial_scripts;
CREATE TRIGGER trg_survival_tutorial_scripts_updated_at
  BEFORE UPDATE ON public.survival_tutorial_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_survival_tutorial_scripts_updated_at();

CREATE OR REPLACE FUNCTION public.set_ear_training_tutorial_scripts_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ear_training_tutorial_scripts_updated_at ON public.ear_training_tutorial_scripts;
CREATE TRIGGER trg_ear_training_tutorial_scripts_updated_at
  BEFORE UPDATE ON public.ear_training_tutorial_scripts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ear_training_tutorial_scripts_updated_at();

GRANT SELECT ON public.survival_tutorial_scripts TO anon, authenticated;
GRANT SELECT ON public.ear_training_tutorial_scripts TO anon, authenticated;

COMMIT;
