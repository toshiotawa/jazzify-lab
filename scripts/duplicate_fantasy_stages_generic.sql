-- ========================================
-- Fantasy Stages 汎用複製スクリプト
-- ========================================
-- 使い方:
--   以下の変数を変更して実行
-- ========================================

-- ====== 設定 ======
-- 以下の値を変更してください

DO $$
DECLARE
  v_source_prefix TEXT := '2-';        -- 複製元のプレフィックス (例: '2-')
  v_target_prefix TEXT := '3-';        -- 複製先のプレフィックス (例: '3-')
  v_source_tier TEXT := 'basic';       -- 複製元のstage_tier ('basic' or 'advanced')
  v_target_tier TEXT := 'basic';       -- 複製先のstage_tier (同じにする場合は同値を設定)
  v_start_num INT := 1;                -- 開始ステージ番号 (例: 1 で '2-1'から)
  v_end_num INT := 10;                 -- 終了ステージ番号 (例: 10 で '2-10'まで)
  v_count INT := 0;
BEGIN
  -- 複製実行
  INSERT INTO public.fantasy_stages (
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
  )
  SELECT
    v_target_prefix || SPLIT_PART(stage_number, '-', 2) AS stage_number,
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
    v_target_tier AS stage_tier,  -- 複製先のtierを設定
    note_interval_beats,
    is_sheet_music_mode,
    sheet_music_clef,
    usage_type
  FROM public.fantasy_stages
  WHERE 
    stage_number LIKE v_source_prefix || '%'
    AND stage_tier = v_source_tier
    AND CAST(SPLIT_PART(stage_number, '-', 2) AS INTEGER) >= v_start_num
    AND CAST(SPLIT_PART(stage_number, '-', 2) AS INTEGER) <= v_end_num
  ORDER BY 
    CAST(SPLIT_PART(stage_number, '-', 2) AS INTEGER);

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '% ステージを複製しました (%% -> %%)', v_count, v_source_prefix, v_target_prefix;
END $$;

-- ========================================
-- 複製結果の確認
-- ========================================
SELECT 
  id, 
  stage_number, 
  name, 
  stage_tier,
  mode,
  question_count,
  max_hp
FROM public.fantasy_stages 
WHERE stage_number LIKE '3-%'  -- 複製先のプレフィックスに変更
ORDER BY CAST(SPLIT_PART(stage_number, '-', 2) AS INTEGER);

-- ========================================
-- ロールバック (必要な場合)
-- ========================================
-- DELETE FROM public.fantasy_stages 
-- WHERE stage_number LIKE '3-%' AND stage_tier = 'basic';
