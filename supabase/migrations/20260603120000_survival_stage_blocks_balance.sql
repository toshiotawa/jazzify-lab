-- Block-level survival balance overrides (nullable = use client fallback constants).
ALTER TABLE public.survival_stage_blocks
  ADD COLUMN IF NOT EXISTS player_max_hp integer NULL
    CHECK (player_max_hp IS NULL OR player_max_hp > 0),
  ADD COLUMN IF NOT EXISTS kill_quota integer NULL
    CHECK (kill_quota IS NULL OR kill_quota > 0),
  ADD COLUMN IF NOT EXISTS boss_max_hp integer NULL
    CHECK (boss_max_hp IS NULL OR boss_max_hp > 0);

COMMENT ON COLUMN public.survival_stage_blocks.player_max_hp IS 'Non-boss encounters: overrides player initial/max HP when set (otherwise Basic/Songs 800, Phrases 1000).';
COMMENT ON COLUMN public.survival_stage_blocks.kill_quota IS 'Non-boss encounters: overrides defeat quota when set (otherwise first-block regular 10, else 150).';
COMMENT ON COLUMN public.survival_stage_blocks.boss_max_hp IS 'Block-end boss encounters: overrides boss enemy max HP when set (otherwise first-block 7000, Songs/Basic 15000, Phrases 75000).';
