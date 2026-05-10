-- ステージごとのユーザー累計クリア回数（同一ステージのリプレイをカウント）
ALTER TABLE public.survival_stage_clears
    ADD COLUMN IF NOT EXISTS clear_count integer NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.survival_stage_clears.clear_count IS 'ログインユーザーが当該ステージをクリアした累計回数（初回行作成時は1）';

ALTER TABLE public.survival_stage_clears
    DROP CONSTRAINT IF EXISTS survival_stage_clears_clear_count_check;

ALTER TABLE public.survival_stage_clears
    ADD CONSTRAINT survival_stage_clears_clear_count_check CHECK (clear_count >= 1);

-- 既存行は「クリア済み1回」とみなす（DEFAULT で既に 1）
