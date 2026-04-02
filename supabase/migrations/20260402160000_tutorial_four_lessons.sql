-- チュートリアルコースを4レッスンに再編（既存の先頭4 UUID を維持し、残り14件を削除）

BEGIN;

-- 参照・進捗は lessons ON DELETE CASCADE で連動削除
DELETE FROM public.lessons
WHERE course_id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND id IN (
    'ebe15e56-182f-44f3-93e1-cd2edc467090'::uuid,
    'aee9aaa7-eb2d-4de9-823d-cf562fa61573'::uuid,
    'ea12a234-9c38-4bb8-9115-6ca4652313ba'::uuid,
    '4f7d86d7-7a9a-41cc-bf77-2bc9b97b2121'::uuid,
    'c33b8492-5545-4685-9023-b7c0adb6ec02'::uuid,
    '15db73a4-03e4-4c8a-9116-08d547ef7941'::uuid,
    '3fb33a38-3efd-4ed2-8698-c6ad76aad9c4'::uuid,
    '22afd82f-4041-48da-a215-fe5020f1ed3b'::uuid,
    '94491b06-779e-416e-afb1-a68346de06f2'::uuid,
    'c9e4f6c0-5b80-415d-9129-4a36a2568532'::uuid,
    'adbe8a03-9b34-42b8-bde3-64b97895138b'::uuid,
    '92053bff-b980-49c0-b0fb-bdcb59d85a95'::uuid,
    '3009c97e-6f41-4dc6-8f58-a043f0dd7895'::uuid,
    '33833110-1c0e-4045-aa1b-430c92df6e05'::uuid
  );

-- 1. はじめに
UPDATE public.lessons SET
  order_index = 0,
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  nav_links = '[]'::jsonb,
  assignment_description = NULL,
  title = 'Jazzifyへようこそ',
  title_en = 'Welcome to Jazzify',
  description = $ja1$Jazzifyはジャズを学ぶためのアプリです。

このチュートリアルは4つのステップです。各ページの下にある「レッスンを完了」をタップして進めてください。

次のレッスンでは、コースやブロックの進め方を説明します。$ja1$,
  description_en = $en1$Jazzify helps you learn jazz through lessons and games.

This tutorial has four short steps. Tap “Complete lesson” at the bottom of each page to continue.

The next lesson explains how courses and blocks work.$en1$
WHERE id = 'dcabffbf-acbc-4cb2-9ba9-f856fbf72f01'::uuid;

-- 2. レッスン・コース・ブロック
UPDATE public.lessons SET
  order_index = 1,
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  nav_links = '["lesson"]'::jsonb,
  assignment_description = NULL,
  title = 'レッスン・コース・ブロック',
  title_en = 'Lessons, courses, and blocks',
  description = $ja2$「レッスン」では、コース単位で教材が並びます。チュートリアルを終えると、他のコースにも進めます（学習機能の利用にはプレミアムへの加入が必要です。無料トライアルをご利用いただけます）。

■ ブロック
レッスンはトピックごとにブロックに分かれています。ブロック内のレッスンをすべて完了すると、次のブロックが解放されます。手動でブロックだけを解放する機能はありません。

次のレッスンでは、プレミアムプランと無料トライアルについて説明します。$ja2$,
  description_en = $en2$Lessons are organized into courses. After you finish the tutorial, you can open other courses (Premium access is required to use learning features; a free trial is available).

Blocks group lessons by topic. Clear every lesson in a block to unlock the next block. There is no manual block unlock.

The next lesson covers the Premium plan and free trial.$en2$
WHERE id = '71ad6e11-5f98-4c0c-b955-be0352ad20ad'::uuid;

-- 3. プランと無料トライアル
UPDATE public.lessons SET
  order_index = 2,
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  nav_links = '["dashboard"]'::jsonb,
  assignment_description = NULL,
  title = 'プレミアムプランと無料トライアル',
  title_en = 'Premium plan and free trial',
  description = $ja3$現在、Jazzifyでお申し込みいただけるのはプレミアムプランのみです。

無料トライアル期間中は、プレミアムの全機能をお試しいただけます。料金・お支払い・変更・解約は、料金ページ（#pricing）やアカウントから確認してください。$ja3$,
  description_en = $en3$Jazzify currently offers a Premium subscription only.

During the free trial you can use all Premium features. See the Pricing page (#pricing) or your account for pricing, billing, changes, and cancellation.$en3$
WHERE id = '2027ff4d-5bc0-44fc-aeb0-50e28870ecb2'::uuid;

-- 4. 主な遊び方
UPDATE public.lessons SET
  order_index = 3,
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  nav_links = '["fantasy", "survival", "information"]'::jsonb,
  assignment_description = NULL,
  title = '主な遊び方',
  title_en = 'Main modes',
  description = $ja4$主なモードの例です。

■ ファンタジーモード（#fantasy）
ステージを進めながら、コードや理論を学べます。

■ デイリーチャレンジ（#daily-challenge）
短時間のクイズで腕試しできます（ダッシュボードからも開けます）。

■ サバイバルモード（#survival）
フィールドで敵を倒しながら、生存時間を競うモードです。

■ MIDIキーボード
電子ピアノを接続すると練習しやすくなります。接続手順はヘルプ（/help/ios-midi）を参照してください。

■ お知らせ（#information）
アップデートやメンテナンスの情報はお知らせページで確認できます。

最後に「レッスンを完了」をタップするとチュートリアル完了です。学習をお楽しみください。$ja4$,
  description_en = $en4$Here are the main modes.

Fantasy (#fantasy): advance through stages to study chords and theory.

Daily Challenge (#daily-challenge): a short quiz sprint (also reachable from the dashboard).

Survival (#survival): action mode—defeat enemies and aim for a long run.

MIDI keyboard: connect a digital piano for a better experience—see the help page (/help/ios-midi).

Announcements (#information): updates and maintenance windows.

Tap “Complete lesson” to finish the tutorial. Enjoy learning!$en4$
WHERE id = 'b7309196-3083-4f4e-b57e-1d5c2027b5ac'::uuid;

COMMIT;
