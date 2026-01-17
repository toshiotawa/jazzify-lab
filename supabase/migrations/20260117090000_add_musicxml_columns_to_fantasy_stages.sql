-- MusicXML関連カラムの追加
-- progression_timingモードで楽譜表示と同時発音ノーツ判定をサポート

-- chord_progression_data: progression_timing用のJSON配列
-- 各要素は {bar, beats, chord, inversion?, octave?, text?, notes?, noteNames?} 形式
ALTER TABLE public.fantasy_stages
  ADD COLUMN IF NOT EXISTS chord_progression_data JSONB DEFAULT '[]'::jsonb;

-- music_xml_url: MusicXMLファイルのURL（楽譜表示用）
ALTER TABLE public.fantasy_stages
  ADD COLUMN IF NOT EXISTS music_xml_url TEXT;

-- use_music_xml_notes: MusicXMLのノーツを正解判定に直接使用するか
-- true: MusicXMLの同時発音ノーツを1つの和音として判定
-- false: 従来通りchord_progression_dataのchordフィールドで判定
ALTER TABLE public.fantasy_stages
  ADD COLUMN IF NOT EXISTS use_music_xml_notes BOOLEAN NOT NULL DEFAULT FALSE;

-- コメント追加
COMMENT ON COLUMN public.fantasy_stages.chord_progression_data IS 'progression_timing用のコード進行データ。JSON配列形式で {bar, beats, chord, text?} など';
COMMENT ON COLUMN public.fantasy_stages.music_xml_url IS 'MusicXMLファイルのURL。楽譜表示に使用';
COMMENT ON COLUMN public.fantasy_stages.use_music_xml_notes IS 'true: MusicXMLの同時発音を正解判定に使用。false: chord_progression_dataのchordで判定';
