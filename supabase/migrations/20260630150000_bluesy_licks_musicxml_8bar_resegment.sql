-- Bluesy Licks: 8小節×4ループ（フレーズ8のみ12小節）への区切り直しに伴う combat 値復元（フレーズ3–6）
-- 音源 URL は変更不要（R2 上の .musicxml ファイル内容のみ差し替え）
BEGIN;

UPDATE public.ear_training_stages SET
  enemy_hp = 86,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-3-slow', 'bl-stage-3-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 77,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-4-slow', 'bl-stage-4-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 82,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-5-slow', 'bl-stage-5-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 91,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-6-slow', 'bl-stage-6-normal');

COMMIT;
