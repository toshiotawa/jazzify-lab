-- シンプルな管理者プロファイル作成
-- 注: email と nickname の値は適切に変更してください

-- オプション1: auth.users テーブルから情報を取得して作成
INSERT INTO public.profiles (id, email, nickname, is_admin, rank)
SELECT 
    id,
    email,
    split_part(email, '@', 1),
    true,
    'platinum'::membership_rank
FROM auth.users
WHERE id = auth.uid()
ON CONFLICT (id) DO UPDATE SET is_admin = true;

-- 確認
SELECT * FROM public.profiles WHERE id = auth.uid(); 