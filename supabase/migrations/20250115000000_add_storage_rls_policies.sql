-- ストレージバケットのRLSポリシーを追加
-- song-filesバケット用のポリシー

-- 管理者は全ての操作が可能
CREATE POLICY "Admin users can upload song files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'song-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Admin users can update song files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'song-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
)
WITH CHECK (
  bucket_id = 'song-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Admin users can delete song files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'song-files' AND
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_admin = true
  )
);

-- 全ユーザーが読み取り可能（公開バケット）
CREATE POLICY "Public users can view song files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'song-files');

-- avatarsバケット用のポリシー（既存のバケット用）
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Avatars are publicly accessible"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');
