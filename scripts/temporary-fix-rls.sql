-- 警告: これは一時的な解決策です。本番環境では推奨されません。

-- オプション1: 現在のユーザーを管理者に設定（メールアドレスを実際のものに変更してください）
UPDATE public.profiles 
SET is_admin = true 
WHERE email = 'your-email@example.com';  -- ← あなたのメールアドレスに変更

-- オプション2: RLSポリシーを一時的に緩和（開発環境のみ）
-- 既存のINSERTポリシーを削除して新しいものを作成
DROP POLICY IF EXISTS "songs_admin_insert" ON public.songs;

CREATE POLICY "songs_admin_insert_temp" ON public.songs
FOR INSERT 
WITH CHECK (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE is_admin = true
    )
);

-- オプション3: より単純なポリシーに変更
-- DROP POLICY IF EXISTS "songs_admin_insert" ON public.songs;
-- CREATE POLICY "songs_admin_insert_simple" ON public.songs
-- FOR INSERT 
-- WITH CHECK (true);  -- 一時的にすべて許可（危険！）

-- 確認: 変更後の状態を確認
SELECT id, email, is_admin FROM public.profiles WHERE id = auth.uid(); 