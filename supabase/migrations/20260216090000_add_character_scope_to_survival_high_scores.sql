-- サバイバルハイスコアを難易度×キャラクター単位で保持する
-- 既存データ（character_id=NULL）との後方互換性を維持するため、
-- NULL用と非NULL用でユニーク制約を分ける

ALTER TABLE public.survival_high_scores
  ADD COLUMN IF NOT EXISTS character_id uuid REFERENCES public.survival_characters(id) ON DELETE SET NULL;

ALTER TABLE public.survival_high_scores
  DROP CONSTRAINT IF EXISTS survival_high_scores_user_id_difficulty_key;

ALTER TABLE public.survival_high_scores
  DROP CONSTRAINT IF EXISTS survival_high_scores_user_id_difficulty_character_id_key;

ALTER TABLE public.survival_high_scores
  ADD CONSTRAINT survival_high_scores_user_id_difficulty_character_id_key
  UNIQUE (user_id, difficulty, character_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_survival_high_scores_user_diff_null_char
  ON public.survival_high_scores (user_id, difficulty)
  WHERE character_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_survival_high_scores_character_id
  ON public.survival_high_scores (character_id);
