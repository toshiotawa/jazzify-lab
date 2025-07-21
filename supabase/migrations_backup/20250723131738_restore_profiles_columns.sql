-- 削除されたprofilesテーブルのカラムを復活させるmigration
-- これによりauthStore.tsのfetchProfile関数が正常に動作し、ログインが完了するようになる

-- 削除されたカラムを安全に復活（既存の場合はスキップ）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.profiles ADD COLUMN avatar_url text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.profiles ADD COLUMN bio text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'twitter_handle') THEN
        ALTER TABLE public.profiles ADD COLUMN twitter_handle text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'selected_title') THEN
        ALTER TABLE public.profiles ADD COLUMN selected_title text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'stripe_customer_id') THEN
        ALTER TABLE public.profiles ADD COLUMN stripe_customer_id text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'will_cancel') THEN
        ALTER TABLE public.profiles ADD COLUMN will_cancel boolean;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'cancel_date') THEN
        ALTER TABLE public.profiles ADD COLUMN cancel_date text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'downgrade_to') THEN
        ALTER TABLE public.profiles ADD COLUMN downgrade_to text;
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'downgrade_date') THEN
        ALTER TABLE public.profiles ADD COLUMN downgrade_date text;
    END IF;
END $$;

-- インデックスも復活
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer_id ON public.profiles(stripe_customer_id);

-- member_rank制約も安全に復活（rankカラムとの整合性のため）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND constraint_name = 'member_rank_check'
    ) THEN
        ALTER TABLE public.profiles ADD CONSTRAINT member_rank_check CHECK (rank IN ('free', 'standard', 'premium', 'platinum'));
    END IF;
END $$;