-- Survival composite phrase boss stage: refs multiple phrase stages, boss-only gameplay
BEGIN;

CREATE TABLE IF NOT EXISTS public.survival_composite_phrase_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_category text NOT NULL CHECK (map_category IN ('basic', 'songs', 'phrases', 'lesson')),
  stage_number integer NOT NULL CHECK (stage_number > 0),
  boss_type text NOT NULL DEFAULT 'B' CHECK (boss_type IN ('A', 'B', 'C')),
  key_fifths smallint NOT NULL DEFAULT 0 CHECK (key_fifths >= -7 AND key_fifths <= 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_category, stage_number)
);

COMMENT ON TABLE public.survival_composite_phrase_stages IS 'Survival multi-phrase composite boss stages; maps (map_category, stage_number) to source phrase stages.';

CREATE TABLE IF NOT EXISTS public.survival_composite_phrase_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  composite_id uuid NOT NULL REFERENCES public.survival_composite_phrase_stages(id) ON DELETE CASCADE,
  source_stage_number integer NOT NULL CHECK (source_stage_number > 0),
  sort_order smallint NOT NULL CHECK (sort_order >= 0),
  UNIQUE (composite_id, source_stage_number)
);

COMMENT ON TABLE public.survival_composite_phrase_sources IS 'Ordered source survival_phrases rows (same map_category as composite stage) referenced by composite stage.';

CREATE OR REPLACE FUNCTION public.set_survival_composite_phrase_stages_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_survival_composite_phrase_stages_updated_at ON public.survival_composite_phrase_stages;
CREATE TRIGGER trg_survival_composite_phrase_stages_updated_at
  BEFORE UPDATE ON public.survival_composite_phrase_stages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_survival_composite_phrase_stages_updated_at();

ALTER TABLE public.survival_composite_phrase_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survival_composite_phrase_sources ENABLE ROW LEVEL SECURITY;

CREATE POLICY survival_composite_phrase_stages_select_all ON public.survival_composite_phrase_stages
  FOR SELECT USING (true);
CREATE POLICY survival_composite_phrase_sources_select_all ON public.survival_composite_phrase_sources
  FOR SELECT USING (true);

CREATE POLICY survival_composite_phrase_stages_insert_admin ON public.survival_composite_phrase_stages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );
CREATE POLICY survival_composite_phrase_stages_update_admin ON public.survival_composite_phrase_stages
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );
CREATE POLICY survival_composite_phrase_stages_delete_admin ON public.survival_composite_phrase_stages
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY survival_composite_phrase_sources_insert_admin ON public.survival_composite_phrase_sources
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );
CREATE POLICY survival_composite_phrase_sources_update_admin ON public.survival_composite_phrase_sources
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );
CREATE POLICY survival_composite_phrase_sources_delete_admin ON public.survival_composite_phrase_sources
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

GRANT SELECT ON public.survival_composite_phrase_stages TO anon, authenticated;
GRANT SELECT ON public.survival_composite_phrase_sources TO anon, authenticated;

-- Descent map block after phrases_basic_1
INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_composite_1', '複合フレーズ', 'Composite phrases', 1)
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Stage 6: composite phrases boss block
INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  6,
  'progression',
  '複合フレーズ I',
  'Composite phrases I',
  'easy',
  '',
  'フレーズ1–5',
  'Phrases 1–5',
  NULL,
  NULL,
  NULL,
  'phrases_composite_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE
SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

INSERT INTO public.survival_composite_phrase_stages (map_category, stage_number, boss_type, key_fifths)
VALUES ('phrases', 6, 'B', 0)
ON CONFLICT (map_category, stage_number)
DO UPDATE SET boss_type = EXCLUDED.boss_type, key_fifths = EXCLUDED.key_fifths, updated_at = now();

DO $$
DECLARE
  v_comp_id uuid;
BEGIN
  SELECT id INTO v_comp_id FROM public.survival_composite_phrase_stages
   WHERE map_category = 'phrases' AND stage_number = 6;
  DELETE FROM public.survival_composite_phrase_sources WHERE composite_id = v_comp_id;

  INSERT INTO public.survival_composite_phrase_sources (composite_id, source_stage_number, sort_order) VALUES
    (v_comp_id, 1, 0),
    (v_comp_id, 2, 1),
    (v_comp_id, 3, 2),
    (v_comp_id, 4, 3),
    (v_comp_id, 5, 4);
END $$;

COMMIT;
