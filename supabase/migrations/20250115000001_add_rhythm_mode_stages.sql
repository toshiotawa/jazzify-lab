-- Add rhythm mode sample stages
BEGIN;

-- Add rhythm mode stages
INSERT INTO fantasy_stages (
  stage_number, name, description, max_hp, enemy_count, enemy_hp, 
  min_damage, max_damage, enemy_gauge_seconds, mode, allowed_chords, 
  monster_icon, bpm, time_signature, chord_progression_data
) VALUES
-- Rhythm mode random pattern stage
(
  '3-1', 
  'リズムの森', 
  'リズムに合わせてコードを演奏しよう！',
  5, 
  10, -- enemy_count for rhythm mode (total number of chords to play)
  1,  -- enemy_hp (1 hit per chord)
  1, 
  1, 
  5.0, 
  'rhythm', 
  '["C", "F", "G", "Am", "Dm", "Em"]'::jsonb,
  'music_note',
  120,  -- BPM
  4,    -- 4/4 time signature
  NULL  -- NULL for random pattern
),
-- Another rhythm mode stage with different tempo
(
  '3-2',
  'テンポアップの渓谷',
  '速いテンポでリズムに挑戦！',
  4,
  15,
  1,
  1,
  1,
  4.0,
  'rhythm',
  '["C", "F", "G", "Am", "Dm", "Em", "G7", "C7"]'::jsonb,
  'zap',
  140,  -- Faster BPM
  4,
  NULL  -- Random pattern
);

COMMIT;