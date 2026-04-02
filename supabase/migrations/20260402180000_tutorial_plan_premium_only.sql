-- チュートリアル: プランはプレミアムのみ・手動ブロック解放なし・無料トライアルあり（20260402160000 適用済み環境向け）

BEGIN;

UPDATE public.lessons SET
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

UPDATE public.lessons SET
  title = 'プレミアムプランと無料トライアル',
  title_en = 'Premium plan and free trial',
  description = $ja3$現在、Jazzifyでお申し込みいただけるのはプレミアムプランのみです。

無料トライアル期間中は、プレミアムの全機能をお試しいただけます。料金・お支払い・変更・解約は、料金ページ（#pricing）やアカウントから確認してください。$ja3$,
  description_en = $en3$Jazzify currently offers a Premium subscription only.

During the free trial you can use all Premium features. See the Pricing page (#pricing) or your account for pricing, billing, changes, and cancellation.$en3$
WHERE id = '2027ff4d-5bc0-44fc-aeb0-50e28870ecb2'::uuid;

COMMIT;
