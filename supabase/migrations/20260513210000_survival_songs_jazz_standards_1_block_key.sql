-- Songs: block_key standards_tier_1 → jazz_standards_1、表示名を Jazz Standards 1 に統一
BEGIN;

UPDATE public.survival_stages
SET block_key = 'jazz_standards_1',
    chord_display_name = 'Jazz Standards 1',
    chord_display_name_en = 'Jazz Standards 1'
WHERE map_category = 'songs' AND block_key = 'standards_tier_1';

UPDATE public.survival_stage_blocks
SET block_key = 'jazz_standards_1',
    label = 'Jazz Standards 1',
    label_en = 'Jazz Standards 1'
WHERE map_category = 'songs' AND block_key = 'standards_tier_1';

COMMIT;
