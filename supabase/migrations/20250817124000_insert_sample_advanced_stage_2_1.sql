-- Insert sample Advanced stage 2-1 into fantasy_stages
-- Created at: 2025-08-17

BEGIN;

INSERT INTO public.fantasy_stages (
  stage_number, name, description, max_hp, enemy_count, enemy_hp, min_damage, max_damage,
  enemy_gauge_seconds, mode, allowed_chords, chord_progression, show_guide, bgm_url,
  simultaneous_monster_count, play_root_on_correct, stage_tier, bpm, time_signature, measure_count, count_in_measures
) VALUES
('2-1', '黒曜の稜線', '拡張テンションと分散配置で高難易度の識別を要求', 5, 3, 7, 1, 1, 3.2, 'single',
  '["C9", "Fm9", "E7#9", "A13", "G13", "Bm7b5"]'::jsonb, '[]'::jsonb, false, NULL, 2, true, 'advanced', 150, 4, 8, 0)
ON CONFLICT (stage_tier, stage_number) DO NOTHING;

COMMIT;