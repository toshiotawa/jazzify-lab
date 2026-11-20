-- Phrase Defense (note trigger, Lv.7-10): BPM 120 call/response pace balance.
-- Slower spawns, tuned speed for 120 BPM 1-bar phrase loops; higher tiers unchanged.

UPDATE public.defense_difficulty_levels
SET
  enemy_hp = CASE level
    WHEN 7 THEN 4
    WHEN 8 THEN 4
    WHEN 9 THEN 5
    WHEN 10 THEN 6
  END,
  spawn_interval_sec = CASE level
    WHEN 7 THEN 2.4
    WHEN 8 THEN 2.05
    WHEN 9 THEN 2.0
    WHEN 10 THEN 1.95
  END,
  max_enemies = CASE level
    WHEN 7 THEN 8
    WHEN 8 THEN 9
    WHEN 9 THEN 10
    WHEN 10 THEN 10
  END,
  enemy_speed_px_per_sec = CASE level
    WHEN 7 THEN 36
    WHEN 8 THEN 39
    WHEN 9 THEN 42
    WHEN 10 THEN 45
  END,
  enemy_damage = CASE level
    WHEN 7 THEN 2
    WHEN 8 THEN 3
    WHEN 9 THEN 3
    WHEN 10 THEN 3
  END,
  attack_interval_sec = CASE level
    WHEN 7 THEN 1.8
    WHEN 8 THEN 1.6
    WHEN 9 THEN 1.4
    WHEN 10 THEN 1.2
  END,
  attack_range_px = CASE level
    WHEN 7 THEN 54
    WHEN 8 THEN 54
    WHEN 9 THEN 56
    WHEN 10 THEN 56
  END
WHERE attack_trigger = 'note'
  AND level BETWEEN 7 AND 10;