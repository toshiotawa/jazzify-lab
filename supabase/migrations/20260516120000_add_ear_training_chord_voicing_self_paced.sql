-- Voicing バトル: 時間で進行せず正解で次コードへ進むオプション

ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS chord_voicing_self_paced boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_stages.chord_voicing_self_paced IS
  'chord_voicing モードでコード進行を時間で進めず、正解時のみ次のコードに進める（カウントイン省略・フレーズ音源無音再生）';
