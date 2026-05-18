CREATE TABLE IF NOT EXISTS public.ios_midi_device_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_identifier text NOT NULL UNIQUE CHECK (model_identifier <> ''),
  device_family text NOT NULL CHECK (device_family IN ('iphone', 'ipad')),
  marketing_name text NOT NULL CHECK (marketing_name <> ''),
  connector_type text NOT NULL CHECK (connector_type IN ('usb_c', 'lightning')),
  is_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ios_midi_device_models IS 'iOS hardware identifiers used by native clients to choose the MIDI connection guide.';
COMMENT ON COLUMN public.ios_midi_device_models.model_identifier IS 'Exact hw.machine identifier, or __default_iphone__/__default_ipad__ for new-model fallback.';
COMMENT ON COLUMN public.ios_midi_device_models.connector_type IS 'Physical connector used for MIDI setup branching: usb_c or lightning.';

CREATE UNIQUE INDEX IF NOT EXISTS ios_midi_device_models_default_family_idx
  ON public.ios_midi_device_models (device_family)
  WHERE is_default IS TRUE;

CREATE INDEX IF NOT EXISTS ios_midi_device_models_active_lookup_idx
  ON public.ios_midi_device_models (model_identifier, is_active);

CREATE OR REPLACE FUNCTION public.set_ios_midi_device_models_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ios_midi_device_models_updated_at_trigger ON public.ios_midi_device_models;
CREATE TRIGGER ios_midi_device_models_updated_at_trigger
  BEFORE UPDATE ON public.ios_midi_device_models
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ios_midi_device_models_updated_at();

ALTER TABLE public.ios_midi_device_models ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS ios_midi_device_models_select_active ON public.ios_midi_device_models;
CREATE POLICY ios_midi_device_models_select_active ON public.ios_midi_device_models
  FOR SELECT
  USING (is_active IS TRUE);

DROP POLICY IF EXISTS ios_midi_device_models_insert_admin ON public.ios_midi_device_models;
CREATE POLICY ios_midi_device_models_insert_admin ON public.ios_midi_device_models
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

DROP POLICY IF EXISTS ios_midi_device_models_update_admin ON public.ios_midi_device_models;
CREATE POLICY ios_midi_device_models_update_admin ON public.ios_midi_device_models
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

DROP POLICY IF EXISTS ios_midi_device_models_delete_admin ON public.ios_midi_device_models;
CREATE POLICY ios_midi_device_models_delete_admin ON public.ios_midi_device_models
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
    )
  );

