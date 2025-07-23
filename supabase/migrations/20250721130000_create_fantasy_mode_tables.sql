-- ファンタジーモード（コード練習RPG）のテーブル作成
-- 作成日: 2025-01-21
-- 説明: ファンタジーモードのステージ、ユーザー進捗、クリア記録を管理するテーブル

-- ファンタジーステージマスタテーブル
CREATE TABLE IF NOT EXISTS fantasy_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_number TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    max_hp INTEGER NOT NULL DEFAULT 5,
    enemy_count INTEGER NOT NULL DEFAULT 1,
    enemy_hp INTEGER NOT NULL DEFAULT 5,
    min_damage INTEGER NOT NULL DEFAULT 10,
    max_damage INTEGER NOT NULL DEFAULT 20,
    enemy_gauge_seconds FLOAT NOT NULL DEFAULT 5.0,
    mode TEXT NOT NULL DEFAULT 'single' CHECK (mode IN ('single', 'progression')),
    allowed_chords JSONB NOT NULL DEFAULT '[]'::jsonb,
    chord_progression JSONB DEFAULT '[]'::jsonb,
    show_sheet_music BOOLEAN NOT NULL DEFAULT false,
    show_guide BOOLEAN NOT NULL DEFAULT false,
    monster_icon TEXT DEFAULT 'ghost',
    bgm_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ユーザーファンタジー進捗テーブル
CREATE TABLE IF NOT EXISTS fantasy_user_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_stage_number TEXT NOT NULL DEFAULT '1-1',
    wizard_rank TEXT NOT NULL DEFAULT 'F',
    total_cleared_stages INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ファンタジーステージクリア記録テーブル
