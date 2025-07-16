-- Fix lesson_songs table schema inconsistency
-- This migration consolidates the old column-based approach to the new JSONB clear_conditions approach

DO $$
BEGIN
    -- Only run if lesson_songs table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'lesson_songs'
    ) THEN
        -- Check if old columns exist
        IF EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'lesson_songs' 
            AND column_name IN ('key_offset', 'min_speed', 'min_rank', 'min_clear_count', 'notation_setting')
        ) THEN
            -- Create temporary table to store existing data
            CREATE TEMP TABLE temp_lesson_songs AS
            SELECT 
                lesson_id,
                song_id,
                jsonb_build_object(
                    'key', COALESCE(key_offset, 0),
                    'speed', COALESCE(min_speed, 1.0),
                    'rank', COALESCE(min_rank, 'B'),
                    'count', COALESCE(min_clear_count, 1),
                    'notation_setting', COALESCE(notation_setting, 'both')
                ) as clear_conditions
            FROM public.lesson_songs;
            
            -- Drop the old table
            DROP TABLE public.lesson_songs CASCADE;
            
            -- Create the new table with correct schema
            CREATE TABLE public.lesson_songs (
                id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
                lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
                song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
                clear_conditions jsonb,
                created_at timestamp with time zone DEFAULT now() NOT NULL,
                CONSTRAINT lesson_songs_lesson_id_song_id_key UNIQUE (lesson_id, song_id)
            );
            
            -- Restore data from temporary table
            INSERT INTO public.lesson_songs (lesson_id, song_id, clear_conditions)
            SELECT lesson_id, song_id, clear_conditions
            FROM temp_lesson_songs;
            
            -- Drop temporary table
            DROP TABLE temp_lesson_songs;
        ELSE
            -- If table already has the correct schema, ensure all columns exist
            ALTER TABLE public.lesson_songs 
            ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() NOT NULL;
            
            -- Add primary key if not exists
            DO $pk$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'lesson_songs_pkey'
                ) THEN
                    ALTER TABLE public.lesson_songs ADD PRIMARY KEY (id);
                END IF;
            END $pk$;
            
            ALTER TABLE public.lesson_songs 
            ADD COLUMN IF NOT EXISTS clear_conditions jsonb;
            
            ALTER TABLE public.lesson_songs 
            ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now() NOT NULL;
        END IF;

        -- Create indexes
        CREATE INDEX IF NOT EXISTS idx_lesson_songs_lesson_id ON public.lesson_songs(lesson_id);
        CREATE INDEX IF NOT EXISTS idx_lesson_songs_song_id ON public.lesson_songs(song_id);

        -- Enable RLS
        ALTER TABLE public.lesson_songs ENABLE ROW LEVEL SECURITY;

        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Allow admin full access on lesson_songs" ON public.lesson_songs;
        DROP POLICY IF EXISTS "Allow authenticated users to read lesson_songs" ON public.lesson_songs;
        DROP POLICY IF EXISTS "Admin can manage lesson songs" ON public.lesson_songs;
        DROP POLICY IF EXISTS "Authenticated users can view lesson songs" ON public.lesson_songs;

        -- Create new policies
        CREATE POLICY "Allow admin full access on lesson_songs" ON public.lesson_songs FOR ALL
        USING ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)))
        WITH CHECK ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));

        CREATE POLICY "Allow authenticated users to read lesson_songs" ON public.lesson_songs FOR SELECT
        TO authenticated USING (true);
    END IF;
END $$; 