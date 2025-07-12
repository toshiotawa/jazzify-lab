-- 1. 現在のユーザー情報を確認
SELECT 
    auth.uid() as user_id,
    auth.email() as email;

-- 2. profilesテーブルにレコードを作成（管理者として）
INSERT INTO public.profiles (
    id,
    email,
    nickname,
    rank,
    is_admin,
    xp,
    level
) VALUES (
    auth.uid(),
    auth.email(),
    split_part(auth.email(), '@', 1), -- メールアドレスの@前を仮のニックネームとして使用
    'free',
    true, -- 管理者として設定
    0,
    1
) ON CONFLICT (id) DO UPDATE SET
    is_admin = true -- 既に存在する場合は管理者フラグを更新
RETURNING *;

-- 3. 作成・更新されたプロファイルを確認
SELECT 
    id,
    email,
    nickname,
    is_admin,
    rank
FROM public.profiles 
WHERE id = auth.uid(); 