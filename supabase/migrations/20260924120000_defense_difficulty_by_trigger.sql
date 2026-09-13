-- Defense difficulty presets split by attack_trigger (note = phrase type, measure = chord type)
BEGIN;

ALTER TABLE public.defense_stages
  DROP CONSTRAINT IF EXISTS defense_stages_difficulty_level_fkey;

ALTER TABLE public.defense_stages
  ADD CONSTRAINT defense_stages_difficulty_level_check
  CHECK (difficulty_level >= 1 AND difficulty_level <= 10);

ALTER TABLE public.defense_difficulty_levels
  ADD COLUMN IF NOT EXISTS attack_trigger text NOT NULL DEFAULT 'note'
    CHECK (attack_trigger IN ('note', 'measure'));

ALTER TABLE public.defense_difficulty_levels
  DROP CONSTRAINT IF EXISTS defense_difficulty_levels_pkey;

ALTER TABLE public.defense_difficulty_levels
  ADD PRIMARY KEY (attack_trigger, level);

COMMENT ON COLUMN public.defense_difficulty_levels.attack_trigger IS
  'note = phrase type (each pitch slashes), measure = chord type (measure complete slashes).';

-- Phrase type (note): tuned for 50 BPM quarter notes (Lv1) → 140 BPM eighth notes (Lv10)
INSERT INTO public.defense_difficulty_levels (
  attack_trigger, level, enemy_hp, spawn_interval_sec, max_enemies,
  enemy_speed_px_per_sec, enemy_damage, attack_interval_sec, attack_range_px
) VALUES
  ('note', 1, 1, 2.4, 4, 40, 1, 3.0, 48),
  ('note', 2, 1, 2.0, 4, 46, 1, 2.8, 48),
  ('note', 3, 2, 3.3, 5, 52, 1, 2.6, 50),
  ('note', 4, 2, 2.7, 5, 58, 2, 2.4, 50),
  ('note', 5, 3, 3.4, 6, 64, 2, 2.2, 52),
  ('note', 6, 3, 2.8, 7, 70, 2, 2.0, 52),
  ('note', 7, 4, 3.0, 8, 76, 2, 1.8, 54),
  ('note', 8, 4, 2.5, 9, 82, 3, 1.6, 54),
  ('note', 9, 5, 2.6, 10, 86, 3, 1.4, 56),
  ('note', 10, 6, 2.6, 10, 90, 3, 1.2, 56)
ON CONFLICT (attack_trigger, level) DO UPDATE SET
  enemy_hp = EXCLUDED.enemy_hp,
  spawn_interval_sec = EXCLUDED.spawn_interval_sec,
  max_enemies = EXCLUDED.max_enemies,
  enemy_speed_px_per_sec = EXCLUDED.enemy_speed_px_per_sec,
  enemy_damage = EXCLUDED.enemy_damage,
  attack_interval_sec = EXCLUDED.attack_interval_sec,
  attack_range_px = EXCLUDED.attack_range_px;

-- Chord type (measure): tuned for ~5s per slash (Lv1) → ~1s per slash (Lv10)
INSERT INTO public.defense_difficulty_levels (
  attack_trigger, level, enemy_hp, spawn_interval_sec, max_enemies,
  enemy_speed_px_per_sec, enemy_damage, attack_interval_sec, attack_range_px
) VALUES
  ('measure', 1, 1, 8.0, 3, 36, 1, 3.0, 48),
  ('measure', 2, 1, 7.0, 3, 40, 1, 2.8, 48),
  ('measure', 3, 1, 6.0, 4, 44, 1, 2.6, 50),
  ('measure', 4, 1, 5.0, 4, 48, 1, 2.4, 50),
  ('measure', 5, 1, 4.2, 5, 52, 1, 2.2, 52),
  ('measure', 6, 1, 3.5, 5, 56, 2, 2.0, 52),
  ('measure', 7, 1, 3.0, 6, 60, 2, 1.8, 54),
  ('measure', 8, 2, 5.0, 6, 64, 2, 1.6, 54),
  ('measure', 9, 2, 4.1, 7, 68, 3, 1.4, 56),
  ('measure', 10, 2, 3.5, 8, 72, 3, 1.2, 56)
ON CONFLICT (attack_trigger, level) DO UPDATE SET
  enemy_hp = EXCLUDED.enemy_hp,
  spawn_interval_sec = EXCLUDED.spawn_interval_sec,
  max_enemies = EXCLUDED.max_enemies,
  enemy_speed_px_per_sec = EXCLUDED.enemy_speed_px_per_sec,
  enemy_damage = EXCLUDED.enemy_damage,
  attack_interval_sec = EXCLUDED.attack_interval_sec,
  attack_range_px = EXCLUDED.attack_range_px;

COMMIT;
