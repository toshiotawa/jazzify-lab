-- adlib_call_response: OSMD フォークのアドリブ コール&レスポンス（譜面非表示・オクターブ等価・1音正解）

BEGIN;

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_mode_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_mode_check
  CHECK (mode IN (
    'phrase',
    'chord_voicing',
    'chord_quiz',
    'chord_osmd',
    'chord_precision',
    'adlib',
    'phrase_pair_adlib',
    'adlib_call_response'
  ));

COMMENT ON COLUMN public.ear_training_stages.mode IS
  'バトル種別: phrase / chord_voicing / chord_quiz / chord_osmd / chord_precision / adlib / phrase_pair_adlib / adlib_call_response';

COMMIT;
