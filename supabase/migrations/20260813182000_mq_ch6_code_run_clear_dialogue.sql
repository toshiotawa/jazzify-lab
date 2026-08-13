-- Fブルース コードラン（2音・3音）: プレイ中セリフ台本を削除

UPDATE public.survival_stages
SET run_dialogue_script = NULL, updated_at = now()
WHERE map_category = 'lesson'
  AND stage_number IN (1301, 1311)
  AND play_mode = 'code_run';
