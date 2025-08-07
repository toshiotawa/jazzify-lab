-- progression のノーツ出題間隔（拍数）を追加。例: 4/4で4なら1小節ごと、2なら2拍ごと
ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS note_interval_beats integer;

COMMENT ON COLUMN public.fantasy_stages.note_interval_beats IS 'progression_order/random の出題拍間隔（拍数）。1拍目から interval ごとにノーツを配置。省略時は拍子（time_signature）と同じで小節頭のみ。';