-- Major II-V-I Bebop Licks: OSMD バトルの HP / 与ダメ調整
-- player_hp=30, per_correct_note_damage=50, enemy_hp=targetCount*100（2周分）

BEGIN;

-- Stage 1: 62 targets → enemy_hp 6200
UPDATE public.ear_training_stages
SET
  player_hp = 30,
  per_correct_note_damage = 50,
  enemy_hp = 6200,
  updated_at = now()
WHERE slug LIKE 'm251-s1-st1-%-osmd'
  AND mode = 'chord_osmd';

-- Stage 2: 64 targets → enemy_hp 6400
UPDATE public.ear_training_stages
SET
  player_hp = 30,
  per_correct_note_damage = 50,
  enemy_hp = 6400,
  updated_at = now()
WHERE slug LIKE 'm251-s1-st2-%-osmd'
  AND mode = 'chord_osmd';

-- Stage 3: 72 targets → enemy_hp 7200
UPDATE public.ear_training_stages
SET
  player_hp = 30,
  per_correct_note_damage = 50,
  enemy_hp = 7200,
  updated_at = now()
WHERE slug LIKE 'm251-s1-st3-%-osmd'
  AND mode = 'chord_osmd';

-- 精密モードもプレイヤー HP を揃える（与ダメは 0 のまま）
UPDATE public.ear_training_stages
SET
  player_hp = 30,
  updated_at = now()
WHERE slug LIKE 'm251-s1-%-precision'
  AND mode = 'chord_precision';

COMMIT;
