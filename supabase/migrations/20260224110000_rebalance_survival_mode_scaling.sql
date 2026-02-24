-- サバイバルモード再バランス
-- 目的:
-- 1) 敵数インフレによるEXP暴騰を抑制
-- 2) 難易度帯ごとの緊張感を維持
-- 3) 外れ値キャラ（神官・魔王）の成長効率を調整

BEGIN;

UPDATE public.survival_difficulty_settings
SET
  enemy_spawn_rate = CASE difficulty
    WHEN 'veryeasy' THEN 2.8
    WHEN 'easy' THEN 2.4
    WHEN 'normal' THEN 2.2
    WHEN 'hard' THEN 2.0
    WHEN 'extreme' THEN 1.8
    ELSE enemy_spawn_rate
  END,
  enemy_spawn_count = CASE difficulty
    WHEN 'veryeasy' THEN 4
    WHEN 'easy' THEN 4
    WHEN 'normal' THEN 4
    WHEN 'hard' THEN 5
    WHEN 'extreme' THEN 6
    ELSE enemy_spawn_count
  END,
  enemy_stat_multiplier = CASE difficulty
    WHEN 'veryeasy' THEN 0.78
    WHEN 'easy' THEN 0.90
    WHEN 'normal' THEN 1.00
    WHEN 'hard' THEN 1.12
    WHEN 'extreme' THEN 1.25
    ELSE enemy_stat_multiplier
  END,
  exp_multiplier = CASE difficulty
    WHEN 'veryeasy' THEN 0.90
    WHEN 'easy' THEN 1.00
    WHEN 'normal' THEN 1.15
    WHEN 'hard' THEN 1.30
    WHEN 'extreme' THEN 1.50
    ELSE exp_multiplier
  END,
  updated_at = NOW();

-- 神官: 初期弾数の過剰値を抑制し、レベル10ボーナスの伸び幅を調整
UPDATE public.survival_characters AS sc
SET
  initial_stats = jsonb_set(
    COALESCE(sc.initial_stats, '{}'::jsonb),
    '{aBulletCount}',
    to_jsonb(6),
    true
  ),
  level_10_bonuses = '[{"type":"a_atk","value":1},{"type":"a_bullet","value":1}]'::jsonb,
  updated_at = NOW()
WHERE sc.name = '神官';

-- 魔王: 恒常バフを弱め、レベル10ボーナスを弾数加速からC ATK成長へ変更
UPDATE public.survival_characters AS sc
SET
  permanent_effects = '[{"type":"buffer","level":1}]'::jsonb,
  level_10_bonuses = '[{"type":"c_atk","value":1}]'::jsonb,
  excluded_bonuses = (
    SELECT COALESCE(jsonb_agg(DISTINCT t.bonus), '[]'::jsonb)
    FROM jsonb_array_elements_text(
      COALESCE(sc.excluded_bonuses, '[]'::jsonb)
      || '["exp_bonus", "a_bullet"]'::jsonb
    ) AS t(bonus)
  ),
  updated_at = NOW()
WHERE sc.name = '魔王';

COMMIT;
