-- Songs Floor 4・Floor 5（standard_2 / standard_3）: 「Standards 1」と揃えてブロックヘッダー・スロット表示名を複数形に統一。
-- （ステージ本文は 20260513230000_survival_songs_standard_2_and_3.sql が正）
BEGIN;

UPDATE public.survival_stage_blocks
SET label = 'Standards 2', label_en = 'Standards 2'
WHERE map_category = 'songs' AND block_key = 'standard_2';

UPDATE public.survival_stage_blocks
SET label = 'Standards 3', label_en = 'Standards 3'
WHERE map_category = 'songs' AND block_key = 'standard_3';

UPDATE public.survival_stages
SET chord_display_name = 'Standards 2', chord_display_name_en = 'Standards 2'
WHERE map_category = 'songs' AND block_key = 'standard_2';

UPDATE public.survival_stages
SET chord_display_name = 'Standards 3', chord_display_name_en = 'Standards 3'
WHERE map_category = 'songs' AND block_key = 'standard_3';

COMMIT;
