-- Add notation_setting column to challenge_tracks table
-- This column controls the notation display mode for challenge songs

-- Add notation_setting column with default value 'both'
ALTER TABLE public.challenge_tracks 
ADD COLUMN IF NOT EXISTS notation_setting text DEFAULT 'both';

-- Update existing records to have 'both' as default if they don't have a value
UPDATE public.challenge_tracks 
SET notation_setting = 'both' 
WHERE notation_setting IS NULL;

-- Make the column NOT NULL after setting default values
ALTER TABLE public.challenge_tracks 
ALTER COLUMN notation_setting SET NOT NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.challenge_tracks.notation_setting IS 'Notation display mode: both, notes_chords, chords_only';
