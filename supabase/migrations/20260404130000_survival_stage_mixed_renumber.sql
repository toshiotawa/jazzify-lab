-- サバイバルステージに各難易度末尾の Mixed を追加したため、旧ステージ番号 11〜105 を +1/+2/+3 でシフトする。
-- 新規ステージ番号: 11 (Easy Mixed), 57 (Normal), 88 (Hard), 109 (Extreme)

DO $migration$
BEGIN
  IF to_regclass('public.survival_stage_clears') IS NOT NULL THEN
    UPDATE public.survival_stage_clears
    SET stage_number = stage_number + 3
    WHERE stage_number BETWEEN 86 AND 105;

    UPDATE public.survival_stage_clears
    SET stage_number = stage_number + 2
    WHERE stage_number BETWEEN 56 AND 85;

    UPDATE public.survival_stage_clears
    SET stage_number = stage_number + 1
    WHERE stage_number BETWEEN 11 AND 55;
  END IF;

  IF to_regclass('public.lesson_songs') IS NOT NULL THEN
    UPDATE public.lesson_songs
    SET survival_stage_number = survival_stage_number + 3
    WHERE is_survival IS TRUE
      AND survival_stage_number BETWEEN 86 AND 105;

    UPDATE public.lesson_songs
    SET survival_stage_number = survival_stage_number + 2
    WHERE is_survival IS TRUE
      AND survival_stage_number BETWEEN 56 AND 85;

    UPDATE public.lesson_songs
    SET survival_stage_number = survival_stage_number + 1
    WHERE is_survival IS TRUE
      AND survival_stage_number BETWEEN 11 AND 55;
  END IF;

  IF to_regclass('public.survival_stage_progress') IS NOT NULL THEN
    UPDATE public.survival_stage_progress
    SET current_stage_number = LEAST(
      109,
      CASE
        WHEN current_stage_number <= 10 THEN current_stage_number
        WHEN current_stage_number <= 55 THEN current_stage_number + 1
        WHEN current_stage_number <= 85 THEN current_stage_number + 2
        WHEN current_stage_number <= 105 THEN current_stage_number + 3
        ELSE current_stage_number
      END
    );
  END IF;
END
$migration$;
