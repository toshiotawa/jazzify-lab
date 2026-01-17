-- Add music_xml column to fantasy_stages for OSMD sheet music display
-- This stores the original MusicXML data for accurate notation rendering

ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS music_xml TEXT;

COMMENT ON COLUMN fantasy_stages.music_xml IS 'Original MusicXML data for OSMD sheet music display in Progression_Timing mode';
