-- Major II-V-I Bebop Licks: player_hp=150（miss_damage=5 × 30回で負け）

BEGIN;

UPDATE public.ear_training_stages
SET
  player_hp = 150,
  updated_at = now()
WHERE slug LIKE 'm251-s1-%'
  AND mode IN ('chord_osmd', 'chord_precision');

COMMIT;
