-- リラの魔法寄り調整とジャ爺のレベル10ボーナス調整

BEGIN;

-- リラ:
-- 1) 初期RELOAD短縮を +5 に変更
-- 2) 近接系ボーナスを除外（B列魔法化に合わせる）
UPDATE public.survival_characters AS sc
SET
  initial_stats = jsonb_set(
    COALESCE(sc.initial_stats, '{}'::jsonb),
    '{reloadMagic}',
    to_jsonb(5),
    true
  ),
  excluded_bonuses = (
    SELECT COALESCE(jsonb_agg(DISTINCT t.bonus), '[]'::jsonb)
    FROM jsonb_array_elements_text(
      COALESCE(sc.excluded_bonuses, '[]'::jsonb)
      || '["b_atk","b_knockback","b_range","b_deflect"]'::jsonb
    ) AS t(bonus)
  ),
  updated_at = now()
WHERE sc.name = 'リラ' OR sc.name_en = 'Lira';

-- ジャ爺:
-- レベル10ごとのボーナスに「運+2」を追加（既存luck_pendantは置き換え）
UPDATE public.survival_characters AS sc
SET
  level_10_bonuses = COALESCE(
    (
      SELECT jsonb_agg(merged.item)
      FROM (
        SELECT value AS item
        FROM jsonb_array_elements(COALESCE(sc.level_10_bonuses, '[]'::jsonb))
        WHERE value->>'type' <> 'luck_pendant'
        UNION ALL
        SELECT jsonb_build_object('type', 'luck_pendant', 'value', 2)
      ) AS merged
    ),
    '[]'::jsonb
  ),
  updated_at = now()
WHERE sc.name = 'ジャ爺' OR sc.name_en = 'Jazz Elder';

COMMIT;
