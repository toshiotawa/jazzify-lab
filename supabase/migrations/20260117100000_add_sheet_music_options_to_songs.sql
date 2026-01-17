-- songs テーブルに楽譜表示オプションのカラムを追加

-- 1. MusicXMLがあっても譜面を表示しないオプション
-- hide_sheet_music: true の場合、MusicXMLがあっても楽譜を非表示にする
ALTER TABLE public.songs
ADD COLUMN IF NOT EXISTS hide_sheet_music boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN public.songs.hide_sheet_music IS 'MusicXMLがあっても譜面を表示しない（true: 非表示, false: 通常表示）';

-- 2. リズム譜表示オプション
-- use_rhythm_notation: true の場合、符頭の高さを一定にしてリズム譜的に表示
ALTER TABLE public.songs
ADD COLUMN IF NOT EXISTS use_rhythm_notation boolean DEFAULT false NOT NULL;

COMMENT ON COLUMN public.songs.use_rhythm_notation IS 'リズム譜モード - 符頭の高さを一定にして表示（true: リズム譜, false: 通常表示）';