INSERT INTO public.ios_midi_device_models (
  model_identifier,
  device_family,
  marketing_name,
  connector_type,
  is_default,
  is_active
)
VALUES
  ('__default_iphone__', 'iphone', 'iPhone', 'usb_c', true, true),
  ('__default_ipad__', 'ipad', 'iPad', 'usb_c', true, true),

  ('iPhone5,1', 'iphone', 'iPhone 5', 'lightning', false, true),
  ('iPhone5,2', 'iphone', 'iPhone 5', 'lightning', false, true),
  ('iPhone5,3', 'iphone', 'iPhone 5c', 'lightning', false, true),
  ('iPhone5,4', 'iphone', 'iPhone 5c', 'lightning', false, true),
  ('iPhone6,1', 'iphone', 'iPhone 5s', 'lightning', false, true),
  ('iPhone6,2', 'iphone', 'iPhone 5s', 'lightning', false, true),
  ('iPhone7,1', 'iphone', 'iPhone 6 Plus', 'lightning', false, true),
  ('iPhone7,2', 'iphone', 'iPhone 6', 'lightning', false, true),
  ('iPhone8,1', 'iphone', 'iPhone 6s', 'lightning', false, true),
  ('iPhone8,2', 'iphone', 'iPhone 6s Plus', 'lightning', false, true),
  ('iPhone8,4', 'iphone', 'iPhone SE', 'lightning', false, true),
  ('iPhone9,1', 'iphone', 'iPhone 7', 'lightning', false, true),
  ('iPhone9,2', 'iphone', 'iPhone 7 Plus', 'lightning', false, true),
  ('iPhone9,3', 'iphone', 'iPhone 7', 'lightning', false, true),
  ('iPhone9,4', 'iphone', 'iPhone 7 Plus', 'lightning', false, true),
  ('iPhone10,1', 'iphone', 'iPhone 8', 'lightning', false, true),
  ('iPhone10,2', 'iphone', 'iPhone 8 Plus', 'lightning', false, true),
  ('iPhone10,3', 'iphone', 'iPhone X', 'lightning', false, true),
  ('iPhone10,4', 'iphone', 'iPhone 8', 'lightning', false, true),
  ('iPhone10,5', 'iphone', 'iPhone 8 Plus', 'lightning', false, true),
  ('iPhone10,6', 'iphone', 'iPhone X', 'lightning', false, true),
  ('iPhone11,2', 'iphone', 'iPhone XS', 'lightning', false, true),
  ('iPhone11,4', 'iphone', 'iPhone XS Max', 'lightning', false, true),
  ('iPhone11,6', 'iphone', 'iPhone XS Max', 'lightning', false, true),
  ('iPhone11,8', 'iphone', 'iPhone XR', 'lightning', false, true),
  ('iPhone12,1', 'iphone', 'iPhone 11', 'lightning', false, true),
  ('iPhone12,3', 'iphone', 'iPhone 11 Pro', 'lightning', false, true),
  ('iPhone12,5', 'iphone', 'iPhone 11 Pro Max', 'lightning', false, true),
  ('iPhone12,8', 'iphone', 'iPhone SE (2nd generation)', 'lightning', false, true),
  ('iPhone13,1', 'iphone', 'iPhone 12 mini', 'lightning', false, true),
  ('iPhone13,2', 'iphone', 'iPhone 12', 'lightning', false, true),
  ('iPhone13,3', 'iphone', 'iPhone 12 Pro', 'lightning', false, true),
  ('iPhone13,4', 'iphone', 'iPhone 12 Pro Max', 'lightning', false, true),
  ('iPhone14,2', 'iphone', 'iPhone 13 Pro', 'lightning', false, true),
  ('iPhone14,3', 'iphone', 'iPhone 13 Pro Max', 'lightning', false, true),
  ('iPhone14,4', 'iphone', 'iPhone 13 mini', 'lightning', false, true),
  ('iPhone14,5', 'iphone', 'iPhone 13', 'lightning', false, true),
  ('iPhone14,6', 'iphone', 'iPhone SE (3rd generation)', 'lightning', false, true),
  ('iPhone14,7', 'iphone', 'iPhone 14', 'lightning', false, true),
  ('iPhone14,8', 'iphone', 'iPhone 14 Plus', 'lightning', false, true),
  ('iPhone15,2', 'iphone', 'iPhone 14 Pro', 'lightning', false, true),
  ('iPhone15,3', 'iphone', 'iPhone 14 Pro Max', 'lightning', false, true),
  ('iPhone15,4', 'iphone', 'iPhone 15', 'usb_c', false, true),
  ('iPhone15,5', 'iphone', 'iPhone 15 Plus', 'usb_c', false, true),
  ('iPhone16,1', 'iphone', 'iPhone 15 Pro', 'usb_c', false, true),
  ('iPhone16,2', 'iphone', 'iPhone 15 Pro Max', 'usb_c', false, true),
  ('iPhone17,1', 'iphone', 'iPhone 16 Pro', 'usb_c', false, true),
  ('iPhone17,2', 'iphone', 'iPhone 16 Pro Max', 'usb_c', false, true),
  ('iPhone17,3', 'iphone', 'iPhone 16', 'usb_c', false, true),
  ('iPhone17,4', 'iphone', 'iPhone 16 Plus', 'usb_c', false, true),
  ('iPhone17,5', 'iphone', 'iPhone 16e', 'usb_c', false, true),

  ('iPad3,4', 'ipad', 'iPad (4th generation)', 'lightning', false, true),
  ('iPad3,5', 'ipad', 'iPad (4th generation)', 'lightning', false, true),
  ('iPad3,6', 'ipad', 'iPad (4th generation)', 'lightning', false, true),
  ('iPad4,1', 'ipad', 'iPad Air', 'lightning', false, true),
  ('iPad4,2', 'ipad', 'iPad Air', 'lightning', false, true),
  ('iPad4,3', 'ipad', 'iPad Air', 'lightning', false, true),
  ('iPad4,4', 'ipad', 'iPad mini 2', 'lightning', false, true),
  ('iPad4,5', 'ipad', 'iPad mini 2', 'lightning', false, true),
  ('iPad4,6', 'ipad', 'iPad mini 2', 'lightning', false, true),
  ('iPad4,7', 'ipad', 'iPad mini 3', 'lightning', false, true),
  ('iPad4,8', 'ipad', 'iPad mini 3', 'lightning', false, true),
  ('iPad4,9', 'ipad', 'iPad mini 3', 'lightning', false, true),
  ('iPad5,1', 'ipad', 'iPad mini 4', 'lightning', false, true),
  ('iPad5,2', 'ipad', 'iPad mini 4', 'lightning', false, true),
  ('iPad5,3', 'ipad', 'iPad Air 2', 'lightning', false, true),
  ('iPad5,4', 'ipad', 'iPad Air 2', 'lightning', false, true),
  ('iPad6,3', 'ipad', 'iPad Pro (9.7-inch)', 'lightning', false, true),
  ('iPad6,4', 'ipad', 'iPad Pro (9.7-inch)', 'lightning', false, true),
  ('iPad6,7', 'ipad', 'iPad Pro (12.9-inch)', 'lightning', false, true),
  ('iPad6,8', 'ipad', 'iPad Pro (12.9-inch)', 'lightning', false, true),
  ('iPad6,11', 'ipad', 'iPad (5th generation)', 'lightning', false, true),
  ('iPad6,12', 'ipad', 'iPad (5th generation)', 'lightning', false, true),
  ('iPad7,1', 'ipad', 'iPad Pro (12.9-inch, 2nd generation)', 'lightning', false, true),
  ('iPad7,2', 'ipad', 'iPad Pro (12.9-inch, 2nd generation)', 'lightning', false, true),
  ('iPad7,3', 'ipad', 'iPad Pro (10.5-inch)', 'lightning', false, true),
  ('iPad7,4', 'ipad', 'iPad Pro (10.5-inch)', 'lightning', false, true),
  ('iPad7,5', 'ipad', 'iPad (6th generation)', 'lightning', false, true),
  ('iPad7,6', 'ipad', 'iPad (6th generation)', 'lightning', false, true),
  ('iPad7,11', 'ipad', 'iPad (7th generation)', 'lightning', false, true),
  ('iPad7,12', 'ipad', 'iPad (7th generation)', 'lightning', false, true),
  ('iPad11,1', 'ipad', 'iPad mini (5th generation)', 'lightning', false, true),
  ('iPad11,2', 'ipad', 'iPad mini (5th generation)', 'lightning', false, true),
  ('iPad11,3', 'ipad', 'iPad Air (3rd generation)', 'lightning', false, true),
  ('iPad11,4', 'ipad', 'iPad Air (3rd generation)', 'lightning', false, true),
  ('iPad11,6', 'ipad', 'iPad (8th generation)', 'lightning', false, true),
  ('iPad11,7', 'ipad', 'iPad (8th generation)', 'lightning', false, true),
  ('iPad12,1', 'ipad', 'iPad (9th generation)', 'lightning', false, true),
  ('iPad12,2', 'ipad', 'iPad (9th generation)', 'lightning', false, true),

  ('iPad8,1', 'ipad', 'iPad Pro (11-inch)', 'usb_c', false, true),
  ('iPad8,2', 'ipad', 'iPad Pro (11-inch)', 'usb_c', false, true),
  ('iPad8,3', 'ipad', 'iPad Pro (11-inch)', 'usb_c', false, true),
  ('iPad8,4', 'ipad', 'iPad Pro (11-inch)', 'usb_c', false, true),
  ('iPad8,5', 'ipad', 'iPad Pro (12.9-inch, 3rd generation)', 'usb_c', false, true),
  ('iPad8,6', 'ipad', 'iPad Pro (12.9-inch, 3rd generation)', 'usb_c', false, true),
  ('iPad8,7', 'ipad', 'iPad Pro (12.9-inch, 3rd generation)', 'usb_c', false, true),
  ('iPad8,8', 'ipad', 'iPad Pro (12.9-inch, 3rd generation)', 'usb_c', false, true),
  ('iPad8,9', 'ipad', 'iPad Pro (11-inch, 2nd generation)', 'usb_c', false, true),
  ('iPad8,10', 'ipad', 'iPad Pro (11-inch, 2nd generation)', 'usb_c', false, true),
  ('iPad8,11', 'ipad', 'iPad Pro (12.9-inch, 4th generation)', 'usb_c', false, true),
  ('iPad8,12', 'ipad', 'iPad Pro (12.9-inch, 4th generation)', 'usb_c', false, true),
  ('iPad13,1', 'ipad', 'iPad Air (4th generation)', 'usb_c', false, true),
  ('iPad13,2', 'ipad', 'iPad Air (4th generation)', 'usb_c', false, true),
  ('iPad13,4', 'ipad', 'iPad Pro (11-inch, 3rd generation)', 'usb_c', false, true),
  ('iPad13,5', 'ipad', 'iPad Pro (11-inch, 3rd generation)', 'usb_c', false, true),
  ('iPad13,6', 'ipad', 'iPad Pro (11-inch, 3rd generation)', 'usb_c', false, true),
  ('iPad13,7', 'ipad', 'iPad Pro (11-inch, 3rd generation)', 'usb_c', false, true),
  ('iPad13,8', 'ipad', 'iPad Pro (12.9-inch, 5th generation)', 'usb_c', false, true),
  ('iPad13,9', 'ipad', 'iPad Pro (12.9-inch, 5th generation)', 'usb_c', false, true),
  ('iPad13,10', 'ipad', 'iPad Pro (12.9-inch, 5th generation)', 'usb_c', false, true),
  ('iPad13,11', 'ipad', 'iPad Pro (12.9-inch, 5th generation)', 'usb_c', false, true),
  ('iPad13,16', 'ipad', 'iPad Air (5th generation)', 'usb_c', false, true),
  ('iPad13,17', 'ipad', 'iPad Air (5th generation)', 'usb_c', false, true),
  ('iPad13,18', 'ipad', 'iPad (10th generation)', 'usb_c', false, true),
  ('iPad13,19', 'ipad', 'iPad (10th generation)', 'usb_c', false, true),
  ('iPad14,1', 'ipad', 'iPad mini (6th generation)', 'usb_c', false, true),
  ('iPad14,2', 'ipad', 'iPad mini (6th generation)', 'usb_c', false, true),
  ('iPad14,3', 'ipad', 'iPad Pro (11-inch, 4th generation)', 'usb_c', false, true),
  ('iPad14,4', 'ipad', 'iPad Pro (11-inch, 4th generation)', 'usb_c', false, true),
  ('iPad14,5', 'ipad', 'iPad Pro (12.9-inch, 6th generation)', 'usb_c', false, true),
  ('iPad14,6', 'ipad', 'iPad Pro (12.9-inch, 6th generation)', 'usb_c', false, true),
  ('iPad14,8', 'ipad', 'iPad Air 11-inch (M2)', 'usb_c', false, true),
  ('iPad14,9', 'ipad', 'iPad Air 11-inch (M2)', 'usb_c', false, true),
  ('iPad14,10', 'ipad', 'iPad Air 13-inch (M2)', 'usb_c', false, true),
  ('iPad14,11', 'ipad', 'iPad Air 13-inch (M2)', 'usb_c', false, true),
  ('iPad16,1', 'ipad', 'iPad mini (A17 Pro)', 'usb_c', false, true),
  ('iPad16,2', 'ipad', 'iPad mini (A17 Pro)', 'usb_c', false, true),
  ('iPad16,3', 'ipad', 'iPad Pro 11-inch (M4)', 'usb_c', false, true),
  ('iPad16,4', 'ipad', 'iPad Pro 11-inch (M4)', 'usb_c', false, true),
  ('iPad16,5', 'ipad', 'iPad Pro 13-inch (M4)', 'usb_c', false, true),
  ('iPad16,6', 'ipad', 'iPad Pro 13-inch (M4)', 'usb_c', false, true)
ON CONFLICT (model_identifier) DO UPDATE
SET
  device_family = EXCLUDED.device_family,
  marketing_name = EXCLUDED.marketing_name,
  connector_type = EXCLUDED.connector_type,
  is_default = EXCLUDED.is_default,
  is_active = EXCLUDED.is_active,
  updated_at = now();
