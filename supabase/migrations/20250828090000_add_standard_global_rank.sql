-- Add 'standard_global' to membership_rank enum for global plan
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'membership_rank'
      AND e.enumlabel = 'standard_global'
  ) THEN
    ALTER TYPE public.membership_rank ADD VALUE 'standard_global';
  END IF;
END $$;

-- Ensure existing rows have valid enum values; no-op if none
UPDATE public.profiles SET rank = 'free' WHERE rank IS NULL;

