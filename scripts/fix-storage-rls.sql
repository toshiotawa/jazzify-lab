-- ストレージRLSの問題を修正するスクリプト
-- 注意: Supabase SQL Editorで実行してください

-- 1. 現在の認証ユーザーを確認
SELECT id, email, is_admin 
FROM public.profiles 
WHERE id = auth.uid();

-- 2. もしis_adminがfalseの場合、trueに更新
UPDATE public.profiles 
SET is_admin = true 
WHERE id = auth.uid();

-- 3. ストレージバケットの存在確認（情報のみ）
SELECT * FROM storage.buckets WHERE name = 'song-files';

-- 4. 既存のストレージポリシーを確認
SELECT * FROM storage.policies WHERE bucket_id = 'song-files';

-- 5. 一時的な解決策：全ての認証ユーザーにアップロード権限を付与
-- 注意: これは開発環境でのみ使用してください
CREATE POLICY "Temporary allow all authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'song-files');

CREATE POLICY "Temporary allow all authenticated updates"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'song-files')
WITH CHECK (bucket_id = 'song-files');

CREATE POLICY "Temporary allow all authenticated deletes"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'song-files');

-- 6. 公開読み取りポリシー
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'song-files'); 