BEGIN;

-- Merge phrases_composite_1 (stage 6) into phrases_ii_v_c_1 so floor 2 has 7 stages:
-- stage 6 composite (refs 1-5) + stages 7-11 regular + stage 12 composite (refs 7-11).

UPDATE public.survival_stages
SET block_key = 'phrases_ii_v_c_1'
WHERE map_category = 'phrases'
  AND stage_number = 6;

DELETE FROM public.survival_stage_blocks
WHERE map_category = 'phrases'
  AND block_key = 'phrases_composite_1';

UPDATE public.survival_stage_blocks
SET
  label = 'Composite + II-V in C 1-5',
  label_en = 'Composite + II-V in C 1-5',
  updated_at = now()
WHERE map_category = 'phrases'
  AND block_key = 'phrases_ii_v_c_1';

COMMIT;
