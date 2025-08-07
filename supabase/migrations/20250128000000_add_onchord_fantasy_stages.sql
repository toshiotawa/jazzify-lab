-- オンコード（分数コード）を含むファンタジーステージの追加
-- 説明: オンコードの練習用ステージを追加

-- 新しいステージを追加
INSERT INTO fantasy_stages (stage_number, name, description, max_hp, enemy_count, enemy_hp, min_damage, max_damage, enemy_gauge_seconds, mode, allowed_chords, monster_icon, guide_display) VALUES
-- オンコード入門ステージ
('3-1', '転回の迷宮', 'オンコード入門 - C/EやF/Aに挑戦', 4, 2, 4, 1, 1, 4.0, 'single', '["C", "C/E", "F", "F/A", "G", "G/B"]'::jsonb, 'castle', true),
('3-2', '響きの回廊', 'メジャーコードのオンコード', 4, 2, 5, 1, 1, 3.8, 'single', '["C/E", "C/G", "F/A", "F/C", "G/B", "G/D"]'::jsonb, 'classical_building', true),
('3-3', '低音の深淵', '特殊なベース音 - F/Gなど', 3, 2, 5, 1, 1, 3.5, 'single', '["F/G", "C/G", "G7/B", "G7/D", "G7/F", "C7/E"]'::jsonb, 'hole', true),
('3-4', '和声の塔', 'マイナーコードのオンコード', 3, 3, 4, 1, 1, 3.5, 'single', '["Am", "Am/C", "Am/E", "Dm", "Dm/F", "Dm/A", "Em", "Em/G", "Em/B"]'::jsonb, 'tokyo_tower', true),
('3-5', '転調の橋', 'オンコード進行', 3, 2, 5, 1, 1, 3.2, 'progression', '["C", "C/E", "F", "F/G", "C"]'::jsonb, 'bridge_at_night', true),

-- 上級オンコードステージ
('4-1', '半音の階段', '#や♭を含むオンコード', 3, 2, 5, 1, 1, 3.0, 'single', '["D/F#", "A/C#", "E/G#", "D7/F#", "C7/Bb"]'::jsonb, 'musical_note', true),
('4-2', '複雑な響き', '7thコードのオンコード', 3, 3, 4, 1, 1, 3.0, 'single', '["C7/E", "C7/G", "C7/Bb", "G7/B", "G7/D", "G7/F", "Dm7/F", "Am7/C"]'::jsonb, 'jigsaw', true),
('4-3', 'ジャズの小径', 'ジャズ的オンコード進行', 2, 3, 5, 1, 1, 2.8, 'progression', '["Dm7", "G7/B", "CM7", "C/E", "FM7", "F/G", "CM7"]'::jsonb, 'saxophone', true),
('4-4', 'ポップスの広場', 'ポップス的オンコード', 2, 3, 5, 1, 1, 2.5, 'single', '["C/E", "F/C", "G/D", "Am/C", "F/G", "C/G", "G7/F", "C/E"]'::jsonb, 'microphone', true),
('4-5', 'マスターの証', 'オンコード総合練習', 2, 4, 5, 1, 1, 2.5, 'single', '["C/E", "F/G", "Am/C", "D/F#", "G7/B", "C7/Bb", "F/A", "Dm7/G", "C/G"]'::jsonb, 'crown', true)
ON CONFLICT (stage_number) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  max_hp = EXCLUDED.max_hp,
  enemy_count = EXCLUDED.enemy_count,
  enemy_hp = EXCLUDED.enemy_hp,
  min_damage = EXCLUDED.min_damage,
  max_damage = EXCLUDED.max_damage,
  enemy_gauge_seconds = EXCLUDED.enemy_gauge_seconds,
  mode = EXCLUDED.mode,
  allowed_chords = EXCLUDED.allowed_chords,
  monster_icon = EXCLUDED.monster_icon,
  guide_display = EXCLUDED.guide_display,
  updated_at = NOW();

-- コメント
COMMENT ON COLUMN fantasy_stages.allowed_chords IS 'このステージで使用可能なコードのリスト（オンコードを含む）';