-- Code Run auto mode: auto_run_map_id column + default auto map.
BEGIN;

ALTER TABLE public.survival_stages
  ADD COLUMN IF NOT EXISTS auto_run_map_id text DEFAULT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'survival_stages_auto_run_map_id_fkey'
  ) THEN
    ALTER TABLE public.survival_stages
      ADD CONSTRAINT survival_stages_auto_run_map_id_fkey
      FOREIGN KEY (auto_run_map_id) REFERENCES public.survival_run_maps(id);
  END IF;
END $$;

COMMENT ON COLUMN public.survival_stages.auto_run_map_id IS
  'CodeRun auto-run mode map id in survival_run_maps. NULL falls back to auto_run_01.';

INSERT INTO public.survival_run_maps (id, name, map_data) VALUES (
  'auto_run_01',
  'オートラン1',
  '{"layoutVersion":1,"viewWidth":960,"viewHeight":528,"tileSize":48,"worldTilesWide":140,"worldTilesHigh":33,"worldHeight":1584,"groundRow":4,"spawn":{"c":2,"r":30},"pits":[],"solids":[{"kind":"ground","row":0,"c0":116,"c1":117},{"kind":"ground","row":1,"c0":116,"c1":117},{"kind":"ground","row":2,"c0":116,"c1":117},{"kind":"ground","row":3,"c0":116,"c1":117},{"kind":"ground","row":4,"c0":116,"c1":117},{"kind":"ground","row":5,"c0":116,"c1":117},{"kind":"ground","row":6,"c0":116,"c1":117},{"kind":"ground","row":7,"c0":116,"c1":117},{"kind":"ground","row":8,"c0":116,"c1":117},{"kind":"ground","c":85,"r":9},{"kind":"ground","row":9,"c0":116,"c1":117},{"kind":"ground","c":85,"r":10},{"kind":"ground","row":10,"c0":116,"c1":117},{"kind":"ground","c":85,"r":11},{"kind":"ground","row":11,"c0":92,"c1":93},{"kind":"ground","row":11,"c0":116,"c1":117},{"kind":"ground","c":85,"r":12},{"kind":"ground","row":12,"c0":92,"c1":93},{"kind":"ground","row":12,"c0":116,"c1":117},{"kind":"ground","row":13,"c0":85,"c1":93},{"kind":"ground","row":13,"c0":116,"c1":117},{"kind":"ground","row":14,"c0":85,"c1":93},{"kind":"ground","row":14,"c0":116,"c1":117},{"kind":"ground","row":15,"c0":85,"c1":100},{"kind":"ground","row":15,"c0":114,"c1":117},{"kind":"ground","row":16,"c0":85,"c1":100},{"kind":"ground","row":16,"c0":114,"c1":117},{"kind":"ground","row":17,"c0":85,"c1":100},{"kind":"ground","row":17,"c0":114,"c1":117},{"kind":"ground","row":18,"c0":85,"c1":100},{"kind":"ground","row":18,"c0":114,"c1":117},{"kind":"ground","row":19,"c0":85,"c1":100},{"kind":"ground","row":19,"c0":114,"c1":117},{"kind":"ground","row":20,"c0":85,"c1":100},{"kind":"ground","row":20,"c0":114,"c1":117},{"kind":"ground","row":21,"c0":85,"c1":100},{"kind":"ground","row":21,"c0":114,"c1":117},{"kind":"ground","row":22,"c0":85,"c1":100},{"kind":"ground","row":22,"c0":114,"c1":117},{"kind":"ground","row":23,"c0":85,"c1":100},{"kind":"ground","row":23,"c0":114,"c1":117},{"kind":"ground","row":24,"c0":85,"c1":100},{"kind":"ground","row":24,"c0":114,"c1":117},{"kind":"ground","row":25,"c0":85,"c1":100},{"kind":"ground","row":25,"c0":114,"c1":117},{"kind":"ground","row":26,"c0":85,"c1":100},{"kind":"ground","row":26,"c0":114,"c1":117},{"kind":"ground","row":27,"c0":85,"c1":100},{"kind":"ground","row":27,"c0":114,"c1":117},{"kind":"ground","row":28,"c0":85,"c1":100},{"kind":"ground","row":28,"c0":114,"c1":117},{"kind":"ground","row":29,"c0":85,"c1":100},{"kind":"ground","row":29,"c0":114,"c1":117},{"kind":"ground","row":30,"c0":12,"c1":13},{"kind":"ground","row":30,"c0":20,"c1":21},{"kind":"ground","row":30,"c0":28,"c1":29},{"kind":"ground","row":30,"c0":36,"c1":37},{"kind":"ground","row":30,"c0":44,"c1":45},{"kind":"ground","row":30,"c0":52,"c1":53},{"kind":"ground","row":30,"c0":60,"c1":61},{"kind":"ground","row":30,"c0":68,"c1":69},{"kind":"ground","row":30,"c0":76,"c1":77},{"kind":"ground","row":30,"c0":85,"c1":100},{"kind":"ground","row":30,"c0":114,"c1":117},{"kind":"ground","row":31,"c0":0,"c1":83},{"kind":"ground","row":31,"c0":85,"c1":117},{"kind":"ground","row":32,"c0":0,"c1":83},{"kind":"ground","row":32,"c0":85,"c1":117},{"kind":"platform","row":10,"c0":82,"c1":84},{"kind":"platform","row":12,"c0":82,"c1":84},{"kind":"platform","row":14,"c0":82,"c1":84},{"kind":"platform","row":16,"c0":82,"c1":84},{"kind":"platform","row":16,"c0":111,"c1":113},{"kind":"platform","row":18,"c0":82,"c1":84},{"kind":"platform","row":18,"c0":111,"c1":113},{"kind":"platform","row":20,"c0":82,"c1":84},{"kind":"platform","row":20,"c0":111,"c1":113},{"kind":"platform","row":22,"c0":82,"c1":84},{"kind":"platform","row":22,"c0":111,"c1":113},{"kind":"platform","row":24,"c0":82,"c1":84},{"kind":"platform","row":24,"c0":111,"c1":113},{"kind":"platform","row":26,"c0":82,"c1":84},{"kind":"platform","row":26,"c0":111,"c1":113},{"kind":"platform","row":28,"c0":82,"c1":84},{"kind":"platform","row":28,"c0":111,"c1":113},{"kind":"block","row":0,"c0":92,"c1":93},{"kind":"block","row":1,"c0":92,"c1":93},{"kind":"block","row":2,"c0":92,"c1":93},{"kind":"block","row":3,"c0":92,"c1":93},{"kind":"block","row":4,"c0":92,"c1":93},{"kind":"block","row":5,"c0":92,"c1":93},{"kind":"block","row":6,"c0":92,"c1":93},{"kind":"block","row":15,"c0":104,"c1":110},{"kind":"block","row":16,"c0":104,"c1":110},{"kind":"block","row":17,"c0":104,"c1":110},{"kind":"block","row":18,"c0":104,"c1":110},{"kind":"block","row":19,"c0":104,"c1":110},{"kind":"block","row":20,"c0":104,"c1":110},{"kind":"block","row":21,"c0":104,"c1":110},{"kind":"block","row":22,"c0":104,"c1":110},{"kind":"block","row":23,"c0":104,"c1":110},{"kind":"block","row":24,"c0":104,"c1":110},{"kind":"block","row":25,"c0":104,"c1":110},{"kind":"block","row":26,"c0":104,"c1":110},{"kind":"block","row":27,"c0":104,"c1":110}],"spikes":[],"enemies":[],"goalOffsetX":18,"manualGround":true,"goal":{"c":115,"r":15}}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  map_data = EXCLUDED.map_data,
  updated_at = now();

COMMIT;
