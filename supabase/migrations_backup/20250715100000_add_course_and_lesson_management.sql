-- Add missing columns to existing courses table
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- Add missing columns to existing lessons table
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS assignment_description text;
ALTER TABLE public.lessons ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now() NOT NULL;

-- Create lesson_songs table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.lesson_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    clear_conditions jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lesson_songs_lesson_id_song_id_key UNIQUE (lesson_id, song_id)
);
ALTER TABLE public.lesson_songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Allow admin full access on courses') THEN
        CREATE POLICY "Allow admin full access on courses" ON public.courses FOR ALL
        USING ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)))
        WITH CHECK ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Allow authenticated users to read courses') THEN
        CREATE POLICY "Allow authenticated users to read courses" ON public.courses FOR SELECT
        TO authenticated USING (true);
    END IF;
END $$;

-- RLS Policies for lessons (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Allow admin full access on lessons') THEN
        CREATE POLICY "Allow admin full access on lessons" ON public.lessons FOR ALL
        USING ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)))
        WITH CHECK ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lessons' AND policyname = 'Allow authenticated users to read lessons') THEN
        CREATE POLICY "Allow authenticated users to read lessons" ON public.lessons FOR SELECT
        TO authenticated USING (true);
    END IF;
END $$;

-- RLS Policies for lesson_songs
CREATE POLICY "Allow admin full access on lesson_songs" ON public.lesson_songs FOR ALL
USING ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)))
WITH CHECK ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));

CREATE POLICY "Allow authenticated users to read lesson_songs" ON public.lesson_songs FOR SELECT
TO authenticated USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_courses_timestamp') THEN
        CREATE TRIGGER set_courses_timestamp
        BEFORE UPDATE ON public.courses
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_set_timestamp();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_lessons_timestamp') THEN
        CREATE TRIGGER set_lessons_timestamp
        BEFORE UPDATE ON public.lessons
        FOR EACH ROW
        EXECUTE FUNCTION public.trigger_set_timestamp();
    END IF;
END $$; 