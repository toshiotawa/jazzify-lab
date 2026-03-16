ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS title_en text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS content_en text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS link_text_en text;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS publish_ja boolean NOT NULL DEFAULT true;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS publish_en boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.announcements.title_en IS 'English title (nullable, fallback to title)';
COMMENT ON COLUMN public.announcements.content_en IS 'English content (nullable, fallback to content)';
COMMENT ON COLUMN public.announcements.link_text_en IS 'English link text (nullable, fallback to link_text)';
COMMENT ON COLUMN public.announcements.publish_ja IS 'Whether to publish for Japanese users';
COMMENT ON COLUMN public.announcements.publish_en IS 'Whether to publish for English users';
