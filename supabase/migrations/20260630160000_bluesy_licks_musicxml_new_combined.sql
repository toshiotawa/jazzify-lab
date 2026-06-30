-- Bluesy Licks: Bluesy Licks new.musicxml を正とした MusicXML 再生成に伴う combat 値更新
-- 音源 URL は変更不要（R2 上の .musicxml ファイル内容のみ差し替え）
BEGIN;

UPDATE public.ear_training_stages SET
  enemy_hp = 76,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-1-slow', 'bl-stage-1-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 103,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-2-slow', 'bl-stage-2-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 88,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-3-slow', 'bl-stage-3-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 86,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-4-slow', 'bl-stage-4-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 77,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-5-slow', 'bl-stage-5-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 82,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-6-slow', 'bl-stage-6-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 88,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-7-slow', 'bl-stage-7-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 109,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-8-slow', 'bl-stage-8-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 85,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-9-slow', 'bl-stage-9-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 115,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-10-slow', 'bl-stage-10-normal');

UPDATE public.ear_training_stages SET
  enemy_hp = 92,
  per_correct_note_damage = 1,
  good_completion_damage = 12,
  great_completion_damage = 21,
  perfect_completion_damage = 35,
  updated_at = now()
WHERE slug IN ('bl-stage-11-slow', 'bl-stage-11-normal');

COMMIT;
