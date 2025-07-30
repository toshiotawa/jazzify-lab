-- Migration: Add rhythm mode fields to fantasy_stages table
-- This migration adds support for rhythm type gameplay in fantasy mode

-- Add game_type column (quiz or rhythm)
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS game_type VARCHAR DEFAULT 'quiz' CHECK (game_type IN ('quiz', 'rhythm'));

-- Add rhythm_pattern column (random or progression)
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS rhythm_pattern VARCHAR CHECK (rhythm_pattern IN ('random', 'progression'));

-- Add BPM (beats per minute) for rhythm timing
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS bpm INTEGER;

-- Add time signature (3 or 4)
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS time_signature INTEGER CHECK (time_signature IN (3, 4));

-- Add loop_measures (number of measures before looping back to measure 2)
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS loop_measures INTEGER;

-- Add chord_progression_data (JSON array for progression pattern)
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS chord_progression_data JSONB;

-- Add mp3_url for the music file
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS mp3_url VARCHAR;

-- Add rhythm_data for timing information JSON file path
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS rhythm_data TEXT;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_fantasy_stages_game_type ON fantasy_stages(game_type);
CREATE INDEX IF NOT EXISTS idx_fantasy_stages_rhythm_pattern ON fantasy_stages(rhythm_pattern);

-- Update RLS policies to include new columns
-- (RLS policies don't need updating as they apply to whole rows)

-- Add comment on table to document the new fields
COMMENT ON COLUMN fantasy_stages.game_type IS 'Game mode type: quiz (traditional) or rhythm (new rhythm-based gameplay)';
COMMENT ON COLUMN fantasy_stages.rhythm_pattern IS 'Rhythm sub-pattern: random (random chords) or progression (predefined chord sequence)';
COMMENT ON COLUMN fantasy_stages.bpm IS 'Beats per minute for rhythm mode';
COMMENT ON COLUMN fantasy_stages.time_signature IS 'Time signature: 3 (3/4 time) or 4 (4/4 time)';
COMMENT ON COLUMN fantasy_stages.loop_measures IS 'Number of measures before looping back to measure 2';
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'JSON array of chord progression data with timing information';
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'Path to MP3 file for rhythm mode';
COMMENT ON COLUMN fantasy_stages.rhythm_data IS 'Path to JSON file containing rhythm timing data';