-- Bluesy Licks: 被ダメージを有効化（約30発でゲームオーバー）
UPDATE public.ear_training_stages
SET
  miss_damage = 3,
  fail_damage = 10,
  updated_at = now()
WHERE slug LIKE 'bl-stage-%'
  AND mode = 'chord_osmd';
