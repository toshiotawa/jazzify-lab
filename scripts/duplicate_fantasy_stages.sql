-- ========================================
-- Fantasy Stages 複製スクリプト
-- ステージ2-1 〜 2-10 を 3-1 〜 3-10 に複製
-- ========================================
-- 使い方:
--   1. SOURCE_STAGEとTARGET_STAGEプレフィックスを変更
--   2. Supabase SQL Editorで実行
-- ========================================

BEGIN;

-- 設定: 変更するステージ番号のプレフィックス
-- 例: '2-' を '3-' に複製
-- stage_tierも必要に応じて変更

-- 複製元: ステージ2-1 〜 2-10 (stage_tier = 'basic')
-- 複製先: ステージ3-1 〜 3-10 (stage_tier = 'basic')

INSERT INTO public.fantasy_stages (
  -- id は自動生成されるので除外
  stage_number,
  name,
  name_en,
  description,
  description_en,
  max_hp,
  question_count,
  enemy_gauge_seconds,
  mode,
  allowed_chords,
  chord_progression,
  bgm_url,
  show_guide,
  enemy_count,
  enemy_hp,
  min_damage,
  max_damage,
  simultaneous_monster_count,
  play_root_on_correct,
  stage_tier,
  note_interval_beats,
  is_sheet_music_mode,
  sheet_music_clef,
  usage_type
  -- created_at, updated_at は自動設定
)
SELECT
  -- stage_number を '2-X' から '3-X' に変換
  REPLACE(stage_number, '2-', '3-') AS stage_number,
  name,
  name_en,
  description,
  description_en,
  max_hp,
  question_count,
  enemy_gauge_seconds,
  mode,
  allowed_chords,
  chord_progression,
  bgm_url,
  show_guide,
  enemy_count,
  enemy_hp,
  min_damage,
  max_damage,
  simultaneous_monster_count,
  play_root_on_correct,
  stage_tier,
  note_interval_beats,
  is_sheet_music_mode,
  sheet_music_clef,
  usage_type
FROM public.fantasy_stages
WHERE 
  stage_number ~ '^2-\d+$'  -- '2-' で始まり数字で終わる
  AND stage_tier = 'basic'  -- 必要に応じて変更
ORDER BY 
  -- stage_numberを数値順にソート
  CAST(SPLIT_PART(stage_number, '-', 2) AS INTEGER);

-- 確認クエリ (実行後、結果を確認)
-- SELECT id, stage_number, name, stage_tier FROM fantasy_stages 
-- WHERE stage_number ~ '^3-\d+$' ORDER BY CAST(SPLIT_PART(stage_number, '-', 2) AS INTEGER);

COMMIT;

-- ========================================
-- ロールバック用 (必要な場合)
-- ========================================
-- DELETE FROM public.fantasy_stages 
-- WHERE stage_number ~ '^3-\d+$' AND stage_tier = 'basic';
