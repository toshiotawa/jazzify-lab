-- Add rhythm mode fields to fantasy_stages table
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS game_type VARCHAR DEFAULT 'quiz' CHECK (game_type IN ('quiz', 'rhythm')),
ADD COLUMN IF NOT EXISTS rhythm_pattern VARCHAR CHECK (rhythm_pattern IN ('random', 'progression')),
ADD COLUMN IF NOT EXISTS bpm INTEGER,
ADD COLUMN IF NOT EXISTS time_signature INTEGER CHECK (time_signature IN (3, 4)),
ADD COLUMN IF NOT EXISTS loop_measures INTEGER,
ADD COLUMN IF NOT EXISTS chord_progression_data JSONB,
ADD COLUMN IF NOT EXISTS mp3_url VARCHAR,
ADD COLUMN IF NOT EXISTS rhythm_data TEXT;

-- Add comments for documentation
COMMENT ON COLUMN fantasy_stages.game_type IS 'Game mode type: quiz (traditional) or rhythm (new rhythm-based mode)';
COMMENT ON COLUMN fantasy_stages.rhythm_pattern IS 'Rhythm sub-pattern: random (random chord selection) or progression (predefined chord progression)';
COMMENT ON COLUMN fantasy_stages.bpm IS 'Beats per minute for rhythm mode';
COMMENT ON COLUMN fantasy_stages.time_signature IS 'Time signature: 3 for 3/4 time, 4 for 4/4 time';
COMMENT ON COLUMN fantasy_stages.loop_measures IS 'Number of measures before looping back to measure 2';
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'JSON array of chord progression with timing info';
COMMENT ON COLUMN fantasy_stages.mp3_url IS 'Path to MP3 file for background music';
COMMENT ON COLUMN fantasy_stages.rhythm_data IS 'Path to rhythm data JSON file';

-- Update RLS policies to include new columns
DROP POLICY IF EXISTS "Fantasy stages are viewable by everyone" ON fantasy_stages;
CREATE POLICY "Fantasy stages are viewable by everyone"
  ON fantasy_stages FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Fantasy stages can be created by admins" ON fantasy_stages;
CREATE POLICY "Fantasy stages can be created by admins"
  ON fantasy_stages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "Fantasy stages can be updated by admins" ON fantasy_stages;
CREATE POLICY "Fantasy stages can be updated by admins"
  ON fantasy_stages FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));

DROP POLICY IF EXISTS "Fantasy stages can be deleted by admins" ON fantasy_stages;
CREATE POLICY "Fantasy stages can be deleted by admins"
  ON fantasy_stages FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.is_admin = true
  ));