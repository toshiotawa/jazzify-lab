-- Fブルース 2音・3音ヴォイシング（コードラン）: 本番ヒントを 15秒フェードアウトへ

UPDATE public.survival_stages
SET
  production_staff_hint_mode = 'fade_15s',
  production_keyboard_hint_mode = 'fade_15s',
  updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number IN (1301, 1311)
  AND play_mode = 'code_run';

UPDATE public.lesson_songs
SET
  override_production_staff_hint_mode = 'fade_15s',
  override_production_keyboard_hint_mode = 'fade_15s'
WHERE survival_map_category = 'lesson'
  AND survival_stage_number IN (1301, 1311)
  AND title IN ('2-1. コードラン（2音）', '3-3. コードラン（3音）');
