-- Songs: ブロック・ステージ表示名を Standard 1 に統一（既に 20260513120000 を適用済みの DB 向け）
BEGIN;

UPDATE public.survival_stage_blocks
SET label = 'Standard 1', label_en = 'Standard 1'
WHERE map_category = 'songs' AND block_key = 'standards_tier_1';

UPDATE public.survival_stages
SET chord_display_name = 'Standard 1', chord_display_name_en = 'Standard 1'
WHERE map_category = 'songs' AND block_key = 'standards_tier_1';

COMMIT;
