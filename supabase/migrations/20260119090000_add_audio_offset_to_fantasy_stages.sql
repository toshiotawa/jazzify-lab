-- ================================================
-- Add audio_offset column to fantasy_stages table
-- ================================================
-- This column allows specifying an offset (in seconds) to synchronize
-- notes generated from MusicXML with the actual audio file.
--
-- Positive values: Audio's Measure 1 starts later than MusicXML expects
--                  (notes will be shifted forward in time)
-- Negative values: Audio's Measure 1 starts earlier than MusicXML expects
--                  (notes will be shifted backward in time)
-- Zero (default): No offset applied
-- ================================================

-- Add audio_offset column to fantasy_stages table
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS audio_offset NUMERIC DEFAULT 0;

-- Add comment to explain the column
COMMENT ON COLUMN fantasy_stages.audio_offset IS 
'Audio offset in seconds to synchronize MusicXML notes with audio playback. Positive = audio starts later, Negative = audio starts earlier.';
