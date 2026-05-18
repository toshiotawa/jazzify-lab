-- Survival Phrases mode: map category, phrase tables, initial seed
BEGIN;

-- Extend map_category CHECK on survival_stage_blocks
ALTER TABLE public.survival_stage_blocks
  DROP CONSTRAINT IF EXISTS survival_stage_blocks_map_category_check;

ALTER TABLE public.survival_stage_blocks
  ADD CONSTRAINT survival_stage_blocks_map_category_check
  CHECK (map_category IN ('basic', 'songs', 'phrases'));

-- Extend survival_bgm_settings stage_type CHECK
ALTER TABLE public.survival_bgm_settings
  DROP CONSTRAINT IF EXISTS survival_bgm_settings_stage_type_check;

ALTER TABLE public.survival_bgm_settings
  ADD CONSTRAINT survival_bgm_settings_stage_type_check
  CHECK (stage_type IN ('random', 'progression', 'phrases'));

-- Extend survival_stages map_category CHECK
ALTER TABLE public.survival_stages
  DROP CONSTRAINT IF EXISTS survival_stages_map_category_check;

ALTER TABLE public.survival_stages
  ADD CONSTRAINT survival_stages_map_category_check
  CHECK (map_category IN ('basic', 'songs', 'phrases'));

-- Phrase content tables (additive; old clients ignore)
CREATE TABLE IF NOT EXISTS public.survival_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  map_category text NOT NULL CHECK (map_category IN ('basic', 'songs', 'phrases')),
  stage_number integer NOT NULL CHECK (stage_number > 0),
  title text NOT NULL,
  bgm_url text,
  key_fifths smallint NOT NULL DEFAULT 0 CHECK (key_fifths >= -7 AND key_fifths <= 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (map_category, stage_number)
);

COMMENT ON TABLE public.survival_phrases IS 'Survival Phrases mode: one phrase per stage.';

CREATE TABLE IF NOT EXISTS public.survival_phrase_chords (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_id uuid NOT NULL REFERENCES public.survival_phrases(id) ON DELETE CASCADE,
  order_index smallint NOT NULL CHECK (order_index >= 0),
  chord_name text NOT NULL,
  measure_number smallint NOT NULL CHECK (measure_number > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (phrase_id, order_index)
);

COMMENT ON TABLE public.survival_phrase_chords IS 'One chord = one measure in Phrases mode.';

CREATE TABLE IF NOT EXISTS public.survival_phrase_chord_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chord_id uuid NOT NULL REFERENCES public.survival_phrase_chords(id) ON DELETE CASCADE,
  order_index smallint NOT NULL CHECK (order_index >= 0),
  pitch_midi smallint NOT NULL CHECK (pitch_midi >= 0 AND pitch_midi <= 127),
  pitch_class smallint NOT NULL CHECK (pitch_class >= 0 AND pitch_class <= 11),
  note_name text NOT NULL,
  staff smallint NOT NULL DEFAULT 1 CHECK (staff IN (1, 2)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (chord_id, order_index)
);

COMMENT ON TABLE public.survival_phrase_chord_notes IS 'Sequential notes within a chord measure (whole notes, left-to-right).';

CREATE OR REPLACE FUNCTION public.set_survival_phrases_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_survival_phrases_updated_at ON public.survival_phrases;
CREATE TRIGGER trg_survival_phrases_updated_at
  BEFORE UPDATE ON public.survival_phrases
  FOR EACH ROW
  EXECUTE FUNCTION public.set_survival_phrases_updated_at();

ALTER TABLE public.survival_phrases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survival_phrase_chords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survival_phrase_chord_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY survival_phrases_select_all ON public.survival_phrases
  FOR SELECT USING (true);

CREATE POLICY survival_phrases_insert_admin ON public.survival_phrases
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY survival_phrases_update_admin ON public.survival_phrases
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY survival_phrases_delete_admin ON public.survival_phrases
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY survival_phrase_chords_select_all ON public.survival_phrase_chords
  FOR SELECT USING (true);

CREATE POLICY survival_phrase_chords_insert_admin ON public.survival_phrase_chords
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY survival_phrase_chords_update_admin ON public.survival_phrase_chords
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY survival_phrase_chords_delete_admin ON public.survival_phrase_chords
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY survival_phrase_chord_notes_select_all ON public.survival_phrase_chord_notes
  FOR SELECT USING (true);

CREATE POLICY survival_phrase_chord_notes_insert_admin ON public.survival_phrase_chord_notes
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY survival_phrase_chord_notes_update_admin ON public.survival_phrase_chord_notes
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

CREATE POLICY survival_phrase_chord_notes_delete_admin ON public.survival_phrase_chord_notes
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE)
  );

