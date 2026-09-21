-- Extend Phrase Defense combat presets to Lv15 with faster spawn intervals on Lv11–15
BEGIN;

ALTER TABLE public.defense_difficulty_levels
  DROP CONSTRAINT IF EXISTS defense_difficulty_levels_level_check;

ALTER TABLE public.defense_difficulty_levels
  ADD CONSTRAINT defense_difficulty_levels_level_check
  CHECK (level >= 1 AND level <= 15);

ALTER TABLE public.defense_stages
  DROP CONSTRAINT IF EXISTS defense_stages_difficulty_level_check;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_difficulty_level_check
  CHECK (difficulty_level >= 1 AND difficulty_level <= 15);

ALTER TABLE public.play_map_nodes
  DROP CONSTRAINT IF EXISTS play_map_nodes_difficulty_level_check;

ALTER TABLE public.play_map_nodes
  ADD CONSTRAINT play_map_nodes_difficulty_level_check
  CHECK (difficulty_level IS NULL OR (difficulty_level >= 1 AND difficulty_level <= 15));

COMMENT ON TABLE public.defense_difficulty_levels IS 'Defense mode difficulty presets (15 levels).';

-- Phrase type (note): faster spawn on Lv11–15
INSERT INTO public.defense_difficulty_levels (
  attack_trigger, level, enemy_hp, spawn_interval_sec, max_enemies,
  enemy_speed_px_per_sec, enemy_damage, attack_interval_sec, attack_range_px
) VALUES
  ('note', 11, 6, 2.2, 11, 94, 3, 1.1, 56),
  ('note', 12, 7, 1.9, 12, 98, 3, 1.0, 56),
  ('note', 13, 7, 1.7, 12, 102, 3, 0.95, 58),
  ('note', 14, 8, 1.5, 13, 106, 3, 0.9, 58),
  ('note', 15, 8, 1.3, 14, 110, 3, 0.85, 58)
ON CONFLICT (attack_trigger, level) DO UPDATE SET
  enemy_hp = EXCLUDED.enemy_hp,
  spawn_interval_sec = EXCLUDED.spawn_interval_sec,
  max_enemies = EXCLUDED.max_enemies,
  enemy_speed_px_per_sec = EXCLUDED.enemy_speed_px_per_sec,
  enemy_damage = EXCLUDED.enemy_damage,
  attack_interval_sec = EXCLUDED.attack_interval_sec,
  attack_range_px = EXCLUDED.attack_range_px;

-- Chord type (measure): faster spawn on Lv11–15
INSERT INTO public.defense_difficulty_levels (
  attack_trigger, level, enemy_hp, spawn_interval_sec, max_enemies,
  enemy_speed_px_per_sec, enemy_damage, attack_interval_sec, attack_range_px
) VALUES
  ('measure', 11, 2, 3.0, 8, 76, 3, 1.1, 56),
  ('measure', 12, 2, 2.6, 9, 80, 3, 1.0, 56),
  ('measure', 13, 3, 2.3, 9, 84, 3, 0.95, 58),
  ('measure', 14, 3, 2.0, 10, 88, 3, 0.9, 58),
  ('measure', 15, 3, 1.7, 10, 92, 3, 0.85, 58)
ON CONFLICT (attack_trigger, level) DO UPDATE SET
  enemy_hp = EXCLUDED.enemy_hp,
  spawn_interval_sec = EXCLUDED.spawn_interval_sec,
  max_enemies = EXCLUDED.max_enemies,
  enemy_speed_px_per_sec = EXCLUDED.enemy_speed_px_per_sec,
  enemy_damage = EXCLUDED.enemy_damage,
  attack_interval_sec = EXCLUDED.attack_interval_sec,
  attack_range_px = EXCLUDED.attack_range_px;

-- Developer test course: all defense stages to Lv15
UPDATE public.defense_stages ds
SET difficulty_level = 15
FROM public.lesson_songs ls
JOIN public.lessons l ON l.id = ls.lesson_id
WHERE ls.defense_stage_id = ds.id
  AND COALESCE(ls.is_defense, false) = true
  AND l.course_id = uuid_generate_v5(
    'a0000000-0000-4000-8000-000000000001'::uuid,
    'course-developer-test'
  );

COMMIT;
