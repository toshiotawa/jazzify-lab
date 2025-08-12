-- Extend membership_rank enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_enum e ON t.oid = e.enumtypid WHERE t.typname = 'membership_rank' AND e.enumlabel = 'standard_global') THEN
    ALTER TYPE public.membership_rank ADD VALUE 'standard_global';
  END IF;
END $$;

-- Add target_audience column to announcements ('default' for JP/others, 'global' for Standard(Global))
ALTER TABLE public.announcements
  ADD COLUMN IF NOT EXISTS target_audience text NOT NULL DEFAULT 'default';

-- Optional index to help filtering active announcements by audience and priority
CREATE INDEX IF NOT EXISTS announcements_audience_active_idx 
  ON public.announcements (target_audience, is_active, priority, created_at);