CREATE TABLE IF NOT EXISTS fantasy_stage_clears (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    stage_id UUID NOT NULL REFERENCES fantasy_stages(id) ON DELETE CASCADE,
    cleared_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    score INTEGER NOT NULL DEFAULT 0,
    clear_type TEXT NOT NULL DEFAULT 'clear' CHECK (clear_type IN ('clear', 'gameover')),
    remaining_hp INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 0,
    correct_answers INTEGER NOT NULL DEFAULT 0,
    UNIQUE(user_id, stage_id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS fantasy_stages_stage_number_idx ON fantasy_stages(stage_number);
CREATE INDEX IF NOT EXISTS fantasy_user_progress_user_id_idx ON fantasy_user_progress(user_id);
CREATE INDEX IF NOT EXISTS fantasy_stage_clears_user_id_idx ON fantasy_stage_clears(user_id);
CREATE INDEX IF NOT EXISTS fantasy_stage_clears_stage_id_idx ON fantasy_stage_clears(stage_id);
CREATE INDEX IF NOT EXISTS fantasy_stage_clears_cleared_at_idx ON fantasy_stage_clears(cleared_at);

-- RLS (Row Level Security) ポリシー設定
ALTER TABLE fantasy_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE fantasy_stage_clears ENABLE ROW LEVEL SECURITY;

-- fantasy_stages: 全ユーザーが読み取り可能、管理者のみ書き込み可能
CREATE POLICY IF NOT EXISTS fantasy_stages_read_policy ON fantasy_stages FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS fantasy_stages_write_policy ON fantasy_stages FOR ALL USING (
    auth.uid() IN (
        SELECT id FROM profiles WHERE is_admin = true
    )
);

-- fantasy_user_progress: ユーザーは自分のレコードのみアクセス可能
CREATE POLICY IF NOT EXISTS fantasy_user_progress_policy ON fantasy_user_progress FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IN (
        SELECT id FROM profiles WHERE is_admin = true
    )
);

-- fantasy_stage_clears: ユーザーは自分のレコードのみアクセス可能
CREATE POLICY IF NOT EXISTS fantasy_stage_clears_policy ON fantasy_stage_clears FOR ALL USING (
    auth.uid() = user_id OR
    auth.uid() IN (
        SELECT id FROM profiles WHERE is_admin = true
    )
);

-- 初期データ: サンプルステージの作成
INSERT INTO fantasy_stages (stage_number, name, description, max_hp, enemy_count, enemy_hp, min_damage, max_damage, enemy_gauge_seconds, mode, allowed_chords, monster_icon) VALUES
('1-1', 'はじまりの森', '基本的なメジャーコードに挑戦！', 5, 1, 5, 1, 1, 6.0, 'single', '["C", "F", "G", "Am"]'::jsonb, 'tree'),
('1-2', '緑の草原', 'マイナーコードも加わります', 5, 2, 3, 1, 1, 5.5, 'single', '["C", "F", "G", "Am", "Dm", "Em"]'::jsonb, 'seedling'),
('1-3', 'やさしい小川', 'セブンスコードの登場', 5, 2, 4, 1, 1, 5.0, 'single', '["C", "F", "G", "Am", "Dm", "Em", "G7"]'::jsonb, 'droplet'),
('1-4', '陽だまりの丘', 'コード進行に挑戦', 4, 2, 4, 1, 1, 5.0, 'progression', '["C", "Am", "F", "G"]'::jsonb, 'sun'),
('1-5', '静寂の洞窟', 'より多くのコードで練習', 4, 2, 5, 1, 1, 4.5, 'single', '["C", "F", "G", "Am", "Dm", "Em", "G7", "C7", "F7"]'::jsonb, 'rock'),
('2-1', '魔法の森', '7thコードをマスターしよう', 4, 2, 4, 1, 1, 4.0, 'single', '["C7", "F7", "G7", "Am7", "Dm7", "Em7"]'::jsonb, 'sparkles'),
('2-2', '水晶の谷', 'メジャー7thの美しい響き', 4, 3, 3, 1, 1, 4.0, 'single', '["CM7", "FM7", "GM7", "Am7"]'::jsonb, 'gem'),
('2-3', '風の台地', 'コード進行 ii-V-I', 3, 2, 5, 1, 1, 3.8, 'progression', '["Dm7", "G7", "CM7"]'::jsonb, 'wind_face'),
('2-4', '雷鳴の峠', 'ドミナント7thの緊張感', 3, 2, 5, 1, 1, 3.5, 'single', '["G7", "C7", "F7", "B7", "E7", "A7", "D7"]'::jsonb, 'zap'),
('2-5', '星空の頂', 'テンション系コードに挑戦', 3, 3, 4, 1, 1, 3.5, 'single', '["C6", "Cm6", "C9", "Cm9", "C11", "C13"]'::jsonb, 'star2');

-- 更新日時の自動更新トリガー関数
CREATE OR REPLACE FUNCTION update_fantasy_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- トリガー設定
CREATE TRIGGER IF NOT EXISTS fantasy_stages_updated_at_trigger
    BEFORE UPDATE ON fantasy_stages
    FOR EACH ROW
    EXECUTE FUNCTION update_fantasy_updated_at();

CREATE TRIGGER IF NOT EXISTS fantasy_user_progress_updated_at_trigger
    BEFORE UPDATE ON fantasy_user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_fantasy_updated_at();

-- コメント追加
COMMENT ON TABLE fantasy_stages IS 'ファンタジーモードのステージマスタテーブル';
COMMENT ON TABLE fantasy_user_progress IS 'ユーザーのファンタジーモード進捗情報';
COMMENT ON TABLE fantasy_stage_clears IS 'ファンタジーステージのクリア記録';

COMMENT ON COLUMN fantasy_stages.stage_number IS 'ステージ番号 (例: 1-1, 1-2, 2-1)';
COMMENT ON COLUMN fantasy_stages.enemy_gauge_seconds IS 'モンスターの行動ゲージが満タンになるまでの秒数';
COMMENT ON COLUMN fantasy_stages.mode IS 'single: 単一コードモード, progression: コード進行モード';
COMMENT ON COLUMN fantasy_stages.allowed_chords IS '許可されたコードのリスト (JSON配列)';
COMMENT ON COLUMN fantasy_stages.chord_progression IS 'コード進行モード時の進行パターン (JSON配列)';

COMMENT ON COLUMN fantasy_user_progress.current_stage_number IS '現在挑戦可能なステージ番号';
COMMENT ON COLUMN fantasy_user_progress.wizard_rank IS '魔法使いランク (F, F+, E, E+, ..., S, S+)';

COMMENT ON COLUMN fantasy_stage_clears.clear_type IS 'clear: クリア成功, gameover: ゲームオーバー';
COMMENT ON COLUMN fantasy_stage_clears.remaining_hp IS 'クリア時またはゲームオーバー時の残りHP';