DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'lessons') THEN
        UPDATE public.lessons SET order_index = order_index + 1;
        ALTER TABLE public.lessons ALTER COLUMN order_index SET DEFAULT 1;
    END IF;
END $$; 