-- Add order_index to courses table for sorting
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS order_index integer NOT NULL DEFAULT 0;

-- Set initial order based on creation date
UPDATE public.courses 
SET order_index = (
  SELECT COUNT(*) 
  FROM public.courses c2 
  WHERE c2.created_at <= courses.created_at
) * 10;

-- Add premium_only column to replace min_rank for simpler management
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS premium_only boolean NOT NULL DEFAULT false;

-- Migrate existing min_rank to premium_only
UPDATE public.courses 
SET premium_only = CASE 
  WHEN min_rank IN ('premium', 'platinum') THEN true 
  ELSE false 
END;
