ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS hammer_lead_measures smallint NOT NULL DEFAULT 1;

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_hammer_lead_measures_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_hammer_lead_measures_check
  CHECK (hammer_lead_measures >= 1);

COMMENT ON COLUMN public.ear_training_stages.hammer_lead_measures IS
  'OSMDバトル: ハンマー投擲を何小節前から開始するか（1=拍子数分の拍前、例: 4/4で4拍前）';
