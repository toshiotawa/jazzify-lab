-- Challenge Fantasy Tracks: ミッションにファンタジーステージをひも付け
CREATE TABLE IF NOT EXISTS public.challenge_fantasy_tracks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  fantasy_stage_id uuid NOT NULL REFERENCES public.fantasy_stages(id) ON DELETE RESTRICT,
  clears_required integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- 一意制約（同一チャレンジに同一ステージを重複追加しない）
CREATE UNIQUE INDEX IF NOT EXISTS idx_challenge_fantasy_unique
  ON public.challenge_fantasy_tracks (challenge_id, fantasy_stage_id);

-- 参照/検索用インデックス
CREATE INDEX IF NOT EXISTS idx_challenge_fantasy_challenge_id
  ON public.challenge_fantasy_tracks (challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_fantasy_stage_id
  ON public.challenge_fantasy_tracks (fantasy_stage_id);

-- RLS
ALTER TABLE public.challenge_fantasy_tracks ENABLE ROW LEVEL SECURITY;
-- 読み取りは全員可
DROP POLICY IF EXISTS challenge_fantasy_tracks_select ON public.challenge_fantasy_tracks;
CREATE POLICY challenge_fantasy_tracks_select
  ON public.challenge_fantasy_tracks
  FOR SELECT
  USING (true);
-- 書き込みは管理者のみ
DROP POLICY IF EXISTS challenge_fantasy_tracks_admin_manage ON public.challenge_fantasy_tracks;
CREATE POLICY challenge_fantasy_tracks_admin_manage
  ON public.challenge_fantasy_tracks
  FOR ALL
  USING (
    auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
  );

COMMENT ON TABLE public.challenge_fantasy_tracks IS 'Challenges に紐づくファンタジーステージと必要クリア回数の管理テーブル';
COMMENT ON COLUMN public.challenge_fantasy_tracks.clears_required IS 'このステージの必要クリア回数（ミッション判定用）';

-- User Challenge Fantasy Progress: ユーザーごとのミッション内ファンタジーステージ進捗
CREATE TABLE IF NOT EXISTS public.user_challenge_fantasy_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  fantasy_stage_id uuid NOT NULL REFERENCES public.fantasy_stages(id) ON DELETE RESTRICT,
  clear_count integer NOT NULL DEFAULT 0,
  last_cleared_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 一意制約（ユーザー×チャレンジ×ステージで1行）
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_challenge_fantasy_unique
  ON public.user_challenge_fantasy_progress (user_id, challenge_id, fantasy_stage_id);

-- 参照/検索用インデックス
CREATE INDEX IF NOT EXISTS idx_user_challenge_fantasy_user_id
  ON public.user_challenge_fantasy_progress (user_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_fantasy_challenge_id
  ON public.user_challenge_fantasy_progress (challenge_id);
CREATE INDEX IF NOT EXISTS idx_user_challenge_fantasy_stage_id
  ON public.user_challenge_fantasy_progress (fantasy_stage_id);

-- RLS
ALTER TABLE public.user_challenge_fantasy_progress ENABLE ROW LEVEL SECURITY;
-- 自分のレコードのみ読み書き可（管理者は全権）
DROP POLICY IF EXISTS user_challenge_fantasy_owner_select ON public.user_challenge_fantasy_progress;
CREATE POLICY user_challenge_fantasy_owner_select
  ON public.user_challenge_fantasy_progress
  FOR SELECT
  USING (
    auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
  );

DROP POLICY IF EXISTS user_challenge_fantasy_owner_modify ON public.user_challenge_fantasy_progress;
CREATE POLICY user_challenge_fantasy_owner_modify
  ON public.user_challenge_fantasy_progress
  FOR ALL
  USING (
    auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
  )
  WITH CHECK (
    auth.uid() = user_id OR auth.uid() IN (SELECT id FROM public.profiles WHERE is_admin = true)
  );

COMMENT ON TABLE public.user_challenge_fantasy_progress IS 'ミッション内ファンタジーステージのユーザー進捗（通常のファンタジーモードとは分離）';