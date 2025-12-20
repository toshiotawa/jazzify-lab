-- fantasy_bgm_assets テーブルの外部キー制約を ON DELETE SET NULL に変更
-- これにより、プロファイル削除時にBGMアセットは残り、created_by がNULLになる

-- 1. created_by カラムの NOT NULL 制約を削除
ALTER TABLE public.fantasy_bgm_assets 
  ALTER COLUMN created_by DROP NOT NULL;

-- 2. 既存の外部キー制約を削除
ALTER TABLE public.fantasy_bgm_assets 
  DROP CONSTRAINT IF EXISTS fantasy_bgm_assets_created_by_fkey;

-- 3. ON DELETE SET NULL で新しい外部キー制約を追加
ALTER TABLE public.fantasy_bgm_assets 
  ADD CONSTRAINT fantasy_bgm_assets_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES public.profiles(id) ON DELETE SET NULL;

-- コメント更新
COMMENT ON COLUMN public.fantasy_bgm_assets.created_by IS '作成者のプロファイルID（ユーザー削除時はNULLになる）';
