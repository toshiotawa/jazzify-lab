-- profilesテーブルのRLS状態を確認
SELECT 
    schemaname,
    tablename,
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'profiles' AND schemaname = 'public';

-- profilesテーブルのRLSポリシーを確認
SELECT 
    polname AS policy_name,
    CASE polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        WHEN '*' THEN 'ALL'
    END AS command_type,
    pg_get_expr(polqual, polrelid) AS using_expr,
    pg_get_expr(polwithcheck, polrelid) AS with_check_expr
FROM pg_policy 
WHERE polrelid = 'public.profiles'::regclass;

-- profilesテーブルへのアクセス権限を確認
SELECT 
    has_table_privilege('public.profiles', 'SELECT') as can_select_profiles,
    has_table_privilege('public.profiles', 'INSERT') as can_insert_profiles; 