-- 1. 現在のユーザー情報を確認
SELECT 
    auth.uid() as auth_user_id,
    auth.email() as auth_email,
    auth.role() as auth_role;

-- 2. profilesテーブルの該当ユーザー情報を確認
SELECT 
    id, 
    email, 
    nickname,
    is_admin,
    rank
FROM public.profiles 
WHERE id = auth.uid();

-- 3. すべての管理者を確認
SELECT 
    id, 
    email, 
    nickname,
    is_admin 
FROM public.profiles 
WHERE is_admin = true;

-- 4. RLSポリシーの詳細を確認
SELECT 
    polname AS policy_name,
    polcmd,
    pg_get_expr(polqual, polrelid) AS using_expr,
    pg_get_expr(polwithcheck, polrelid) AS with_check_expr
FROM pg_policy 
WHERE polrelid = 'public.songs'::regclass;

-- 5. テスト: 管理者チェックを直接実行
SELECT 
    auth.uid() as current_user_id,
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() 
        AND is_admin = true
    ) as is_admin_check;

-- 6. songsテーブルへの挿入権限を確認
SELECT has_table_privilege(current_user, 'public.songs', 'INSERT') as can_insert;

-- 7. 現在のロールの権限を確認
SELECT 
    current_user,
    current_role,
    session_user; 