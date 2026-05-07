-- Add chord-voicing battle mode support to ear training stages.

ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS mode text NOT NULL DEFAULT 'phrase';

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_mode_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_mode_check
  CHECK (mode IN ('phrase', 'chord_voicing'));

ALTER TABLE public.ear_training_phrase_chords
  ADD COLUMN IF NOT EXISTS voicing text[] NULL,
  ADD COLUMN IF NOT EXISTS voicing_staves smallint[] NULL;

ALTER TABLE public.ear_training_phrase_chords
  DROP CONSTRAINT IF EXISTS ear_training_phrase_chords_voicing_staves_match;

ALTER TABLE public.ear_training_phrase_chords
  ADD CONSTRAINT ear_training_phrase_chords_voicing_staves_match
  CHECK (
    (voicing IS NULL AND voicing_staves IS NULL)
    OR (
      voicing IS NOT NULL
      AND voicing_staves IS NOT NULL
      AND COALESCE(array_length(voicing, 1), 0) = COALESCE(array_length(voicing_staves, 1), 0)
    )
  );

COMMENT ON COLUMN public.ear_training_stages.mode IS 'バトルモード: phrase (単音耳コピ) / chord_voicing (コード演奏バトル)';
COMMENT ON COLUMN public.ear_training_phrase_chords.voicing IS 'コード演奏バトル用の音名配列。例: {"D4","F#4","A4","C5"}';
COMMENT ON COLUMN public.ear_training_phrase_chords.voicing_staves IS 'voicing と同じ並び順で 1=ト音譜表 / 2=ヘ音譜表 を保持する譜表番号配列。MusicXML <staff> 由来。';
