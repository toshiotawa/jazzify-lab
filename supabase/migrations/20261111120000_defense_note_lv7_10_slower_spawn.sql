-- Phrase Defense map combat (note trigger, Lv.7-10): half speed, twice the spawn rate.
-- measure trigger and Lv.15 lesson stages are unchanged.

UPDATE public.defense_difficulty_levels
SET
  enemy_speed_px_per_sec = CASE level
    WHEN 7 THEN 38
    WHEN 8 THEN 41
    WHEN 9 THEN 43
    WHEN 10 THEN 45
  END,
  spawn_interval_sec = CASE level
    WHEN 7 THEN 1.5
    WHEN 8 THEN 1.25
    WHEN 9 THEN 1.3
    WHEN 10 THEN 1.3
  END
WHERE attack_trigger = 'note'
  AND level BETWEEN 7 AND 10;
