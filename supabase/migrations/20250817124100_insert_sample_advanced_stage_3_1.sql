-- Insert sample Advanced stage 3-1 into fantasy_stages
-- Created at: 2025-08-17

BEGIN;

INSERT INTO public.fantasy_stages (
  stage_number, name, description, max_hp, enemy_count, enemy_hp, min_damage, max_damage,
  enemy_gauge_seconds, mode, allowed_chords, chord_progression, show_guide, bgm_url,
  simultaneous_monster_count, play_root_on_correct, stage_tier, bpm, time_signature, measure_count, count_in_measures
) VALUES
('3-1', '虚空の回廊', '複雑な分数コードと転回形を混ぜた認識力の最終試験', 5, 3, 8, 1, 1, 3.0, 'progression_order',
  '[]'::jsonb, '["EM7", "F#m7", "G#m7", "C#7", "F#m7", "B7", "E6"]'::jsonb, false, NULL, 2, true, 'advanced', 170, 4, 8, 1)
ON CONFLICT (stage_tier, stage_number) DO NOTHING;

COMMIT;