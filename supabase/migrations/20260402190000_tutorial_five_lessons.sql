-- チュートリアルコースを5レッスンに再編（既存4 UUID + 新規1件INSERT）

BEGIN;

-- コース説明更新
UPDATE public.courses SET
  description = '楽しみながらジャズを学ぶための入門チュートリアルです。アプリの使い方、プレミアムプラン、サバイバルモード、レッスンの進め方、MIDIキーボード接続方法を5ステップで説明します。',
  description_en = 'An introductory tutorial for learning jazz while having fun. Five steps covering how to use the app, the Premium plan, Survival mode, how lessons work, and how to connect a MIDI keyboard.'
WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
  AND COALESCE(is_tutorial, false) = true;

-- 0. Jazzifyについて
UPDATE public.lessons SET
  order_index = 0,
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  nav_links = '[]'::jsonb,
  assignment_description = NULL,
  title = 'Jazzifyについて',
  title_en = 'About Jazzify',
  description = $ja0$Jazzifyへようこそ！

Jazzifyは「楽しみながらジャズを学ぶ」をコンセプトにした音楽学習アプリです。ピアノやギターの練習を、ゲーム感覚で取り組むことができます。

演奏の入力方法は3種類あります。

■ MIDIキーボード
CoreMIDI対応のキーボードやコントローラーをiPhoneに接続して演奏します。レイテンシが低く、最も正確な入力方法です。接続方法はこのチュートリアルの最後のステップで説明します。

■ マイクによるピッチ検出
iPhoneのマイクを使って、リアルタイムで音の高さを検出します。アコースティック楽器や声での練習に向いています。初回使用時にマイクへのアクセス許可が求められます。

■ 画面上のピアノキー
外部機器がなくても、画面に表示されるピアノキーをタップして演奏できます。気軽に始めたいときに便利です。

演奏はリアルタイムで採点され、タイミングやピッチの正確さがスコアとして表示されます。初心者から上級者まで、段階的に目標を持って取り組める構成になっています。

このチュートリアルは全部で5ステップです。各ページの下にある「レッスンを完了」をタップして次へ進んでください。$ja0$,
  description_en = $en0$Welcome to Jazzify!

Jazzify is a music learning app designed around the concept of "learning jazz while having fun." It helps you practice piano and guitar with a gamified approach.

There are three ways to input your performance:

MIDI Keyboard
Connect a CoreMIDI-compatible keyboard or controller to your iPhone. This method offers the lowest latency and most accurate input. Connection instructions are covered in the last step of this tutorial.

Microphone Pitch Detection
Uses your iPhone's microphone to detect pitch in real time. Ideal for acoustic instruments or vocal practice. Microphone permission will be requested on first use.

On-Screen Piano Keys
Tap the piano keys on screen to play without any external device. Convenient when you want to get started quickly.

Your performance is scored in real time against the musical score, with timing and pitch accuracy shown as a score. The app is structured for learners at every level to set goals and track progress.

This tutorial has five steps. Tap "Complete lesson" at the bottom of each page to continue.$en0$
WHERE id = 'dcabffbf-acbc-4cb2-9ba9-f856fbf72f01'::uuid;

-- 1. プレミアムプラン
UPDATE public.lessons SET
  order_index = 1,
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  nav_links = '["dashboard"]'::jsonb,
  assignment_description = NULL,
  title = 'プレミアムプラン',
  title_en = 'Premium Plan',
  description = $ja1$Jazzifyではプレミアムプランを提供しています。

■ プレミアムで解放される機能
プレミアムに加入すると、以下の機能がすべて利用可能になります。
・チュートリアル以外のすべてのレッスンコース
・サバイバルモードの全ステージ
・デイリーチャレンジの全難易度
・詳細な統計と進捗トラッキング

無料ユーザーの方は、チュートリアルコースとデイリーチャレンジの最低難易度をご利用いただけます。

■ 7日間の無料トライアル
初めてご利用の方には、7日間の無料トライアルがあります。トライアル期間中はプレミアムのすべての機能をお試しいただけます。トライアル終了後に自動で月額課金が開始されます。

■ 解約はいつでも可能
プレミアムプランは月額の自動更新サブスクリプションです。解約はいつでも可能で、現在の期間が終了する24時間前までにキャンセルすれば、次の期間の料金は発生しません。

