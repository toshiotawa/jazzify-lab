-- Code Run 開発・検証ステージ（basic / play_mode=code_run）をレッスン専用にする。
-- 降下マップ用コースは別マイグレーションで追加予定。マップ UI からは lesson_only で非表示。
BEGIN;

UPDATE public.survival_stages
SET lesson_only = true,
    updated_at = now()
WHERE map_category = 'basic'
  AND play_mode = 'code_run'
  AND NOT lesson_only;

COMMIT;
