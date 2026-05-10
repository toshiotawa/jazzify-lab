-- サバイバル降下マップ: ブロック（フロア）表示名（ja/en）
CREATE TABLE IF NOT EXISTS public.survival_stage_blocks (
    map_category text NOT NULL CHECK (map_category IN ('basic', 'songs')),
    block_key text NOT NULL,
    label text NOT NULL,
    label_en text NOT NULL,
    sort_order integer NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (map_category, block_key)
);

COMMENT ON TABLE public.survival_stage_blocks IS '魔王城降下マップのブロックヘッダー表示名（コードタイプラベル）。階層番号はクライアント側で算出。';

ALTER TABLE public.survival_stage_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY survival_stage_blocks_select_all ON public.survival_stage_blocks
    FOR SELECT USING (true);

CREATE POLICY survival_stage_blocks_insert_admin ON public.survival_stage_blocks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
        )
    );

CREATE POLICY survival_stage_blocks_update_admin ON public.survival_stage_blocks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
        )
    );

CREATE POLICY survival_stage_blocks_delete_admin ON public.survival_stage_blocks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin IS TRUE
        )
    );

CREATE OR REPLACE FUNCTION public.set_survival_stage_blocks_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_survival_stage_blocks_updated_at ON public.survival_stage_blocks;
CREATE TRIGGER trg_survival_stage_blocks_updated_at
    BEFORE UPDATE ON public.survival_stage_blocks
    FOR EACH ROW
    EXECUTE FUNCTION public.set_survival_stage_blocks_updated_at();

INSERT INTO public.survival_stage_blocks (map_category, block_key, label, label_en, sort_order) VALUES
    ('basic', 'major', 'メジャー', 'Major', 0),
    ('basic', 'minor', 'マイナー', 'Minor', 1),
    ('basic', 'M7', 'M7', 'M7', 2),
    ('basic', 'm7', 'm7', 'm7', 3),
    ('basic', '7', '7', '7', 4),
    ('basic', 'm7b5', 'm7b5', 'm7b5', 5),
    ('basic', 'mM7', 'mM7', 'mM7', 6),
    ('basic', 'dim7', 'dim7', 'dim7', 7),
    ('basic', 'aug7', 'aug7', 'aug7', 8),
    ('basic', '6', '6', '6', 9),
    ('basic', 'm6', 'm6', 'm6', 10),
    ('basic', 'M7_9', 'M7(9)', 'M7(9)', 11),
    ('basic', 'm7_9', 'm7(9)', 'm7(9)', 12),
    ('basic', '7_9_13', '7(9.13)', '7(9.13)', 13),
    ('basic', '7_b9_b13', '7(b9.b13)', '7(b9.b13)', 14),
    ('basic', '6_9', '6(9)', '6(9)', 15),
    ('basic', 'm6_9', 'm6(9)', 'm6(9)', 16),
    ('basic', '7_b9_13', '7(b9.13)', '7(b9.13)', 17),
    ('basic', '7_sharp9_b13', '7(#9.b13)', '7(#9.b13)', 18),
    ('basic', 'm7b5_11', 'm7(b5)(11)', 'm7(b5)(11)', 19),
    ('basic', 'dimM7', 'dim(M7)', 'dim(M7)', 20),
    ('songs', 'major', 'メジャー', 'Major', 0)
ON CONFLICT (map_category, block_key) DO NOTHING;

GRANT SELECT ON public.survival_stage_blocks TO anon, authenticated;
