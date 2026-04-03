-- チュートリアル: 全レッスンを無料閲覧可能に、ゲーム課題3件をチュートリアルブロックへ統一、モード名を前面に出しすぎないタイトルへ

BEGIN;

-- lessons 既定 premium_only=true のため INSERT 漏れでロックされるのを防ぐ
UPDATE public.lessons
SET premium_only = false
WHERE course_id = 'a0000000-0000-0000-0000-000000000001'::uuid;

-- チュートリアルコース自体も無料で開けるように（一覧展開・閲覧）
UPDATE public.courses
SET
  premium_only = false,
  is_tutorial = true
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

-- ゲーム課題3レッスン: ブロックを「チュートリアル」に統一し、タイトルを穏やかに
UPDATE public.lessons SET
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  title = '横スクロールの課題（ノーツに合わせて）',
  title_en = 'Practice: play along with scrolling notes',
  description = $ja1$ノーツが流れるリズムに合わせてコードを演奏し、課題をクリアします。画面の動きに慣れながら、タイミングよく和音を入力する練習です。下の課題で B ランク以上を目指してください。$ja1$,
  description_en = $en1$Play chords in time with scrolling notes to clear the assignment. Use this step to get used to the flow and enter chords accurately. Aim for rank B or higher on the task below.$en1$
WHERE id = '19b12c25-e35f-5165-98d2-35a43b14b1e0'::uuid;

UPDATE public.lessons SET
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  title = 'コード入力の課題（タイミング）',
  title_en = 'Practice: chord input timing',
  description = $ja2$表示されたコードを、制限時間内に入力する課題です。出題は C・D・E に絞っています。下の課題で B ランク以上を目指してください。$ja2$,
  description_en = $en2$Enter the shown chords within the time limit. Prompts use C, D, and E only. Aim for rank B or higher on the task below.$en2$
WHERE id = '2b9f605b-f460-5d06-a76f-39f198a6345c'::uuid;

UPDATE public.lessons SET
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  title = '楽譜に沿った演奏の課題',
  title_en = 'Practice: playing from the score',
  description = $ja3$楽譜表示に沿ってノーツが進む形式の課題です。J.S.バッハ 平均律クラヴィーア曲集 第1巻 第1番 ハ長調 プレリュードの冒頭2小節（右手パート）に取り組みます。下の課題で B ランク以上を目指してください。$ja3$,
  description_en = $en3$Follow the score as notes advance. This task uses the first two measures (right hand) of Bach WTC Book I No.1 in C major, BWV 846 Prelude. Aim for rank B or higher on the task below.$en3$
WHERE id = '5d9718a4-2760-5453-92f0-b9a3a6c200e5'::uuid;

-- チュートリアル用ファンタジーステージの表示名（ステージ選択・結果画面）
UPDATE public.fantasy_stages SET
  name = 'チュートリアル：横スクロールの課題',
  name_en = 'Tutorial: scrolling notes task',
  description = 'ノーツが判定線へ流れる形式の課題です。タイミングよく和音を演奏しましょう。',
  description_en = 'Notes scroll toward the hit line. Play chords in time to complete the task.'
WHERE id = '47ac266e-c640-5478-b420-5c4db4050b6a'::uuid;

UPDATE public.fantasy_stages SET
  name = 'チュートリアル：コード入力の課題',
  name_en = 'Tutorial: chord input task',
  description = '表示されたコードを、ゲージが満ちる前に入力する課題です（C・D・E）。',
  description_en = 'Enter the shown chord before the gauge fills. Uses C, D, and E major triads.'
WHERE id = '898cc873-a55e-5278-b801-91f643b349e5'::uuid;

UPDATE public.fantasy_stages SET
  name = 'チュートリアル：楽譜に沿った演奏',
  name_en = 'Tutorial: playing from the score',
  description = '楽譜に沿ってノーツが進む課題です。バッハ平均律第1巻第1番プレリュード冒頭（右手・2小節）。',
  description_en = 'Notes advance along the sheet. Excerpt: first two measures (right hand), Bach WTC I/1 Prelude.'
WHERE id = '81ef6591-e75d-563b-ad78-f7735a129241'::uuid;

UPDATE public.lesson_songs SET
  title = '課題ステージ（横スクロール）',
  title_en = 'Assignment stage (horizontal)'
WHERE id = '8ed37296-4064-56c7-b29f-1fb9a5f7887e'::uuid;

UPDATE public.lesson_songs SET
  title = '課題ステージ（コード入力）',
  title_en = 'Assignment stage (chord input)'
WHERE id = '75107c2d-f8a0-5ab5-ad64-bbd336fb9f64'::uuid;

UPDATE public.lesson_songs SET
  title = '課題ステージ（楽譜）',
  title_en = 'Assignment stage (score)'
WHERE id = '4cc08ceb-6d40-5391-85eb-2e144f648012'::uuid;

COMMIT;
