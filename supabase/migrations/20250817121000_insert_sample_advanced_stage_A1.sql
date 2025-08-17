-- Insert sample Advanced stage 1-1 into fantasy_stages
-- Created at: 2025-08-17

BEGIN;

INSERT INTO public.fantasy_stages (
  stage_number, name, description, max_hp, enemy_count, enemy_hp, min_damage, max_damage,
  enemy_gauge_seconds, mode, allowed_chords, chord_progression, show_guide, bgm_url,
  simultaneous_monster_count, play_root_on_correct, stage_tier, bpm, time_signature, measure_count, count_in_measures
) VALUES
('1-1', '深淵への門', 'テンション系コード中心の高難度ステージ', 5, 3, 6, 1, 1, 3.5, 'single',
  '["CM7", "Dm7", "G7", "C9", "Cm9", "F13"]'::jsonb, '[]'::jsonb, false, NULL, 2, true, 'advanced', 140, 4, 8, 0)
ON CONFLICT (stage_tier, stage_number) DO NOTHING;

COMMIT;