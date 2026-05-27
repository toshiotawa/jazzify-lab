-- レッスン課題（サバイバル Random / 風船ラッシュ Random）向けカスタムヴォイシング
BEGIN;

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS survival_random_chords jsonb DEFAULT NULL;

COMMENT ON COLUMN public.lesson_songs.survival_random_chords IS
  'Random モード課題用カスタムコード池。各要素: { name, voicing(MIDI[]), voicing_names?, voicing_staves?(1=ト音/2=ヘ音), key_fifths? }。指定時は出題プールをこの一覧に置き換える。';

COMMIT;
