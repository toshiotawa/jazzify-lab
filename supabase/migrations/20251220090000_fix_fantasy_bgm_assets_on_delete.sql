-- プロファイル削除時の外部キー制約を修正
-- ON DELETE SET NULL が正しく動作するよう NOT NULL 制約を削除

-- =============================================
-- 1. fantasy_bgm_assets テーブル
-- =============================================
-- created_by カラムの NOT NULL 制約を削除
ALTER TABLE public.fantasy_bgm_assets 
  ALTER COLUMN created_by DROP NOT NULL;

-- 既存の外部キー制約を削除
ALTER TABLE public.fantasy_bgm_assets 
  DROP CONSTRAINT IF EXISTS fantasy_bgm_assets_created_by_fkey;

-- ON DELETE SET NULL で新しい外部キー制約を追加
ALTER TABLE public.fantasy_bgm_assets 
  ADD CONSTRAINT fantasy_bgm_assets_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.fantasy_bgm_assets.created_by IS '作成者のプロファイルID（ユーザー削除時はNULLになる）';

-- =============================================
-- 2. guilds テーブル
-- =============================================
-- leader_id カラムの NOT NULL 制約を削除（ON DELETE SET NULL と競合するため）
ALTER TABLE public.guilds 
  ALTER COLUMN leader_id DROP NOT NULL;

COMMENT ON COLUMN public.guilds.leader_id IS 'ギルドリーダーのプロファイルID（リーダー削除時はNULLになる）';
