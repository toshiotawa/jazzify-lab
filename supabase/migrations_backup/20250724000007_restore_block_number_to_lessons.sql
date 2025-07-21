-- lessonsテーブルにblock_numberカラムを安全に追加
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'lessons' 
        AND column_name = 'block_number'
    ) THEN
        ALTER TABLE public.lessons ADD COLUMN block_number integer NOT NULL DEFAULT 1;
        
        -- 既存のレッスンをブロックに振り分ける（order_indexを元に5つずつのブロックに分ける）
        UPDATE public.lessons
        SET block_number = ceil((order_index + 1)::numeric / 5);
        
        -- インデックスを作成
        CREATE INDEX IF NOT EXISTS lessons_block_idx ON public.lessons (course_id, block_number);
    END IF;
END $$; 