GRANT SELECT ON public.survival_phrases TO anon, authenticated;
GRANT SELECT ON public.survival_phrase_chords TO anon, authenticated;
GRANT SELECT ON public.survival_phrase_chord_notes TO anon, authenticated;

-- BGM for phrases mode (DrumLoop CDN)
INSERT INTO public.survival_bgm_settings (stage_type, bgm_url)
VALUES (
  'phrases',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3'
)
ON CONFLICT (stage_type) DO UPDATE
SET bgm_url = EXCLUDED.bgm_url, updated_at = now();

-- Map block
INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES ('phrases', 'phrases_basic_1', 'Phrases I', 'Phrases I', 0)
ON CONFLICT (map_category, block_key) DO NOTHING;

-- Stage row
INSERT INTO public.survival_stages (
  map_category, stage_number, stage_type, name, name_en, difficulty,
  chord_suffix, chord_display_name, chord_display_name_en,
  root_pattern, root_pattern_name, root_pattern_name_en,
  block_key, is_mixed_stage, mixed_group_key, chord_progression
) VALUES (
  'phrases',
  1,
  'progression',
  'フレーズ I',
  'Phrases I',
  'easy',
  '',
  'Dm7→G7→CM7',
  'Dm7→G7→CM7',
  NULL,
  NULL,
  NULL,
  'phrases_basic_1',
  false,
  NULL,
  NULL
)
ON CONFLICT (map_category, stage_number) DO UPDATE
SET
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  block_key = EXCLUDED.block_key,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en;

-- Phrase + chords + notes (idempotent via delete+insert for stage 1)
DELETE FROM public.survival_phrase_chord_notes
WHERE chord_id IN (
  SELECT c.id FROM public.survival_phrase_chords c
  JOIN public.survival_phrases p ON p.id = c.phrase_id
  WHERE p.map_category = 'phrases' AND p.stage_number = 1
);

DELETE FROM public.survival_phrase_chords
WHERE phrase_id IN (
  SELECT id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number = 1
);

DELETE FROM public.survival_phrases
WHERE map_category = 'phrases' AND stage_number = 1;

INSERT INTO public.survival_phrases (map_category, stage_number, title, bgm_url, key_fifths)
VALUES (
  'phrases',
  1,
  'Phrases I',
  'https://jazzify-cdn.com/fantasy-bgm/ear-training-self-paced-drum-loop.mp3',
  0
);

DO $$
DECLARE
  v_phrase_id uuid;
  v_dm7_id uuid;
  v_g7_id uuid;
  v_cm7_id uuid;
BEGIN
  SELECT id INTO v_phrase_id FROM public.survival_phrases
  WHERE map_category = 'phrases' AND stage_number = 1;

  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_id, 0, 'Dm7', 1)
  RETURNING id INTO v_dm7_id;

  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_id, 1, 'G7', 2)
  RETURNING id INTO v_g7_id;

  INSERT INTO public.survival_phrase_chords (phrase_id, order_index, chord_name, measure_number)
  VALUES (v_phrase_id, 2, 'CM7', 3)
  RETURNING id INTO v_cm7_id;

  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_dm7_id, 0, 62, 2, 'D4', 1),
    (v_dm7_id, 1, 64, 4, 'E4', 1),
    (v_dm7_id, 2, 65, 5, 'F4', 1),
    (v_dm7_id, 3, 67, 7, 'G4', 1);

  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_g7_id, 0, 64, 4, 'E4', 1),
    (v_g7_id, 1, 62, 2, 'D4', 1);

  INSERT INTO public.survival_phrase_chord_notes (chord_id, order_index, pitch_midi, pitch_class, note_name, staff) VALUES
    (v_cm7_id, 0, 67, 7, 'G4', 1);
END $$;

COMMIT;
