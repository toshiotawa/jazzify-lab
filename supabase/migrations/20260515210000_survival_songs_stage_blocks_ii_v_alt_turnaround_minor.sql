-- Survival Songs: blocks for II-V7(alt)-I, Turn Around, Minor II-V-I (sort_order 5–7).
-- Apply before migrations 20260515210101–20260515210112 (stages 31–42).
BEGIN;

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order)
VALUES
  ('songs', 'ii_v7_alt', 'II-V7(alt)-I', 'II-V7(alt)-I', 5),
  ('songs', 'turnaround', 'Turn Around', 'Turn Around', 6),
  ('songs', 'minor_ii_v_i', 'Minor II-V-I', 'Minor II-V-I', 7)
ON CONFLICT (map_category, block_key) DO UPDATE
SET label = EXCLUDED.label,
    label_en = EXCLUDED.label_en,
    sort_order = EXCLUDED.sort_order;

COMMIT;
