-- ear_training_stages.is_swing: MusicXML イーブン記譜をスイング（2:1）タイミングでノーツ/ハンマー生成
BEGIN;

ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS is_swing boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_stages.is_swing IS
  'chord_osmd/chord_precision: MusicXML イーブン記譜をスイング（2:1）タイミングでノーツ/ハンマー生成';

-- メインクエスト OSMD ステージ（ear_training_stages 直接行）
UPDATE public.ear_training_stages
SET is_swing = true, updated_at = now()
WHERE id = '70401e1a-458d-51a5-b676-dbbc47b538e1';

-- メインクエスト OSMD チュートリアル台本（content.stage.is_swing）
UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(script, '{content,mq-b1-q1-osmd,stage,is_swing}', 'true'::jsonb, true),
  updated_at = now()
WHERE id = 'mq-b1-q1-osmd-v1';

UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(script, '{content,mq-b1-q3-osmd,stage,is_swing}', 'true'::jsonb, true),
  updated_at = now()
WHERE id = 'mq-b1-q3-osmd-v1';

UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(script, '{content,mq-b2-q1-osmd,stage,is_swing}', 'true'::jsonb, true),
  updated_at = now()
WHERE id = 'mq-b2-q1-osmd-v1';

UPDATE public.ear_training_tutorial_scripts
SET
  script = jsonb_set(script, '{content,mq-b2-q2-osmd,stage,is_swing}', 'true'::jsonb, true),
  updated_at = now()
WHERE id = 'mq-b2-q2-osmd-v1';

COMMIT;
