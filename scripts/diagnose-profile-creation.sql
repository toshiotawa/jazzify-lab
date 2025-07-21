-- Profile Creation Error 診断スクリプト
-- このスクリプトは手動で実行して問題を特定します

-- 1. 現在のユーザー情報を確認
SELECT 
    'Current User Info' as section,
    auth.uid() as user_id,
    auth.email() as email,
    auth.role() as role;

-- 2. profilesテーブルの構造を確認
SELECT 
    'Profiles Table Structure' as section,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. profilesテーブルのRLSポリシーを確認
SELECT 
    'RLS Policies' as section,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles' 
AND schemaname = 'public'
ORDER BY policyname;

-- 4. 現在のユーザーのプロフィール存在確認
SELECT 
    'Current User Profile' as section,
    id,
    email,
    nickname,
    rank,
    is_admin,
    created_at
FROM public.profiles 
WHERE id = auth.uid();

-- 5. membership_rank ENUM型の確認
SELECT 
    'Membership Rank ENUM' as section,
    enumlabel
FROM pg_enum 
WHERE enumtypid = (
    SELECT oid 
    FROM pg_type 
    WHERE typname = 'membership_rank' 
    AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
)
ORDER BY enumsortorder;

-- 6. RLSが有効かどうか確認
SELECT 
    'RLS Status' as section,
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- 7. 権限確認
SELECT 
    'Permissions' as section,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- 8. 制約確認
SELECT 
    'Constraints' as section,
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- 9. 外部キー制約確認
SELECT 
    'Foreign Keys' as section,
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'profiles';

-- 10. テスト用のプロフィール作成試行（実際には作成しない）
SELECT 
    'Test Profile Creation' as section,
    'This would attempt to create a profile with:' as info,
    auth.uid() as test_id,
    auth.email() as test_email,
    'test_nickname' as test_nickname,
    'free'::membership_rank as test_rank,
    0 as test_xp,
    1 as test_level,
    false as test_is_admin; 