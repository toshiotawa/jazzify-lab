-- chord_quiz: allow multiple voicings to belong to the same measure/question.

ALTER TABLE public.ear_training_chord_quiz_items
  ADD COLUMN IF NOT EXISTS measure_number integer,
  ADD COLUMN IF NOT EXISTS beat_offset numeric,
  ADD COLUMN IF NOT EXISTS duration_beats numeric;

ALTER TABLE public.ear_training_chord_quiz_items
  DROP CONSTRAINT IF EXISTS ear_training_chord_quiz_items_measure_number_check;

ALTER TABLE public.ear_training_chord_quiz_items
  ADD CONSTRAINT ear_training_chord_quiz_items_measure_number_check
  CHECK (measure_number IS NULL OR measure_number >= 1);

ALTER TABLE public.ear_training_chord_quiz_items
  DROP CONSTRAINT IF EXISTS ear_training_chord_quiz_items_beat_offset_check;

ALTER TABLE public.ear_training_chord_quiz_items
  ADD CONSTRAINT ear_training_chord_quiz_items_beat_offset_check
  CHECK (beat_offset IS NULL OR beat_offset >= 0);

ALTER TABLE public.ear_training_chord_quiz_items
  DROP CONSTRAINT IF EXISTS ear_training_chord_quiz_items_duration_beats_check;

ALTER TABLE public.ear_training_chord_quiz_items
  ADD CONSTRAINT ear_training_chord_quiz_items_duration_beats_check
  CHECK (duration_beats IS NULL OR duration_beats > 0);

CREATE INDEX IF NOT EXISTS idx_ear_training_chord_quiz_items_stage_measure
  ON public.ear_training_chord_quiz_items(stage_id, measure_number);

COMMENT ON TABLE public.ear_training_chord_quiz_items IS
  'chord_quiz モードの出題プール。measure_number が同じ行は1小節内の複数ヴォイシングとして1問にまとまる';
COMMENT ON COLUMN public.ear_training_chord_quiz_items.measure_number IS
  'chord_quiz: 1始まりの小節番号。NULL の場合は従来通り1行=1問';
COMMENT ON COLUMN public.ear_training_chord_quiz_items.beat_offset IS
  'chord_quiz: 小節内の拍位置。複数ヴォイシングの表示・判定順に使う';
COMMENT ON COLUMN public.ear_training_chord_quiz_items.duration_beats IS
  'chord_quiz: ヴォイシング区間の拍数（任意）';