解約手続き：設定 → Apple ID → サブスクリプション$ja1$,
  description_en = $en1$Jazzify offers a Premium subscription plan.

What's Included
With Premium, you unlock:
- All lesson courses beyond the Tutorial
- Full access to Survival mode stages
- All Daily Challenge difficulty levels
- Detailed statistics and progress tracking

Free users can access only the Tutorial course and the lowest Daily Challenge difficulty.

7-Day Free Trial
First-time users can enjoy a 7-day free trial. During the trial, all Premium features are available. Charges begin automatically after the trial ends.

Cancel Anytime
Premium is a monthly auto-renewing subscription. You can cancel at any time—just cancel at least 24 hours before the current period ends to avoid the next charge.

To cancel: Settings → Apple ID → Subscriptions$en1$
WHERE id = '2027ff4d-5bc0-44fc-aeb0-50e28870ecb2'::uuid;

-- 2. サバイバルモード
UPDATE public.lessons SET
  order_index = 2,
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  nav_links = '["survival"]'::jsonb,
  assignment_description = NULL,
  title = 'サバイバルモード',
  title_en = 'Survival Mode',
  description = $ja2$サバイバルモードは、コード（和音）の知識を楽しみながら身につけるためのアクションモードです。

■ 目的 ― コードを実践的に学ぶ
サバイバルモードでは、迫り来る敵に対して正しいコードを入力し、スキルを発動して倒していきます。ゲームを繰り返しプレイすることで、コードの構成音や押さえ方を自然に覚えることができます。座学だけでは身につきにくいコードの知識を、実戦形式で鍛えるのがこのモードの狙いです。

■ 操作方法
フィールド上で敵が自分のキャラクターに向かって近づいてきます。画面に表示されるコード名（例：Cmaj7、Dm7など）を見て、MIDIキーボード・マイク・画面上のピアノキーのいずれかで対応するコードを入力します。正確に入力するとスキルが発動し、敵にダメージを与えることができます。

■ クリア条件
一定時間の生存、または特定の目標を達成するとステージクリアです。敵に接触するとダメージを受け、体力がゼロになるとゲームオーバーになります。$ja2$,
  description_en = $en2$Survival mode is an action-packed mode designed to help you learn chords in an engaging way.

Purpose — Learn Chords Through Practice
In Survival mode, enemies approach and you must input the correct chord to trigger skills and defeat them. Through repeated play, you will naturally memorize chord voicings and structures. This mode aims to build practical chord knowledge that is hard to gain from study alone.

How to Play
Enemies move toward your character on the field. A chord name is displayed on screen (e.g., Cmaj7, Dm7). Input the matching chord using a MIDI keyboard, microphone, or on-screen piano keys. Accurate input activates a skill that damages enemies.

Clear Conditions
Survive for a set duration or achieve specific objectives to clear a stage. Getting hit by enemies reduces your health—when it reaches zero, it is game over.$en2$
WHERE id = 'b7309196-3083-4f4e-b57e-1d5c2027b5ac'::uuid;

-- 3. レッスンの進め方
UPDATE public.lessons SET
  order_index = 3,
  block_number = 1,
  block_name = 'チュートリアル',
  block_name_en = 'Tutorial',
  nav_links = '["lesson"]'::jsonb,
  assignment_description = NULL,
  title = 'レッスンの進め方',
  title_en = 'How Lessons Work',
  description = $ja3$「レッスン」では、コース単位で教材が並んでいます。コースを選び、その中のレッスンを一つずつ進めていく形式です。

■ 目的
レッスンでは、ジャズの理論や演奏テクニックを体系的に学ぶことができます。リアルタイムの採点フィードバックを受けながら、タイミングやピッチの正確さを段階的に向上させていくことが目標です。

■ ブロックと課題
レッスンはトピックごとに「ブロック」に分かれています。ブロック内のレッスンをすべて完了すると、次のブロックが解放される仕組みです。

一部のレッスンには「課題」が含まれています。課題では、画面を流れるノーツ（音符）に合わせて演奏し、パフォーマンスが採点されます。レッスンの解説をしっかり読んでから課題に取り組むと、より効果的に学習できます。

