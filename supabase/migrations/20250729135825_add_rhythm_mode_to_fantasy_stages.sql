-- リズムモード関連カラムをfantasy_stagesテーブルに追加
ALTER TABLE fantasy_stages
ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'quiz' CHECK (game_type IN ('quiz', 'rhythm')),
ADD COLUMN IF NOT EXISTS rhythm_type TEXT CHECK (rhythm_type IN ('randomChord', 'progression')),
ADD COLUMN IF NOT EXISTS bpm INTEGER CHECK (bpm > 0),
ADD COLUMN IF NOT EXISTS time_signature INTEGER CHECK (time_signature IN (3, 4)),
ADD COLUMN IF NOT EXISTS measure_count INTEGER CHECK (measure_count > 0),
ADD COLUMN IF NOT EXISTS rhythm_data TEXT;

-- コメントを追加
COMMENT ON COLUMN fantasy_stages.game_type IS 'ゲームタイプ（quiz: クイズモード, rhythm: リズムモード）';
COMMENT ON COLUMN fantasy_stages.rhythm_type IS 'リズムタイプ（randomChord: コードランダム, progression: コードプログレッション）';
COMMENT ON COLUMN fantasy_stages.bpm IS 'テンポ（Beat Per Minute）';
COMMENT ON COLUMN fantasy_stages.time_signature IS '拍子（3拍子または4拍子）';
COMMENT ON COLUMN fantasy_stages.measure_count IS '小節数';
COMMENT ON COLUMN fantasy_stages.rhythm_data IS 'リズムデータのファイルパス';

-- デモ用のリズムモードステージを追加
INSERT INTO fantasy_stages (
  stage_number,
  name,
  description,
  max_hp,
  enemy_gauge_seconds,
  enemy_count,
  enemy_hp,
  min_damage,
  max_damage,
  mode,
  allowed_chords,
  show_sheet_music,
  show_guide,
  monster_icon,
  bgm_url,
  simultaneous_monster_count,
  game_type,
  rhythm_type,
  bpm,
  time_signature,
  measure_count,
  rhythm_data
) VALUES (
  'R-1',
  'リズムタイプ体験',
  'リズムに合わせてコードを入力しよう！',
  5,
  3.0,
  5,
  3,
  15,
  25,
  'single',
  '["CM7", "Am7", "Dm7", "G7", "FM7", "Em7"]'::jsonb,
  false,
  true,
  'slime',
  '/demo-1.mp3',
  1,
  'rhythm',
  'randomChord',
  120,
  4,
  8,
  '/demo-1.json'
)
ON CONFLICT (stage_number) DO NOTHING;