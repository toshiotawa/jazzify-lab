-- Temporary compat shim for iOS 1.3.9: PostgREST needs lesson_songs.song_id -> songs.id FK.
-- Empty songs table is sufficient; current quest lesson_songs rows use song_id = NULL.
-- Drop again after iOS 1.4.0+ adoption (see drop_legend_songs).

BEGIN;

CREATE TABLE IF NOT EXISTS public.songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  artist text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_songs
  ADD COLUMN IF NOT EXISTS song_id uuid;

ALTER TABLE public.lesson_songs
  DROP CONSTRAINT IF EXISTS lesson_songs_song_id_fkey;

ALTER TABLE public.lesson_songs
  ADD CONSTRAINT lesson_songs_song_id_fkey
  FOREIGN KEY (song_id) REFERENCES public.songs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_lesson_songs_song_id ON public.lesson_songs(song_id);

ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS songs_public_read ON public.songs;
CREATE POLICY songs_public_read ON public.songs FOR SELECT USING (true);

COMMIT;
