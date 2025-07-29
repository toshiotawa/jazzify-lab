-- Add rhythm mode columns to fantasy_stages table
ALTER TABLE fantasy_stages
  ADD COLUMN game_type VARCHAR(10) DEFAULT 'quiz' CHECK (game_type IN ('quiz', 'rhythm')),
  ADD COLUMN rhythm_pattern VARCHAR(20) CHECK (rhythm_pattern IN ('random', 'progression') OR rhythm_pattern IS NULL),
  ADD COLUMN bpm INTEGER DEFAULT 120,
  ADD COLUMN time_signature INTEGER DEFAULT 4 CHECK (time_signature IN (3, 4)),
  ADD COLUMN loop_measures INTEGER DEFAULT 8,
  ADD COLUMN chord_progression_data JSONB,
  ADD COLUMN mp3_url VARCHAR(255) DEFAULT '/demo-1.mp3';

-- Update existing data to set game_type as 'quiz'
UPDATE fantasy_stages SET game_type = 'quiz' WHERE game_type IS NULL;

-- Make game_type NOT NULL after setting defaults
ALTER TABLE fantasy_stages ALTER COLUMN game_type SET NOT NULL;

-- Add sample rhythm type stages
INSERT INTO fantasy_stages (
  stage_number, name, description, max_hp, enemy_count, enemy_hp,
  min_damage, max_damage, enemy_gauge_seconds, mode, allowed_chords,
  monster_icon, show_sheet_music, show_guide, game_type, rhythm_pattern,
  bpm, time_signature, loop_measures, chord_progression_data
) VALUES
-- Rhythm type (random pattern)
('R-1', 'リズムの洞窟', 'リズムに合わせてコードを演奏しよう！', 5, 10, 1,
 1, 1, 4.0, 'single', '["C", "G", "Am", "F"]'::jsonb,
 'fa-drum', true, true, 'rhythm', 'random', 120, 4, 8, NULL),

-- Rhythm type (progression pattern)
('R-2', 'ハーモニーの神殿', '定番進行をマスターしよう！', 5, 16, 1,
 1, 1, 4.0, 'progression', '["C", "G", "Am", "F"]'::jsonb,
 'fa-music', true, true, 'rhythm', 'progression', 120, 4, 8,
 '{
   "chords": [
     {"chord": "C", "measure": 1, "beat": 1.0},
     {"chord": "G", "measure": 2, "beat": 1.0},
     {"chord": "Am", "measure": 3, "beat": 1.0},
     {"chord": "F", "measure": 4, "beat": 1.0},
     {"chord": "C", "measure": 5, "beat": 1.0},
     {"chord": "Am", "measure": 6, "beat": 1.0},
     {"chord": "Dm", "measure": 7, "beat": 1.0},
     {"chord": "G", "measure": 8, "beat": 1.0}
   ]
 }'::jsonb);