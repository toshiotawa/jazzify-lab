-- First, update the mode constraint to include 'rhythm'
ALTER TABLE fantasy_stages DROP CONSTRAINT IF EXISTS fantasy_stages_mode_check;
ALTER TABLE fantasy_stages ADD CONSTRAINT fantasy_stages_mode_check CHECK (mode IN ('single', 'progression', 'rhythm'));

-- Add new columns for rhythm mode
ALTER TABLE fantasy_stages ADD COLUMN IF NOT EXISTS rhythm_mode TEXT CHECK (rhythm_mode IN ('random', 'progression'));
ALTER TABLE fantasy_stages ADD COLUMN IF NOT EXISTS bpm INTEGER DEFAULT 120;
ALTER TABLE fantasy_stages ADD COLUMN IF NOT EXISTS measure_count INTEGER DEFAULT 8;
ALTER TABLE fantasy_stages ADD COLUMN IF NOT EXISTS time_signature INTEGER DEFAULT 4;
ALTER TABLE fantasy_stages ADD COLUMN IF NOT EXISTS count_in_measures INTEGER DEFAULT 0;
ALTER TABLE fantasy_stages ADD COLUMN IF NOT EXISTS chord_progression_data JSONB;

-- Add sample rhythm mode stages
INSERT INTO fantasy_stages (
  stage_number, 
  name, 
  description, 
  max_hp, 
  enemy_gauge_seconds, 
  enemy_count, 
  enemy_hp, 
  min_damage, 
  max_damage, 
  mode, 
  rhythm_mode,
  allowed_chords, 
  show_sheet_music, 
  show_guide, 
  bgm_url, 
  bpm, 
  measure_count, 
  time_signature, 
  count_in_measures,
  chord_progression_data
) VALUES
(
  'R-1',
  'リズムチャレンジ - ランダム',
  'ランダムなコードがリズムに乗って流れてきます！タイミングよく弾いて敵を倒そう！',
  5,
  10,
  10,
  3,
  1,
  2,
  'rhythm',
  'random',
  '["C", "F", "G", "Am", "Em", "Dm"]'::jsonb,
  false,
  true,
  'https://example.com/bgm/rhythm1.mp3',
  120,
  8,
  4,
  2,
  NULL
),
(
  'R-2',
  'リズムチャレンジ - 進行',
  'コード進行に沿ってノーツが流れてきます！正確なタイミングで演奏しよう！',
  5,
  10,
  15,
  4,
  1,
  2,
  'rhythm',
  'progression',
  '["C", "Am", "F", "G"]'::jsonb,
  false,
  true,
  'https://example.com/bgm/rhythm2.mp3',
  100,
  8,
  4,
  2,
  '[
    {"measure": 1, "beat": 1, "chord": "C"},
    {"measure": 2, "beat": 1, "chord": "C"},
    {"measure": 3, "beat": 1, "chord": "F"},
    {"measure": 4, "beat": 1, "chord": "F"},
    {"measure": 5, "beat": 1, "chord": "C"},
    {"measure": 6, "beat": 1, "chord": "C"},
    {"measure": 7, "beat": 1, "chord": "G"},
    {"measure": 7, "beat": 3, "chord": "F"},
    {"measure": 8, "beat": 1, "chord": "C"}
  ]'::jsonb
);