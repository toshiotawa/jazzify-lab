-- サバイバルモードにVery Easy難易度を追加
-- CHECK制約の更新とデフォルトデータの追加

-- survival_high_scoresのCHECK制約を更新
ALTER TABLE survival_high_scores 
DROP CONSTRAINT IF EXISTS survival_high_scores_difficulty_check;

ALTER TABLE survival_high_scores 
ADD CONSTRAINT survival_high_scores_difficulty_check 
CHECK (difficulty IN ('veryeasy', 'easy', 'normal', 'hard', 'extreme'));

-- survival_difficulty_settingsのCHECK制約を更新
ALTER TABLE survival_difficulty_settings 
DROP CONSTRAINT IF EXISTS survival_difficulty_settings_difficulty_check;

ALTER TABLE survival_difficulty_settings 
ADD CONSTRAINT survival_difficulty_settings_difficulty_check 
CHECK (difficulty IN ('veryeasy', 'easy', 'normal', 'hard', 'extreme'));

-- veryeasyの設定を追加
INSERT INTO survival_difficulty_settings (
    difficulty, 
    display_name, 
    description, 
    allowed_chords, 
    enemy_spawn_rate, 
    enemy_spawn_count, 
    enemy_stat_multiplier, 
    exp_multiplier, 
    item_drop_rate
)
VALUES (
    'veryeasy', 
    'Very Easy', 
    '入門用。単音ノーツのみ。', 
    '["C_note", "D_note", "E_note", "F_note", "G_note", "A_note", "B_note"]'::jsonb, 
    4.0,     -- 敵の出現間隔（秒）- 長め
    1,       -- 1回の出現数 - 少なめ
    0.5,     -- 敵のステータス倍率 - 低め
    0.8,     -- 経験値倍率
    0.20     -- アイテムドロップ率 - 高め
)
ON CONFLICT (difficulty) DO NOTHING;
