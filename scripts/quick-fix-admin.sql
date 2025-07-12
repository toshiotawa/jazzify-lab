-- 1. 現在のユーザー情報を確認
SELECT 
    auth.uid() as user_id,
    p.email,
    p.is_admin
FROM public.profiles p
WHERE p.id = auth.uid();

-- 2. 現在のユーザーを管理者に設定
-- 上記で表示されたメールアドレスを確認してから実行してください
UPDATE public.profiles 
SET is_admin = true 
WHERE id = auth.uid()
RETURNING id, email, is_admin;

-- 3. 確認
SELECT 
    id,
    email, 
    is_admin 
FROM public.profiles 
WHERE id = auth.uid(); 