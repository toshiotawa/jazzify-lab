-- Defense: chord voicing play style (all-key transposition, order/random keys)
BEGIN;

ALTER TABLE public.defense_stages
  ADD COLUMN IF NOT EXISTS play_style text NOT NULL DEFAULT 'phrase'
    CHECK (play_style IN ('phrase', 'chord_voicing')),
  ADD COLUMN IF NOT EXISTS voicing_key_mode text
    CHECK (voicing_key_mode IS NULL OR voicing_key_mode IN ('order', 'random')),
  ADD COLUMN IF NOT EXISTS voicing_lowest_key text
    CHECK (
      voicing_lowest_key IS NULL
      OR voicing_lowest_key IN ('C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G')
    ),
  ADD COLUMN IF NOT EXISTS voicing_start_key text
    CHECK (
      voicing_start_key IS NULL
      OR voicing_start_key IN ('C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G')
    ),
  ADD COLUMN IF NOT EXISTS voicing_min_lowest_note text,
  ADD COLUMN IF NOT EXISTS play_root_on_chord_change boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.defense_stages.play_style IS 'phrase=従来 / chord_voicing=全キー移調ヴォイシング';
COMMENT ON COLUMN public.defense_stages.voicing_key_mode IS 'chord_voicing: order or random key cycle';
COMMENT ON COLUMN public.defense_stages.voicing_lowest_key IS 'chord_voicing: template reference key (12 major keys)';
COMMENT ON COLUMN public.defense_stages.voicing_start_key IS 'chord_voicing: order mode start key';
COMMENT ON COLUMN public.defense_stages.voicing_min_lowest_note IS 'chord_voicing: min lowest note e.g. F3';
COMMENT ON COLUMN public.defense_stages.play_root_on_chord_change IS 'chord_voicing: play root when labeled voicing completes';

ALTER TABLE public.defense_stages DROP CONSTRAINT IF EXISTS defense_stages_chord_voicing_config_check;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_chord_voicing_config_check CHECK (
    play_style = 'phrase'
    OR (
      voicing_key_mode IS NOT NULL
      AND voicing_lowest_key IS NOT NULL
      AND voicing_start_key IS NOT NULL
      AND voicing_min_lowest_note IS NOT NULL
      AND length(trim(voicing_min_lowest_note)) > 0
    )
  );

COMMIT;
