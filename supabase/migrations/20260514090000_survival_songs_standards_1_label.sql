-- Songs Floor 3: ブロック表示名を Standards 1 に変更（jazz_standards_1）
BEGIN;

UPDATE public.survival_stage_blocks
SET label = 'Standards 1', label_en = 'Standards 1'
WHERE map_category = 'songs' AND block_key = 'jazz_standards_1';

UPDATE public.survival_stages
SET chord_display_name = 'Standards 1', chord_display_name_en = 'Standards 1'
WHERE map_category = 'songs' AND block_key = 'jazz_standards_1';

COMMIT;
