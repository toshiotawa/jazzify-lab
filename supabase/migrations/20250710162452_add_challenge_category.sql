-- Add category field to challenges table (with table and column existence check)
DO $$
BEGIN
    -- Check if challenges table exists first
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'challenges'
    ) THEN
        -- Add category column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'challenges' 
            AND column_name = 'category'
        ) THEN
            ALTER TABLE challenges 
            ADD COLUMN category TEXT NOT NULL DEFAULT 'song_clear' CHECK (category IN ('diary', 'song_clear'));
            
            RAISE NOTICE 'category column added to challenges table';
        ELSE
            RAISE NOTICE 'category column already exists in challenges table';
        END IF;
        
        -- Add song_clear_count column if it doesn't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'challenges' 
            AND column_name = 'song_clear_count'
        ) THEN
            ALTER TABLE challenges 
            ADD COLUMN song_clear_count INTEGER;
            
            RAISE NOTICE 'song_clear_count column added to challenges table';
        ELSE
            RAISE NOTICE 'song_clear_count column already exists in challenges table';
        END IF;
    ELSE
        RAISE NOTICE 'challenges table does not exist, skipping column additions';
    END IF;
END $$; 