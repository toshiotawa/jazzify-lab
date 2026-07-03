ALTER TABLE public.ear_training_stages
  ADD COLUMN IF NOT EXISTS show_score_lyrics_in_battle boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.ear_training_stages.show_score_lyrics_in_battle IS
  'Precision/OSMD battle: when true, render OSMD native lyrics on the score. Default false keeps lyrics only in the notes text overlay.';
