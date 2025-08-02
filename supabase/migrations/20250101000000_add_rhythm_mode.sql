-- Add chord_progression_data column for rhythm mode
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS chord_progression_data JSONB DEFAULT NULL;

-- Update column comment
COMMENT ON COLUMN fantasy_stages.chord_progression_data IS 'リズムモード用のコード進行データ (JSON形式)';

-- Existing mode values remain the same ('single', 'progression')
-- These will be used in combination with the game logic to determine behavior:
-- - Quiz mode: Uses mode field normally
-- - Rhythm mode (random): mode='single' and chord_progression_data IS NULL
-- - Rhythm mode (progression): mode='progression' and chord_progression_data IS NOT NULL