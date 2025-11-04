-- profiles.member_rank を正式に廃止し、rank カラムへ統一
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'member_rank'
  ) THEN
    RAISE NOTICE 'member_rank column does not exist. Skipping migration.';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'rank'
  ) THEN
    RAISE EXCEPTION 'rank column does not exist. Cannot migrate member_rank values.';
  END IF;

  -- member_rank の既存データを rank に反映
  UPDATE public.profiles
  SET rank = LOWER(member_rank)::public.membership_rank
  WHERE member_rank IS NOT NULL
    AND member_rank <> ''
    AND (
      rank IS NULL
      OR rank::text <> LOWER(member_rank)
    );

  -- 旧カラムに紐づく制約を削除
  ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS member_rank_check;

  -- 旧カラムを削除
  ALTER TABLE public.profiles DROP COLUMN member_rank;
END
$$;
