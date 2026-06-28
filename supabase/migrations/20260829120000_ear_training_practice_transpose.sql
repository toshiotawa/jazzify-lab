-- OSMD 練習移調: 課題ごとに ±6 半音移調 UI を有効化
ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS practice_transpose boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_stages.practice_transpose IS
  'chord_osmd: 練習モードで±6半音移調UIを有効化';

-- Bluesy Licks 全ステージを true
UPDATE public.ear_training_stages
SET practice_transpose = true
WHERE slug LIKE 'bl-stage-%';
