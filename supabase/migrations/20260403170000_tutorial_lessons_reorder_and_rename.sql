-- チュートリアル: レッスン6-8の順序変更・タイトル/説明文更新・縦スクロール課題をバッハインヴェンション第1番Aセクション右手に変更・横スクロールのHarmony_Text削除

BEGIN;

-- 1. 順序変更（一時値で衝突回避）
--    旧: 横スクロール=5, コード入力=6, 楽譜=7
--    新: 縦スクロール(旧楽譜)=5, 横スクロール=6, コード入力(攻撃ゲージ)=7
UPDATE public.lessons SET order_index = 50 WHERE id = '5d9718a4-2760-5453-92f0-b9a3a6c200e5'::uuid;
UPDATE public.lessons SET order_index = 51 WHERE id = '19b12c25-e35f-5165-98d2-35a43b14b1e0'::uuid;
UPDATE public.lessons SET order_index = 52 WHERE id = '2b9f605b-f460-5d06-a76f-39f198a6345c'::uuid;

UPDATE public.lessons SET order_index = 5 WHERE id = '5d9718a4-2760-5453-92f0-b9a3a6c200e5'::uuid;
UPDATE public.lessons SET order_index = 6 WHERE id = '19b12c25-e35f-5165-98d2-35a43b14b1e0'::uuid;
UPDATE public.lessons SET order_index = 7 WHERE id = '2b9f605b-f460-5d06-a76f-39f198a6345c'::uuid;

-- 2. 縦スクロールの課題（旧：楽譜に沿った演奏の課題）タイトル・説明変更
UPDATE public.lessons SET
  title = '縦スクロールの課題',
  title_en = 'Practice: vertical scroll task',
  description = $ja3$バッハ 2声のインヴェンション 第1番のAセクション（右手パート）を使った縦スクロール形式の課題です。楽譜に沿ってノーツが進みますので、落ち着いて手元を確認しながら演奏しましょう。下の課題で B ランク以上を目指してください。$ja3$,
  description_en = $en3$Vertical scroll task using Bach Two-Part Inventions No. 1, Section A (right hand). Notes advance along the sheet music — take your time and aim for rank B or higher.$en3$
WHERE id = '5d9718a4-2760-5453-92f0-b9a3a6c200e5'::uuid;

-- 3. コード入力の課題（タイミング→攻撃ゲージ）タイトル・説明変更
UPDATE public.lessons SET
  title = 'コード入力の課題（攻撃ゲージ）',
  title_en = 'Practice: chord input (attack gauge)',
  description = $ja2$表示されたコードを、敵の攻撃ゲージが溜まる前に完成させましょう。出題は C・D・E に絞っています。下の課題で B ランク以上を目指してください。$ja2$,
  description_en = $en2$Complete the shown chord before the enemy attack gauge fills up. Prompts use C, D, and E only. Aim for rank B or higher on the task below.$en2$
WHERE id = '2b9f605b-f460-5d06-a76f-39f198a6345c'::uuid;

-- 4. 縦スクロール lesson_song をバッハインヴェンション第1番Aセクション右手に切り替え
UPDATE public.lesson_songs SET
  title = '課題ステージ（縦スクロール）',
  title_en = 'Assignment stage (vertical scroll)',
  is_fantasy = false,
  fantasy_stage_id = null,
  song_id = '94b5f0f4-0e9c-48c5-a16b-82698a01e78a'::uuid
WHERE id = '4cc08ceb-6d40-5391-85eb-2e144f648012'::uuid;

-- 5. fantasy_stages の表示名を更新（縦スクロール）
UPDATE public.fantasy_stages SET
  name = 'チュートリアル：縦スクロールの課題',
  name_en = 'Tutorial: vertical scroll task',
  description = '楽譜に沿ってノーツが進む縦スクロール形式の課題です。バッハ インヴェンション第1番Aセクション（右手）。',
  description_en = 'Vertical scroll task — notes advance along the sheet. Excerpt: Bach Inventions No. 1, Section A (right hand).'
WHERE id = '81ef6591-e75d-563b-ad78-f7735a129241'::uuid;

-- 6. fantasy_stages の表示名を更新（コード入力）
UPDATE public.fantasy_stages SET
  name = 'チュートリアル：コード入力の課題',
  name_en = 'Tutorial: chord input task',
  description = '表示されたコードを、敵の攻撃ゲージが溜まる前に入力する課題です（C・D・E）。',
  description_en = 'Enter the shown chord before the enemy attack gauge fills up. Uses C, D, and E major triads.'
WHERE id = '898cc873-a55e-5278-b801-91f643b349e5'::uuid;

-- 7. lesson_songs タイトルを更新（コード入力）
UPDATE public.lesson_songs SET
  title = 'コード入力の課題（攻撃ゲージ）',
  title_en = 'Assignment stage (chord input / attack gauge)'
WHERE id = '75107c2d-f8a0-5ab5-ad64-bbd336fb9f64'::uuid;

-- 8. 横スクロール chord_progression_data から Harmony_Text（text フィールド）を空文字に統一
UPDATE public.fantasy_stages
SET chord_progression_data = (
  SELECT jsonb_agg(
    CASE
      WHEN (elem->>'text') IS NOT NULL AND (elem->>'text') != ''
        THEN jsonb_set(elem, '{text}', '""'::jsonb)
      ELSE elem
    END
  )
  FROM jsonb_array_elements(chord_progression_data) AS elem
)
WHERE id = '47ac266e-c640-5478-b420-5c4db4050b6a'::uuid;

COMMIT;
