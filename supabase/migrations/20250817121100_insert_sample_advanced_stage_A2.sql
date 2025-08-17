-- Insert sample Advanced stage A-2 into fantasy_stages
-- Created at: 2025-08-17

BEGIN;

INSERT INTO public.fantasy_stages (
  stage_number, name, description, max_hp, enemy_count, enemy_hp, min_damage, max_damage,
  enemy_gauge_seconds, mode, allowed_chords, chord_progression, show_guide, bgm_url,
  simultaneous_monster_count, play_root_on_correct, stage_tier, bpm, time_signature, measure_count, count_in_measures
) VALUES
('A-2', '星落つる塔', 'ii-V-Iを高テンポで。ミス許容量が少ない', 4, 3, 6, 1, 1, 3.2, 'progression_order',
  '[]'::jsonb, '["Dm7", "G7", "CM7", "Am7", "Dm7", "G7", "CM7"]'::jsonb, false, NULL, 2, true, 'advanced', 160, 4, 8, 1)
ON CONFLICT (stage_number) DO NOTHING;

COMMIT;