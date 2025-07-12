-- songsテーブルの包括的なスキーマ更新
-- 本番環境の古いスキーマから新しいスキーマへの移行

-- 1. 新しいカラムを追加
alter table public.songs
  add column if not exists artist text,
  add column if not exists json_data jsonb,
  add column if not exists min_rank public.membership_rank default 'free',
  add column if not exists is_public boolean default true,
  add column if not exists created_by uuid references public.profiles(id) on delete set null;

-- 2. bpmとdifficultyをnullableに変更
alter table public.songs
  alter column bpm drop not null,
  alter column difficulty drop not null;

-- 3. available_ranksからmin_rankへのデータ移行
DO $$
BEGIN
  -- available_ranksが存在する場合の処理
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'songs' 
             AND column_name = 'available_ranks') THEN
    
    -- available_ranksの最小値をmin_rankに設定
    UPDATE public.songs 
    SET min_rank = CASE 
      WHEN 'FREE' = ANY(available_ranks) THEN 'free'::membership_rank
      WHEN 'STANDARD' = ANY(available_ranks) THEN 'standard'::membership_rank
      WHEN 'PREMIUM' = ANY(available_ranks) THEN 'premium'::membership_rank
      WHEN 'PLATINUM' = ANY(available_ranks) THEN 'platinum'::membership_rank
      ELSE 'free'::membership_rank
    END
    WHERE min_rank IS NULL;
    
    -- available_ranksカラムを削除
    ALTER TABLE public.songs DROP COLUMN available_ranks;
  END IF;
END $$;

-- 4. asset_urlが存在する場合、audio_urlに移行してから削除
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_schema = 'public' 
             AND table_name = 'songs' 
             AND column_name = 'asset_url') THEN
    
    -- asset_urlの値をaudio_urlにコピー（audio_urlが空の場合のみ）
    UPDATE public.songs 
    SET audio_url = asset_url 
    WHERE audio_url IS NULL AND asset_url IS NOT NULL;
    
    -- asset_urlカラムを削除
    ALTER TABLE public.songs DROP COLUMN asset_url;
  END IF;
END $$;

-- 5. json_dataカラムにデフォルト値を設定（nullの場合）
UPDATE public.songs 
SET json_data = '{}'::jsonb 
WHERE json_data IS NULL;

-- 6. json_dataをNOT NULLに設定
ALTER TABLE public.songs 
ALTER COLUMN json_data SET NOT NULL;

-- 7. インデックスを追加（パフォーマンス向上）
CREATE INDEX IF NOT EXISTS idx_songs_min_rank ON public.songs(min_rank);
CREATE INDEX IF NOT EXISTS idx_songs_created_by ON public.songs(created_by);
CREATE INDEX IF NOT EXISTS idx_songs_is_public ON public.songs(is_public); 