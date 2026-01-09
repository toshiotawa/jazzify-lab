-- 楽譜モードの追加
-- is_sheet_music_mode: true の場合、モンスターアイコンの代わりに楽譜画像を表示し、
-- allowed_chords に設定された音名に対応する画像を使用する

ALTER TABLE public.fantasy_stages
  ADD COLUMN IF NOT EXISTS is_sheet_music_mode BOOLEAN NOT NULL DEFAULT FALSE;

-- 楽譜タイプ（ト音記号/ヘ音記号）
ALTER TABLE public.fantasy_stages
  ADD COLUMN IF NOT EXISTS sheet_music_clef TEXT DEFAULT 'treble' CHECK (sheet_music_clef IN ('treble', 'bass'));

COMMENT ON COLUMN public.fantasy_stages.is_sheet_music_mode IS '楽譜モードのON/OFF設定（true: 楽譜画像を敵アイコンとして表示）';
COMMENT ON COLUMN public.fantasy_stages.sheet_music_clef IS '楽譜タイプ: treble=ト音記号, bass=ヘ音記号';
