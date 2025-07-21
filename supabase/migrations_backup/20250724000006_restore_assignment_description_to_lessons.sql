-- lessonsテーブルにassignment_descriptionカラムを安全に追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'assignment_description'
    ) THEN
        ALTER TABLE public.lessons ADD COLUMN assignment_description text;
    END IF;
END $$; 