■ コース紹介
チュートリアルのほかにも、初心者向けから段階的にステップアップしていくコースが用意されています。チュートリアルを完了すると、プレミアムプランで他のコースにアクセスできるようになります。

コースは今後もどんどん追加されていく予定です。新しいコースの情報はお知らせページで発表しますので、ぜひチェックしてください。$ja3$,
  description_en = $en3$The Lessons tab organizes learning materials into courses. Select a course and work through its lessons one by one.

Purpose
Lessons provide a structured way to learn jazz theory and performance techniques. With real-time scoring feedback, you can gradually improve your timing and pitch accuracy.

Blocks and Assignments
Lessons are grouped into "blocks" by topic. Complete all lessons in a block to unlock the next one.

Some lessons include "assignments." In assignments, you play along with scrolling notes and receive a performance score. It is most effective to study the lesson content before attempting the assignment.

Course Overview
Beyond the Tutorial, courses are available ranging from beginner-friendly to more advanced topics. After completing the Tutorial, you can access other courses with a Premium plan.

New courses are added regularly. Check the Announcements page for the latest additions.$en3$
WHERE id = '71ad6e11-5f98-4c0c-b955-be0352ad20ad'::uuid;

-- 4. MIDIキーボード接続方法（新規 — IDはDB生成済み: a8d86a15-0a62-49cc-b894-07eb530eb91a）
INSERT INTO public.lessons (id, course_id, order_index, block_number, block_name, block_name_en, nav_links, assignment_description, title, title_en, description, description_en)
VALUES (
  'a8d86a15-0a62-49cc-b894-07eb530eb91a'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  4,
  1,
  'チュートリアル',
  'Tutorial',
  '["information"]'::jsonb,
  NULL,
  'MIDIキーボード接続方法',
  'How to Connect a MIDI Keyboard',
  $ja4$MIDIキーボード（電子ピアノ）をiPhoneに接続すると、より本格的な演奏練習が可能になります。ここではiPhoneとの接続方法を説明します。

■ Lightning端子のiPhoneの場合
Lightning端子のiPhoneでは、Apple純正の「Lightning - USBカメラアダプタ」が必要です。以下の順番で接続してください。

つまり：iPhone ― カメラアダプタ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード

■ USB Type-C端子のiPhoneやiPadの場合
Type-C端子のiPhoneでは、カメラアダプタなしで直接接続できる場合があります。

パターン1（Type-C → Type-Bケーブル）：
iPhone ― ケーブル（Type-C ↔ Type-B） ― MIDIキーボード

パターン2（Type-A → Type-Bケーブル）：
iPhone ― TypeCハブ ― ケーブル（Type-A ↔ Type-B） ― MIDIキーボード

お使いのMIDIキーボードの端子に合わせて、適切なケーブルを選んでください。

■ 接続のヒント
・MIDIキーボードの電源が入っていることを確認してください。
・接続すると、アプリが自動的にMIDIデバイスを検出します。
・うまく接続できない場合は、ケーブルを抜き差ししたり、アプリを再起動してみてください。

これでチュートリアルは完了です！「レッスンを完了」をタップして、ジャズの学習を始めましょう。$ja4$,
  $en4$Connecting a MIDI keyboard (digital piano) to your iPhone enables a more authentic practice experience. Here is how to set it up.

For iPhones with a Lightning Port
A Lightning to USB Camera Adapter (Apple genuine) is required. Connect in this order:

Summary: iPhone — Camera Adapter — Cable (Type-A ↔ Type-B) — MIDI Keyboard

For iPhones or iPads with a USB Type-C Port
With a Type-C iPhone, you may not need a camera adapter.

Option 1 (Type-C to Type-B cable):
iPhone — Cable (Type-C ↔ Type-B) — MIDI Keyboard

Option 2 (Type-A to Type-B cable):
iPhone — Type-C Hub — Cable (Type-A ↔ Type-B) — MIDI Keyboard

Choose the cable that matches the port on your MIDI keyboard.

Connection Tips
- Make sure your MIDI keyboard is powered on.
- The app will automatically detect the MIDI device once connected.
- If the connection does not work, try reconnecting the cable or restarting the app.

This concludes the tutorial! Tap "Complete lesson" to start learning jazz.$en4$
)
ON CONFLICT (id) DO NOTHING;

COMMIT;
