-- Add staff voicing data to phrase-pair adlib patterns for ChordVoicingStaff display.

ALTER TABLE public.ear_training_adlib_patterns
  ADD COLUMN IF NOT EXISTS voicing text[],
  ADD COLUMN IF NOT EXISTS voicing_staves smallint[];

ALTER TABLE public.ear_training_adlib_patterns
  DROP CONSTRAINT IF EXISTS ear_training_adlib_patterns_voicing_length_check;

ALTER TABLE public.ear_training_adlib_patterns
  ADD CONSTRAINT ear_training_adlib_patterns_voicing_length_check
  CHECK (
    voicing IS NULL
    OR (
      array_length(voicing, 1) >= 1
      AND array_length(voicing, 1) = array_length(pcs, 1)
    )
  );

ALTER TABLE public.ear_training_adlib_patterns
  DROP CONSTRAINT IF EXISTS ear_training_adlib_patterns_voicing_staves_length_check;

ALTER TABLE public.ear_training_adlib_patterns
  ADD CONSTRAINT ear_training_adlib_patterns_voicing_staves_length_check
  CHECK (
    voicing_staves IS NULL
    OR (
      array_length(voicing_staves, 1) >= 1
      AND array_length(voicing_staves, 1) = array_length(pcs, 1)
    )
  );

ALTER TABLE public.ear_training_adlib_patterns
  DROP CONSTRAINT IF EXISTS ear_training_adlib_patterns_voicing_staves_values_check;

ALTER TABLE public.ear_training_adlib_patterns
  ADD CONSTRAINT ear_training_adlib_patterns_voicing_staves_values_check
  CHECK (
    voicing_staves IS NULL
    OR voicing_staves <@ ARRAY[1::smallint, 2::smallint]
  );

COMMENT ON COLUMN public.ear_training_adlib_patterns.voicing IS
  'Octave note names for staff display (same order/length as pcs). Example: {C4,D4}.';

COMMENT ON COLUMN public.ear_training_adlib_patterns.voicing_staves IS
  'Staff per note: 1=treble, 2=bass (same order/length as pcs).';

-- Backfill demo CM7 pattern group (dev-phrase-pair-cm7-group).
DO $$
DECLARE
  v_group uuid := uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'dev-phrase-pair-cm7-group'
  );
BEGIN
  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['C4', 'D4']::text[],
    voicing_staves = ARRAY[1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-A' AND pcs = ARRAY[0, 2]::smallint[];

  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['D4', 'C4']::text[],
    voicing_staves = ARRAY[1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-A' AND pcs = ARRAY[2, 0]::smallint[];

  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['E4', 'G4']::text[],
    voicing_staves = ARRAY[1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-B' AND pcs = ARRAY[4, 7]::smallint[];

  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['G4', 'E4']::text[],
    voicing_staves = ARRAY[1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-B' AND pcs = ARRAY[7, 4]::smallint[];

  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['A4', 'B4']::text[],
    voicing_staves = ARRAY[1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-C' AND pcs = ARRAY[9, 11]::smallint[];

  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['B4', 'A4']::text[],
    voicing_staves = ARRAY[1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-C' AND pcs = ARRAY[11, 9]::smallint[];

  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['B4', 'C4']::text[],
    voicing_staves = ARRAY[1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-D' AND pcs = ARRAY[11, 0]::smallint[];

  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['D4', 'B4', 'C4']::text[],
    voicing_staves = ARRAY[1, 1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-Ap' AND pcs = ARRAY[2, 11, 0]::smallint[];

  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['B4', 'D4', 'C4']::text[],
    voicing_staves = ARRAY[1, 1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-Ap' AND pcs = ARRAY[11, 2, 0]::smallint[];

  UPDATE public.ear_training_adlib_patterns SET
    voicing = ARRAY['B4', 'D4', 'Db4', 'B4', 'C4']::text[],
    voicing_staves = ARRAY[1, 1, 1, 1, 1]::smallint[]
  WHERE group_id = v_group AND family_id = 'CM7-App' AND pcs = ARRAY[11, 2, 1, 11, 0]::smallint[];
END $$;
