-- ファンタジーBGMアセットテーブルの作成とRLS設定

-- テーブル作成
CREATE TABLE IF NOT EXISTS public.fantasy_bgm_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  mp3_url text,
  r2_key text,
  created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.fantasy_bgm_assets IS 'ファンタジーモード用のBGMファイル管理テーブル (Cloudflare R2に保存されたMP3のURLを管理)';
COMMENT ON COLUMN public.fantasy_bgm_assets.name IS '管理用表示名';
COMMENT ON COLUMN public.fantasy_bgm_assets.mp3_url IS '公開MP3 URL (R2 CDN)';
COMMENT ON COLUMN public.fantasy_bgm_assets.r2_key IS 'R2オブジェクトキー（削除用）';

-- 更新トリガー
DROP TRIGGER IF EXISTS fantasy_bgm_assets_updated_at_trigger ON public.fantasy_bgm_assets;
CREATE TRIGGER fantasy_bgm_assets_updated_at_trigger
  BEFORE UPDATE ON public.fantasy_bgm_assets
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_set_timestamp();

-- RLS 有効化
ALTER TABLE public.fantasy_bgm_assets ENABLE ROW LEVEL SECURITY;

-- ポリシー: 全員読み取り可
DROP POLICY IF EXISTS fantasy_bgm_assets_read_policy ON public.fantasy_bgm_assets;
CREATE POLICY fantasy_bgm_assets_read_policy ON public.fantasy_bgm_assets
  FOR SELECT USING (true);

-- ポリシー: 管理者のみ書き込み可（INSERT/UPDATE/DELETE）
DROP POLICY IF EXISTS fantasy_bgm_assets_write_policy ON public.fantasy_bgm_assets;
CREATE POLICY fantasy_bgm_assets_write_policy ON public.fantasy_bgm_assets
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- インデックス
CREATE INDEX IF NOT EXISTS fantasy_bgm_assets_created_at_idx ON public.fantasy_bgm_assets(created_at DESC);

-- 権限
GRANT ALL ON TABLE public.fantasy_bgm_assets TO anon;
GRANT ALL ON TABLE public.fantasy_bgm_assets TO authenticated;
GRANT ALL ON TABLE public.fantasy_bgm_assets TO service_role;