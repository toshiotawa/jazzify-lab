-- ファンタジーモードにリズムモードを追加するマイグレーション

-- mode カラム追加 (quiz / rhythm)
ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'quiz' 
CHECK (mode IN ('quiz', 'rhythm'));

-- pattern_type カラム追加 (random / progression) - rhythmモードのみ使用
ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS pattern_type TEXT 
CHECK (
  (mode <> 'rhythm') OR (pattern_type IN ('random', 'progression'))
);

-- music_meta カラム追加 (BPM, 拍子, 小節数)
ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS music_meta JSONB
CHECK (
  (mode <> 'rhythm') OR (
    music_meta IS NOT NULL AND
    music_meta ? 'bpm' AND
    music_meta ? 'timeSig' AND
    music_meta ? 'bars' AND
    (music_meta->>'bpm')::NUMERIC > 0 AND
    (music_meta->>'timeSig')::NUMERIC IN (3, 4) AND
    (music_meta->>'bars')::NUMERIC > 0
  )
);

-- audio_url カラム追加 (mp3ファイルのURL)
ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS audio_url TEXT
CHECK (
  (mode <> 'rhythm') OR (audio_url IS NOT NULL)
);

-- カラムにコメント追加
COMMENT ON COLUMN public.fantasy_stages.mode IS 'ゲームモード: quiz(クイズモード) | rhythm(リズムモード)';
COMMENT ON COLUMN public.fantasy_stages.pattern_type IS 'リズムモードのパターン: random(ランダム) | progression(プログレッション)';
COMMENT ON COLUMN public.fantasy_stages.music_meta IS 'リズムモードの曲情報: {bpm, timeSig, bars}';
COMMENT ON COLUMN public.fantasy_stages.audio_url IS 'リズムモードのBGMファイルURL';

-- インデックス追加
CREATE INDEX IF NOT EXISTS idx_fantasy_stages_mode_pattern 
ON public.fantasy_stages(mode, pattern_type);

-- 既存データの更新（全てquizモードとして扱う）
UPDATE public.fantasy_stages 
SET mode = 'quiz' 
WHERE mode IS NULL;