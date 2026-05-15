-- OSMD リズム判定バトル（chord_osmd）モードを ear_training_stages.mode に追加。

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_mode_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_mode_check
  CHECK (mode IN ('phrase', 'chord_voicing', 'chord_quiz', 'chord_osmd'));

COMMENT ON COLUMN public.ear_training_stages.mode IS
  'バトル種別: phrase / chord_voicing / chord_quiz / chord_osmd';
