-- Fブルース コードラン（2音・3音）: BGM をドラムループ、マップをコードラン初級の最初（snow_run_01）へ
UPDATE public.survival_stages
SET
  run_map_id = 'snow_run_01',
  updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number IN (1301, 1311)
  AND play_mode = 'code_run';

UPDATE public.lesson_songs
SET survival_lesson_overrides = COALESCE(survival_lesson_overrides, '{}'::jsonb)
  || '{"bgmUrl":"https://jazzify-cdn.com/fantasy-bgm/survival-composite-phrases-drums160-loop.mp3"}'::jsonb
WHERE is_survival = true
  AND survival_map_category = 'lesson'
  AND survival_stage_number IN (1301, 1311);
