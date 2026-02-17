-- ジャ爺のレベルアップボーナスからヒント(magic_hint)を除外
-- ジャ爺は永続HINT効果を持っているため、レベルアップでヒントを取得する必要がない

BEGIN;

UPDATE public.survival_characters AS sc
SET
  excluded_bonuses = (
    SELECT COALESCE(jsonb_agg(DISTINCT t.bonus), '[]'::jsonb)
    FROM jsonb_array_elements_text(
      COALESCE(sc.excluded_bonuses, '[]'::jsonb)
      || '["magic_hint"]'::jsonb
    ) AS t(bonus)
  ),
  updated_at = now()
WHERE sc.name = 'ジャ爺' OR sc.name_en = 'Jazz Elder';

COMMIT;
