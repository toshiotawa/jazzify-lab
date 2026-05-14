-- コード演奏バトル: ヴォイシング行ごとの主人公セリフ（吹き出し表示）

CREATE TABLE IF NOT EXISTS public.ear_training_phrase_chord_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase_chord_id uuid NOT NULL UNIQUE REFERENCES public.ear_training_phrase_chords(id) ON DELETE CASCADE,
  text text NOT NULL CHECK (char_length(text) BETWEEN 1 AND 80),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.ear_training_phrase_chord_quotes IS 'コード演奏バトルでヴォイシング行に紐づく主人公セリフ（吹き出し表示）';
COMMENT ON COLUMN public.ear_training_phrase_chord_quotes.phrase_chord_id IS 'ear_training_phrase_chords の行（1コード = 1ヴォイシング判定単位）';
COMMENT ON COLUMN public.ear_training_phrase_chord_quotes.text IS '吹き出しに表示するテキスト';

ALTER TABLE public.ear_training_phrase_chord_quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Ear training phrase chord quotes are readable" ON public.ear_training_phrase_chord_quotes;
CREATE POLICY "Ear training phrase chord quotes are readable"
ON public.ear_training_phrase_chord_quotes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.ear_training_phrase_chords ch
    JOIN public.ear_training_phrases ph ON ph.id = ch.phrase_id
    JOIN public.ear_training_stages s ON s.id = ph.stage_id
    WHERE ch.id = phrase_chord_id
      AND (
        s.is_active = true
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true)
      )
  )
);

DROP POLICY IF EXISTS "Admins can manage ear training phrase chord quotes" ON public.ear_training_phrase_chord_quotes;
CREATE POLICY "Admins can manage ear training phrase chord quotes"
ON public.ear_training_phrase_chord_quotes
FOR ALL
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = (SELECT auth.uid()) AND p.is_admin = true));

DROP TRIGGER IF EXISTS ear_training_phrase_chord_quotes_updated_at_trigger ON public.ear_training_phrase_chord_quotes;
CREATE TRIGGER ear_training_phrase_chord_quotes_updated_at_trigger
  BEFORE UPDATE ON public.ear_training_phrase_chord_quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.ear_training_touch_updated_at();

GRANT SELECT ON public.ear_training_phrase_chord_quotes TO authenticated;
