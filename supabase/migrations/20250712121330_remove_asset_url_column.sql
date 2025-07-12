-- asset_urlカラムを削除（存在する場合のみ）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'songs' 
    AND column_name = 'asset_url'
  ) THEN
    ALTER TABLE public.songs DROP COLUMN asset_url;
    RAISE NOTICE 'asset_urlカラムを削除しました';
  ELSE
    RAISE NOTICE 'asset_urlカラムは存在しません';
  END IF;
END $$;
