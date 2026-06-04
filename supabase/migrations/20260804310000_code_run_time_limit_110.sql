-- Code Run: 制限時間 1:50 (110秒) に統一
BEGIN;

UPDATE public.survival_stages
SET run_time_limit_sec = 110,
    updated_at = now()
WHERE play_mode = 'code_run';

COMMIT;
