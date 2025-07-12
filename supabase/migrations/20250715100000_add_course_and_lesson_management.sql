-- courses table
CREATE TABLE public.courses (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    title text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

-- lessons table
CREATE TABLE public.lessons (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title text NOT NULL,
    description text,
    assignment_description text,
    "order" integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

-- lesson_songs junction table
CREATE TABLE public.lesson_songs (
    id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
    lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
    song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
    clear_conditions jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT lesson_songs_lesson_id_song_id_key UNIQUE (lesson_id, song_id)
);
ALTER TABLE public.lesson_songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Allow admin full access on courses" ON public.courses FOR ALL
USING ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)))
WITH CHECK ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));

CREATE POLICY "Allow authenticated users to read courses" ON public.courses FOR SELECT
TO authenticated USING (true);

-- RLS Policies for lessons
CREATE POLICY "Allow admin full access on lessons" ON public.lessons FOR ALL
USING ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)))
WITH CHECK ((EXISTS ( SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)));

CREATE POLICY "Allow authenticated users to read lessons" ON public.lessons FOR SELECT
TO authenticated USING (true);

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

-- Triggers for updated_at
CREATE TRIGGER set_courses_timestamp
BEFORE UPDATE ON public.courses
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp();

CREATE TRIGGER set_lessons_timestamp
BEFORE UPDATE ON public.lessons
FOR EACH ROW
EXECUTE FUNCTION public.trigger_set_timestamp(); 