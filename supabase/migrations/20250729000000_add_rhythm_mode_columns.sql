-- Add rhythm mode columns to fantasy_stages table

-- Add play_mode column (quiz or rhythm)
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS play_mode VARCHAR(10) NOT NULL DEFAULT 'quiz'
CHECK (play_mode IN ('quiz', 'rhythm'));

-- Add time_signature column (3 or 4)
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS time_signature INTEGER NOT NULL DEFAULT 4
CHECK (time_signature IN (3, 4));

-- Add pattern_type column for rhythm mode (random or progression)
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS pattern_type VARCHAR(20)
CHECK (pattern_type IN ('random', 'progression'));

-- Add simultaneous_monster_count column
ALTER TABLE fantasy_stages 
ADD COLUMN IF NOT EXISTS simultaneous_monster_count INTEGER NOT NULL DEFAULT 1
CHECK (simultaneous_monster_count >= 1 AND simultaneous_monster_count <= 8);

-- Note: If you need to convert JSONB to TEXT[], you may need to do it in steps
-- For now, we'll skip the type conversion if the columns are already JSONB
-- You can manually convert the data later if needed

-- Check if columns need to be converted (commented out for safety)
-- If your allowed_chords and chord_progression are already TEXT[], you can skip this section
-- If they are JSONB and you need to convert them, you'll need to:
-- 1. Create new temporary columns
-- 2. Copy and transform the data
-- 3. Drop the old columns
-- 4. Rename the new columns

-- For now, let's assume the columns can work with both JSONB and TEXT[]

-- Add comment for new columns
COMMENT ON COLUMN fantasy_stages.play_mode IS 'Game mode: quiz (traditional) or rhythm (new rhythm mode)';
COMMENT ON COLUMN fantasy_stages.time_signature IS 'Time signature for rhythm mode: 3 or 4';
COMMENT ON COLUMN fantasy_stages.pattern_type IS 'Pattern type for rhythm mode: random or progression';
COMMENT ON COLUMN fantasy_stages.simultaneous_monster_count IS 'Number of monsters displayed simultaneously (1-8)';

-- Create index for play_mode for efficient filtering
CREATE INDEX IF NOT EXISTS idx_fantasy_stages_play_mode ON fantasy_stages(play_mode);

-- Insert sample rhythm mode stages for testing
INSERT INTO fantasy_stages (
    stage_number, name, description, max_hp, enemy_count, enemy_hp, 
    min_damage, max_damage, enemy_gauge_seconds, mode, allowed_chords, 
    chord_progression, show_sheet_music, show_guide, monster_icon, 
    bgm_url, play_mode, time_signature, pattern_type, simultaneous_monster_count
) VALUES 
-- Rhythm mode - Random pattern
(
    'R-1', 'Rhythm Basics', 'Learn the rhythm of basic chords', 
    5, 1, 100, 20, 30, 0, 'single', 
    '["C","F","G","Am","Dm","Em"]'::jsonb, 
    NULL, false, true, '🎵', 
    '/sounds/demo1.mp3', 'rhythm', 4, 'random', 1
),
-- Rhythm mode - Progression pattern (4/4 time)
(
    'R-2', 'Chord Progression', 'Master the classic progression', 
    5, 4, 80, 15, 25, 0, 'progression', 
    '["C","Am","F","G"]'::jsonb, 
    '["C","Am","F","G","C","Am","F","G"]'::jsonb, 
    false, true, '🎹', 
    '/sounds/demo1.mp3', 'rhythm', 4, 'progression', 4
),
-- Rhythm mode - Progression pattern (3/4 time)
(
    'R-3', 'Waltz Time', '3/4 time signature challenge', 
    5, 3, 90, 18, 28, 0, 'progression', 
    '["C","F","G"]'::jsonb, 
    '["C","F","G","C","G","F"]'::jsonb, 
    false, false, '🎼', 
    '/sounds/demo1.mp3', 'rhythm', 3, 'progression', 3
)
ON CONFLICT (stage_number) DO NOTHING;