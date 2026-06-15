-- OSMD: MusicXML 譜面から判定ターゲットを生成するフラグ
ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS osmd_targets_from_score boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_stages.osmd_targets_from_score IS
  'true のとき OSMD バトルで phrase.chords ではなく MusicXML の音符アタックから判定ターゲットを生成する';

-- MQ B1 Q1 OSMD チュートリアル: 譜面ベース判定を有効化
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(
    script,
    '{content,mq-b1-q1-osmd,stage,osmd_targets_from_score}',
    'true'::jsonb,
    true
  ),
  updated_at = now()
WHERE id = 'mq-b1-q1-osmd-v1';
