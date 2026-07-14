-- メインクエスト チャプター再構成
-- Ch1: ドとソでジャズの返事（クエスト1のみ・無料）
-- Ch2: Cブルースのコードをつかむ（旧Ch1クエスト2・3）
-- Ch3: Cブルース：モチーフでアドリブしよう（旧Ch2）
BEGIN;

-- チャプター1: クエスト1のみ、章名更新
UPDATE public.lessons
SET
  block_number = 1,
  block_name = 'ドとソでジャズの返事',
  block_name_en = 'Jazz Reply with Do and Sol',
  block_description = 'ドとソだけで聴いて返す。',
  block_description_en = 'Hear and answer with Do and Sol.',
  order_index = 0,
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q1-lesson');

-- チャプター2: 旧クエスト2 → クエスト1
UPDATE public.lessons
SET
  block_number = 2,
  block_name = 'Cブルースのコードをつかむ',
  block_name_en = 'Get a Grip on C Blues Chords',
  block_description = 'コードの響きと進行をつかむ。',
  block_description_en = 'Learn chord colors and the blues progression.',
  order_index = 0,
  title = 'クエスト1：コードの2音を覚える',
  title_en = 'Quest 1: Learn two-note chords',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-lesson');

UPDATE public.lesson_songs
SET
  title = '1-1. 2音でもコードの響きになる',
  title_en = '1-1. Two notes make a chord',
  order_index = 0
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q2-1-lsong');

-- チャプター2: 旧クエスト3 → クエスト2
UPDATE public.lessons
SET
  block_number = 2,
  block_name = 'Cブルースのコードをつかむ',
  block_name_en = 'Get a Grip on C Blues Chords',
  block_description = 'コードの響きと進行をつかむ。',
  block_description_en = 'Learn chord colors and the blues progression.',
  order_index = 1,
  title = 'クエスト2：ブルースのコード進行に乗る',
  title_en = 'Quest 2: Ride the blues changes',
  updated_at = now()
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-lesson');

UPDATE public.lesson_songs
SET
  title = '2-1. Cブルースを通して見る',
  title_en = '2-1. Watch through C blues',
  order_index = 0
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-2-lsong');

UPDATE public.lesson_songs
SET
  title = '2-2. リズムに合わせて1拍目だけ弾く',
  title_en = '2-2. Hit beat one',
  order_index = 1
WHERE id = uuid_generate_v5('a0000000-0000-4000-8000-000000000001'::uuid, 'mq-b1-q3-3-lsong');

-- チャプター3: 旧チャプター2（モチーフ）を繰り下げ
UPDATE public.lessons
SET
  block_number = 3,
  updated_at = now()
WHERE id IN (
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q1-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q2-lesson'),
  uuid_generate_v5('a0000000-0000-4000-8000-000000000002'::uuid, 'mq-b2-q3-lesson')
);

UPDATE public.courses
SET
  description = 'ジャズ初心者が順番に進める一本道のコース。まずドとソで返事、コードをつかみ、モチーフへ。',
  description_en = 'A step-by-step path for jazz beginners. Reply with Do and Sol, grasp chords, then motifs.',
  updated_at = now()
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;

COMMIT;
