-- 勇者のレベル10ごとボーナスに DEF +1 を追加

BEGIN;

UPDATE public.survival_characters AS sc
SET
  level_10_bonuses = COALESCE(
    (
      SELECT jsonb_agg(merged.item)
      FROM (
        SELECT value AS item
        FROM jsonb_array_elements(COALESCE(sc.level_10_bonuses, '[]'::jsonb))
        WHERE value->>'type' <> 'def'
        UNION ALL
        SELECT jsonb_build_object('type', 'def', 'value', 1)
      ) AS merged
    ),
    '[]'::jsonb
  ),
  updated_at = now()
WHERE sc.name = '勇者' OR sc.name_en = 'Hero';

COMMIT;
