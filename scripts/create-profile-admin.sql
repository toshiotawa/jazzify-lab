-- 警告: これらのコマンドは管理者権限（Supabase Dashboard）で実行する必要があります

-- 1. 現在のユーザー情報を確認
SELECT 
    auth.uid() as user_id,
    auth.email() as email;

-- 2. 一時的にprofilesテーブルのRLSを無効化（管理者のみ実行可能）
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 3. profileレコードを作成
INSERT INTO public.profiles (
    id,
    email,
    nickname,
    rank,
    is_admin,
    xp,
    level,
    created_at,
    updated_at
) VALUES (
    auth.uid(),
    auth.email(),
    COALESCE(split_part(auth.email(), '@', 1), 'admin'), -- メールアドレスの@前を仮のニックネームとして使用
    'black'::membership_rank, -- 管理者なのでブラックランクに設定
    true, -- 管理者として設定
    0,
    1,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    is_admin = true, -- 既に存在する場合は管理者フラグを更新
    rank = 'black'::membership_rank,
    updated_at = NOW()
RETURNING *;

-- 4. RLSを再度有効化
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. 作成されたプロファイルを確認
SELECT 
    id,
    email,
    nickname,
    is_admin,
    rank
FROM public.profiles 
WHERE id = auth.uid();

-- 6. もう一度管理者チェックを実行
SELECT 
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    ) as is_admin_check; 