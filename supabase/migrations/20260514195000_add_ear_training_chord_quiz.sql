-- コードクイズ（chord_quiz）モード: タイムアタック・出題プール・ステージ設定。

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_mode_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_mode_check
  CHECK (mode IN ('phrase', 'chord_voicing', 'chord_quiz'));

ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS quiz_duration_seconds smallint NOT NULL DEFAULT 90,
  ADD COLUMN IF NOT EXISTS quiz_question_order text NOT NULL DEFAULT 'random',
  ADD COLUMN IF NOT EXISTS quiz_show_notation_in_battle boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS quiz_required_correct_count smallint NOT NULL DEFAULT 80;

COMMENT ON COLUMN public.ear_training_stages.mode IS
  'バトル種別: phrase / chord_voicing / chord_quiz';

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_quiz_duration_seconds_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_quiz_duration_seconds_check
  CHECK (
    quiz_duration_seconds BETWEEN 10 AND 600
  );

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_quiz_question_order_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_quiz_question_order_check
  CHECK (
    quiz_question_order IN ('random', 'sequential')
  );

ALTER TABLE public.ear_training_stages
  DROP CONSTRAINT IF EXISTS ear_training_stages_quiz_required_correct_check;

ALTER TABLE public.ear_training_stages
  ADD CONSTRAINT ear_training_stages_quiz_required_correct_check
  CHECK (
    quiz_required_correct_count > 0
  );

COMMENT ON COLUMN public.ear_training_stages.quiz_duration_seconds IS
  'chord_quiz: 解答可能時間（秒）';
COMMENT ON COLUMN public.ear_training_stages.quiz_question_order IS
  'chord_quiz: random=ランダム（同一問題の連続出題禁止） / sequential=order_index 順';
COMMENT ON COLUMN public.ear_training_stages.quiz_show_notation_in_battle IS
  'chord_quiz: バトル本番での五線音符表示（練習モードでは常に表示）';
COMMENT ON COLUMN public.ear_training_stages.quiz_required_correct_count IS
  'chord_quiz: タイム終了までに必要な最低正答数';

CREATE TABLE IF NOT EXISTS public.ear_training_chord_quiz_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id uuid NOT NULL REFERENCES public.ear_training_stages(id) ON DELETE CASCADE,
  order_index smallint NOT NULL CHECK (order_index >= 0),
  chord_name text NOT NULL,
  voicing text[] NOT NULL,
  voicing_staves smallint[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (stage_id, order_index),
  CONSTRAINT ear_training_chord_quiz_items_voicing_staves_match CHECK (
    COALESCE(array_length(voicing, 1), 0) = COALESCE(array_length(voicing_staves, 1), 0)
      AND COALESCE(array_length(voicing, 1), 0) > 0
  )
);

CREATE INDEX IF NOT EXISTS idx_ear_training_chord_quiz_items_stage_id
  ON public.ear_training_chord_quiz_items(stage_id);

DROP TRIGGER IF EXISTS ear_training_chord_quiz_items_updated_at_trigger ON public.ear_training_chord_quiz_items;
CREATE TRIGGER ear_training_chord_quiz_items_updated_at_trigger
  BEFORE UPDATE ON public.ear_training_chord_quiz_items
  FOR EACH ROW
  EXECUTE FUNCTION public.ear_training_touch_updated_at();

ALTER TABLE public.ear_training_chord_quiz_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ear training chord quiz items are readable"
  ON public.ear_training_chord_quiz_items;
CREATE POLICY "Ear training chord quiz items are readable"
ON public.ear_training_chord_quiz_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ear_training_stages s
    WHERE s.id = stage_id
      AND (
        s.is_active = true
        OR EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true
        )
      )
  )
);

DROP POLICY IF EXISTS "Admins can manage ear training chord quiz items"
  ON public.ear_training_chord_quiz_items;
CREATE POLICY "Admins can manage ear training chord quiz items"
ON public.ear_training_chord_quiz_items
FOR ALL
USING (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
);

GRANT SELECT ON public.ear_training_chord_quiz_items TO authenticated;

COMMENT ON TABLE public.ear_training_chord_quiz_items IS
  'chord_quiz モードの出題プール（ステージ直下、1アイテム=1コード）';
COMMENT ON COLUMN public.ear_training_chord_quiz_items.voicing IS
  'コード構成音の音名配列。例: {D4,F4,A4,C5}';
COMMENT ON COLUMN public.ear_training_chord_quiz_items.voicing_staves IS
  'voicing と同じ並び順で 1=ト音 / 2=ヘ音 を保持';
