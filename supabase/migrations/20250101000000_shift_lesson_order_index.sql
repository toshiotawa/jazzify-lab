UPDATE public.lessons SET order_index = order_index + 1;

ALTER TABLE public.lessons ALTER COLUMN order_index SET DEFAULT 1; 