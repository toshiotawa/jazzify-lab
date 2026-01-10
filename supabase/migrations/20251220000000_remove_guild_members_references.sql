-- guild_members テーブルへの参照を削除するマイグレーション
-- ギルド機能廃止に伴い、guild_membersテーブルが削除されたが、
-- profilesテーブルのRLSポリシーに参照が残っていたため、プロフィール更新が失敗していた

-- guild_membersを参照している可能性のあるprofilesテーブルのRLSポリシーを削除
DO $$
DECLARE
    pol_record record;
BEGIN
    -- profilesテーブルのポリシーでguild_membersを参照しているものを検索して削除
    FOR pol_record IN 
        SELECT polname 
        FROM pg_policy 
        JOIN pg_class ON pg_policy.polrelid = pg_class.oid
        WHERE pg_class.relname = 'profiles'
          AND pg_get_expr(pg_policy.polqual, pg_policy.polrelid) LIKE '%guild_members%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol_record.polname);
        RAISE NOTICE 'Dropped policy: %', pol_record.polname;
    END LOOP;
    
    -- WITH CHECK節でguild_membersを参照しているポリシーも削除
    FOR pol_record IN 
        SELECT polname 
        FROM pg_policy 
        JOIN pg_class ON pg_policy.polrelid = pg_class.oid
        WHERE pg_class.relname = 'profiles'
          AND pg_policy.polwithcheck IS NOT NULL
          AND pg_get_expr(pg_policy.polwithcheck, pg_policy.polrelid) LIKE '%guild_members%'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.profiles', pol_record.polname);
        RAISE NOTICE 'Dropped policy with check: %', pol_record.polname;
    END LOOP;
END $$;

-- guild_membersテーブル自体が残っている場合は削除（依存関係も含めて）
DROP TABLE IF EXISTS public.guild_members CASCADE;

-- ギルド関連の他のテーブルも残っていれば削除
DROP TABLE IF EXISTS public.guilds CASCADE;
DROP TABLE IF EXISTS public.guild_join_requests CASCADE;
DROP TABLE IF EXISTS public.guild_invitations CASCADE;

-- ギルド関連の関数が残っていれば削除
DROP FUNCTION IF EXISTS public.get_guild_ranking() CASCADE;
DROP FUNCTION IF EXISTS public.get_guild_members(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.join_guild(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.leave_guild() CASCADE;
DROP FUNCTION IF EXISTS public.create_guild(text, text) CASCADE;
DROP FUNCTION IF EXISTS public.dissolve_guild(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_guild_bonus(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.calculate_guild_bonus(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.update_guild_streak() CASCADE;
DROP FUNCTION IF EXISTS public.get_guild_weekly_xp(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.get_guild_monthly_xp(uuid) CASCADE;

-- guild関連のビューも削除
DROP VIEW IF EXISTS public.guild_ranking CASCADE;
DROP VIEW IF EXISTS public.guild_member_stats CASCADE;
