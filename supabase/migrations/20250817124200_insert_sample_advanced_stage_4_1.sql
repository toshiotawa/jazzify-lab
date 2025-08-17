-- Insert sample Advanced stage 4-1 into fantasy_stages
-- Created at: 2025-08-17

BEGIN;

INSERT INTO public.fantasy_stages (
  stage_number, name, description, max_hp, enemy_count, enemy_hp, min_damage, max_damage,
  enemy_gauge_seconds, mode, allowed_chords, chord_progression, show_guide, bgm_url,
  simultaneous_monster_count, play_root_on_correct, stage_tier, bpm, time_signature, measure_count, count_in_measures
) VALUES
('4-1', '天輪の門', 'テンションを含む循環進行で正解を刻む耐久', 5, 3, 9, 1, 1, 2.8, 'progression_random',
  '["Dm7", "G7", "CM7", "Am7", "Bm7b5", "E7"]'::jsonb, '[]'::jsonb, false, NULL, 2, true, 'advanced', 180, 4, 8, 0)
ON CONFLICT (stage_tier, stage_number) DO NOTHING;

COMMIT;