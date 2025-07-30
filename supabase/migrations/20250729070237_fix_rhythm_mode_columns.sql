-- リズムモードのカラム名衝突を修正するマイグレーション

-- 既存のmodeカラムの名前を変更（single/progression用）
ALTER TABLE public.fantasy_stages 
RENAME COLUMN mode TO stage_mode;

-- 新しいgame_modeカラムを追加（quiz/rhythm用）
ALTER TABLE public.fantasy_stages
ADD COLUMN IF NOT EXISTS game_mode TEXT NOT NULL DEFAULT 'quiz' 
CHECK (game_mode IN ('quiz', 'rhythm'));

-- pattern_typeの制約を更新（game_modeを参照）
ALTER TABLE public.fantasy_stages
DROP CONSTRAINT IF EXISTS fantasy_stages_pattern_type_check;

ALTER TABLE public.fantasy_stages
ADD CONSTRAINT fantasy_stages_pattern_type_check
CHECK (
  (game_mode <> 'rhythm') OR (pattern_type IN ('random', 'progression'))
);

-- music_metaの制約を更新（game_modeを参照）
ALTER TABLE public.fantasy_stages
DROP CONSTRAINT IF EXISTS fantasy_stages_music_meta_check;

ALTER TABLE public.fantasy_stages
ADD CONSTRAINT fantasy_stages_music_meta_check
CHECK (
  (game_mode <> 'rhythm') OR (
    music_meta IS NOT NULL AND
    music_meta ? 'bpm' AND
    music_meta ? 'timeSig' AND
    music_meta ? 'bars' AND
    (music_meta->>'bpm')::NUMERIC > 0 AND
    (music_meta->>'timeSig')::NUMERIC IN (3, 4) AND
    (music_meta->>'bars')::NUMERIC > 0
  )
);

-- audio_urlの制約を更新（game_modeを参照）
ALTER TABLE public.fantasy_stages
DROP CONSTRAINT IF EXISTS fantasy_stages_audio_url_check;

ALTER TABLE public.fantasy_stages
ADD CONSTRAINT fantasy_stages_audio_url_check
CHECK (
  (game_mode <> 'rhythm') OR (audio_url IS NOT NULL)
);

-- インデックスを更新
DROP INDEX IF EXISTS idx_fantasy_stages_mode_pattern;
CREATE INDEX idx_fantasy_stages_game_mode_pattern 
ON public.fantasy_stages(game_mode, pattern_type);

-- コメントを更新
COMMENT ON COLUMN public.fantasy_stages.stage_mode IS 'ステージモード: single(単体) | progression(進行)';
COMMENT ON COLUMN public.fantasy_stages.game_mode IS 'ゲームモード: quiz(クイズモード) | rhythm(リズムモード)';