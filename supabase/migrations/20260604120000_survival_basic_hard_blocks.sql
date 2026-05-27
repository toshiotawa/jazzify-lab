-- Basic マップ: ブロック 18〜34（sort_order 17〜33）として Hard リメイクを追加。
-- 依存: survival_stage_blocks の player_max_hp / kill_quota / boss_max_hp 列（20260603120000）。
INSERT INTO public.survival_stage_blocks
  (map_category, block_key, label, label_en, sort_order,
   player_max_hp, kill_quota, boss_max_hp)
SELECT
  'basic',
  'hard_' || block_key,
  label || ' Hard',
  label_en || ' Hard',
  sort_order + 17,
  100,
  600,
  20000
FROM public.survival_stage_blocks
WHERE map_category = 'basic' AND sort_order <= 16
ORDER BY sort_order
ON CONFLICT (map_category, block_key) DO UPDATE SET
  label = EXCLUDED.label,
  label_en = EXCLUDED.label_en,
  sort_order = EXCLUDED.sort_order,
  player_max_hp = EXCLUDED.player_max_hp,
  kill_quota = EXCLUDED.kill_quota,
  boss_max_hp = EXCLUDED.boss_max_hp,
  updated_at = now();

INSERT INTO public.survival_stages (
  map_category,
  stage_number,
  stage_type,
  name,
  name_en,
  difficulty,
  chord_suffix,
  chord_display_name,
  chord_display_name_en,
  root_pattern,
  root_pattern_name,
  root_pattern_name_en,
  block_key,
  is_mixed_stage,
  mixed_group_key,
  lesson_only,
  chord_progression
)
SELECT
  s.map_category,
  s.stage_number + 89,
  s.stage_type,
  (s.stage_number + 89)::text || '. ' || s.chord_display_name || ' Hard'
    || CASE
      WHEN s.root_pattern_name IS NOT NULL AND trim(s.root_pattern_name) <> ''
      THEN ' ' || s.root_pattern_name
      ELSE ''
    END,
  (s.stage_number + 89)::text || '. ' || s.chord_display_name_en || ' Hard'
    || CASE
      WHEN s.root_pattern_name_en IS NOT NULL AND trim(s.root_pattern_name_en) <> ''
      THEN ' ' || s.root_pattern_name_en
      ELSE ''
    END,
  s.difficulty,
  s.chord_suffix,
  s.chord_display_name,
  s.chord_display_name_en,
  s.root_pattern,
  s.root_pattern_name,
  s.root_pattern_name_en,
  'hard_' || s.block_key,
  s.is_mixed_stage,
  s.mixed_group_key,
  s.lesson_only,
  s.chord_progression
FROM public.survival_stages s
WHERE s.map_category = 'basic'
  AND NOT s.lesson_only
  AND s.stage_number BETWEEN 1 AND 89
ORDER BY s.stage_number
ON CONFLICT (map_category, stage_number) DO UPDATE SET
  stage_type = EXCLUDED.stage_type,
  name = EXCLUDED.name,
  name_en = EXCLUDED.name_en,
  difficulty = EXCLUDED.difficulty,
  chord_suffix = EXCLUDED.chord_suffix,
  chord_display_name = EXCLUDED.chord_display_name,
  chord_display_name_en = EXCLUDED.chord_display_name_en,
  root_pattern = EXCLUDED.root_pattern,
  root_pattern_name = EXCLUDED.root_pattern_name,
  root_pattern_name_en = EXCLUDED.root_pattern_name_en,
  block_key = EXCLUDED.block_key,
  is_mixed_stage = EXCLUDED.is_mixed_stage,
  mixed_group_key = EXCLUDED.mixed_group_key,
  lesson_only = EXCLUDED.lesson_only,
  chord_progression = EXCLUDED.chord_progression,
  updated_at = now();
