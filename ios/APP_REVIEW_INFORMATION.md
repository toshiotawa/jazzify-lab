# App Store 審査提出用文案（Jazzify iOS）

App Store Connect の **App Review Information** およびサブスクリプション審査メモへの貼り付け用です。  
実装との整合は [TopView.swift](Jazzify/Main/TopView.swift)、[MainTabView.swift](Jazzify/Main/MainTabView.swift)、[SettingsView.swift](Jazzify/Main/SettingsView.swift) 等に準拠しています。

---

## 1-A. App Review Information（英語・貼り付け用）

App Review Information — Jazzify (iOS)

### 1) Screen recordings (captured on a physical device)

We have attached screen recordings captured on a physical iPhone.  
To make review easier, the recordings are organized by review-critical flows instead of one long promotional video.

The attached recordings are labeled as follows:

**01_login_and_basic_gameplay**  
Shows:

- app launch
- login with the Apple Review account using email + password
- opening the Lessons tab
- opening the Tutorial course and starting lesson tasks that introduce each format (see below)
- gameplay using on-screen piano input
- **Tutorial Lesson 6:** vertically scrolling lesson task (rhythm-style)
- **Tutorial Lesson 7:** horizontal-scrolling lesson task (RPG-style)
- **Tutorial Lesson 8:** attack-gauge chord battle task
- the results screen (after each of Lessons 6–8 when gameplay is trimmed with jump cuts)

**Note:** In the Tutorial course, **Lessons 6–8** are dedicated introductions to the three lesson task types. **All three are shown in this recording** (not omitted). Reviewers can also read each lesson’s title and description in the Lessons list before starting play.

**02_microphone_input_test**  
Shows:

- starting microphone-supported gameplay
- the microphone permission prompt
- granting microphone access
- gameplay using microphone-based pitch detection
- live note judgment using microphone input
- a short completion flow / results screen

**03_midi_input_test**  
Shows:

- starting MIDI-supported gameplay
- gameplay using a connected MIDI device
- live note judgment reacting to MIDI input
- a short completion flow / results screen

**04_subscription_survival_and_account_delete**  
Shows:

- opening the subscription paywall from a premium entry point
- tapping “Subscribe to Premium”
- Apple’s In-App Purchase sheet appearing from the bottom of the screen
- opening the Survival tab and showing that Survival gameplay requires Premium
- opening Settings > Subscriptions
- the account deletion flow from Settings

Some recordings include brief jump cuts near the end of a session so the results screen can be shown without uploading unnecessarily long full-length performances.

**Important notes for review:**

- Normal users sign in with email + one-time password (OTP).
- The Apple Review account is configured to use email + password login only for App Review purposes.
- This exception exists only to make review faster and more reliable.

These recordings collectively demonstrate:

- app launch and successful login
- core gameplay with on-screen piano input
- microphone-based gameplay and permission usage
- MIDI-based gameplay with external hardware
- subscription paywall and Apple In-App Purchase flow
- Survival tab premium access behavior
- account deletion from Settings

### 2) Purpose of the app

Jazzify is a jazz learning app that helps users practice through interactive gameplay and real-time musical feedback.  
The app compares the user’s input against musical targets during play and provides scoring and feedback.  
Users can play with:

- on-screen piano keys
- microphone-based pitch detection
- a connected MIDI keyboard/device

The app is designed for learners who want structured, gamified practice and measurable progress.

### 3) Steps to review the main features

After signing in with the review account, please check the following flows.

**A. Top tab (Daily Challenge)**

1. Open the **Top** tab.
2. Daily Challenge is available from this tab.
3. Select **Super Beginner** (the free difficulty), then start play to review core gameplay.
4. Selecting a locked higher difficulty and tapping **Play** will present the subscription paywall.

**B. Lessons tab**

1. Open the Lessons tab.
2. Free users can access the Tutorial course.
3. Tapping any course other than Tutorial presents the subscription paywall.
4. Lesson content includes multiple task formats. In the **Tutorial** course, **Lessons 6–8** explain each type in the lesson list before play:
   - **Lesson 6:** vertically scrolling rhythm-style exercise
   - **Lesson 7:** horizontal-scrolling RPG-style exercise
   - **Lesson 8:** attack-gauge chord battle exercise (complete chords before the gauge fills)
5. Start a supported lesson and review gameplay with on-screen piano, microphone input, or MIDI input where available.
6. After completion, a results screen shows performance feedback.

**C. Survival tab**

1. Open the Survival tab.
2. Free users can view the tab, but Survival gameplay requires Premium.
3. Tapping the **Subscribe to Premium** button presents the subscription paywall.

**D. Microphone input**

1. Start a microphone-supported lesson or challenge.
2. Confirm the microphone permission prompt.
3. Allow microphone access.
4. Play and confirm that microphone-based pitch detection drives note judgment during gameplay.

**E. MIDI input**

1. Start a MIDI-supported lesson or challenge.
2. Confirm that a MIDI device is connected.
3. Play notes on the MIDI keyboard and confirm that note judgments react correctly.

**F. Subscription / paywall behavior**

The paywall can be opened from the following entry points for free users:

- tapping **“Unlock all features with Premium”** on the Top tab
- selecting a locked Daily Challenge difficulty and tapping **Play**
- tapping any Lessons course other than Tutorial
- tapping **“Subscribe to Premium”** in the Survival tab
- tapping **Subscriptions** in the Settings tab

When the paywall is shown, tapping **Subscribe to Premium** presents the Apple In-App Purchase sheet from the bottom of the screen.

After a user is already subscribed, opening **Settings > Subscriptions** shows the same subscription screen with text directing users to manage or cancel their subscription in **Settings > Apple ID > Subscriptions** on their device.

**G. Account deletion**

1. Open the Settings tab.
2. Tap **Delete Account** (or **Delete Account (close account)** where labeled).
3. Confirm the deletion flow.

**Note:** If an active subscription is still in effect, account deletion may be blocked until the subscription is cancelled in **Settings → Apple ID → Subscriptions** (or equivalent App Store subscription settings). The screen recording shows the flow using an account that is eligible for deletion (e.g. no active paid period remaining).

### 4) External services, tools, and platforms

The app uses the following external services for core functionality:

- Supabase: authentication, profile/progress data, and server-side processing
- Apple In-App Purchase (StoreKit): subscription handling
- CDN / static asset hosting: lesson and game assets

All purchases inside the app are handled exclusively through Apple’s In-App Purchase system.  
There are no external payment methods or links to external purchase flows inside the app.

### 5) Regional differences

The app functions consistently across regions.  
There are no region-locked features or region-exclusive content behaviors.  
The app supports both Japanese and English localization for the UI and lesson text.

### 6) Regulated industries

This app is not part of a strongly regulated industry.

**Microphone permission note**  
Microphone access is requested only when the user chooses microphone input for real-time pitch detection during gameplay.  
If microphone access is denied, users can still use on-screen piano input and/or MIDI input where supported.

---

## 1-B. App Review Information（日本語訳）

App Review Information — Jazzify (iOS)

### 1) 実機画面収録について

実機の iPhone で撮影した画面収録を添付しています。  
審査しやすいように、長い1本の宣伝動画ではなく、審査上重要なフローごとに分けています。

添付動画は以下の名前で整理しています。

**01_login_and_basic_gameplay**  
確認できる内容:

- アプリ起動
- Apple Review アカウントでの email + password ログイン
- Lessons タブを開く
- Tutorial コースを開き、各形式を説明するレッスン課題を開始する（下記）
- オンスクリーンピアノを使ったプレイ
- **チュートリアル レッスン6:** 縦スクロール課題（リズムゲーム型）
- **チュートリアル レッスン7:** 横スクロール課題（RPG 風）
- **チュートリアル レッスン8:** 攻撃ゲージ型のコード課題
- 各レッスン終了後の結果画面（プレイ部分はジャンプカットしてよい）

**補足:** Tutorial の **レッスン6〜8** は、それぞれ課題タイプ（ゲーム形式）の導入用です。**本収録では3つとも必ず含めます（省略しません）。** プレイ前に Lessons 一覧でタイトル・説明文を確認できます。

**02_microphone_input_test**  
確認できる内容:

- マイク対応プレイの開始
- マイク許可ダイアログ
- マイク許可
- マイクによるピッチ検出を使ったプレイ
- マイク入力によるリアルタイム判定
- 短い完了フロー / 結果画面

**03_midi_input_test**  
確認できる内容:

- MIDI 対応プレイの開始
- 接続された MIDI デバイスを使ったプレイ
- MIDI 入力に反応するリアルタイム判定
- 短い完了フロー / 結果画面

**04_subscription_survival_and_account_delete**  
確認できる内容:

- Premium 導線からサブスクリプション paywall を開く
- “Subscribe to Premium” をタップ
- Apple の In-App Purchase シートが画面下から表示される
- Survival タブを開き、Survival のプレイに Premium が必要であることを確認する
- Settings > Subscriptions を開く
- Settings からのアカウント削除フロー

一部の録画では、1〜2分かかる長い楽曲をそのまま全部見せる代わりに、結果画面まで確認できるよう、終盤に短いジャンプカットを入れています。

**審査上の重要な補足:**

- 通常ユーザーは email + one-time password (OTP) でサインインします。
- Apple Review アカウントのみ、App Review 用の例外として email + password ログインにしています。
- この例外設定は、審査を簡単かつ確実にするためだけのものです。

これらの録画を合わせることで、次を確認できます。

- アプリ起動と正常なログイン
- オンスクリーンピアノによるコアゲームプレイ
- マイク権限とマイク入力プレイ
- 外部ハードウェアとしての MIDI 入力プレイ
- サブスクリプション paywall と Apple IAP フロー
- Survival タブにおける Premium 必須の挙動
- Settings からのアカウント削除

### 2) アプリの目的

Jazzify は、インタラクティブなゲームプレイとリアルタイムの音楽フィードバックを通じてジャズを練習できる学習アプリです。  
プレイ中の入力を音楽上の目標と比較し、スコアやフィードバックを返します。  
ユーザーは以下の入力方法で演奏できます。

- オンスクリーンピアノ
- マイクによるピッチ検出
- 接続した MIDI キーボード / デバイス

構造化された練習と、進歩の可視化を求める学習者向けのアプリです。

### 3) 主な機能の確認手順

レビュー用アカウントでログイン後、以下を確認してください。

**A. トップタブ（Daily Challenge）**

1. **トップ**タブを開く
2. このタブから Daily Challenge に入る
3. **超初級（Super Beginner）**（無料でプレイできる難易度）を選び、コアゲームプレイを確認する
4. ロックされた上位難易度を選んで **プレイ** を押すと、サブスクリプション paywall が表示される

**B. Lessons タブ**

1. Lessons タブを開く
2. 無料ユーザーは Tutorial コースにアクセスできる
3. Tutorial 以外のコースをタップすると、サブスクリプション paywall が表示される
4. レッスンには複数の課題形式がある。**Tutorial** コースでは **レッスン6〜8** が一覧の説明とあわせて各形式を案内する。
   - **レッスン6:** 縦スクロールのリズムゲーム型課題
   - **レッスン7:** 横スクロール風 RPG 課題
   - **レッスン8:** 攻撃ゲージが貯まるまでにコードを完成させて攻撃する課題
5. 対応レッスンを開始し、オンスクリーンピアノ、マイク入力、MIDI 入力でのプレイを確認する
6. 終了後、結果画面でフィードバックを確認する

**C. Survival タブ**

1. Survival タブを開く
2. 無料ユーザーもタブ自体は見えるが、Survival のプレイには Premium が必要
3. **プレミアムに登録**（英語 UI では “Subscribe to Premium”）ボタンをタップすると、サブスクリプション paywall が表示される

**D. マイク入力**

1. マイク対応のレッスンまたはチャレンジを開始する
2. マイク許可ダイアログを確認する
3. 許可する
4. 実際に演奏し、マイクによるピッチ検出がノーツ判定に使われていることを確認する

**E. MIDI 入力**

1. MIDI 対応のレッスンまたはチャレンジを開始する
2. MIDI デバイスが接続されていることを確認する
3. MIDI キーボードを弾き、ノーツ判定が正しく反応することを確認する

**F. サブスクリプション / paywall の動作**

無料ユーザーに対して、paywall は以下の入口から表示されます。

- トップタブの **「プレミアムプランで全機能をアンロック」**（英語 UI では “Unlock all features with Premium”）をタップ
- Daily Challenge のロックされた上位難易度を選んで **プレイ** をタップ
- Lessons で Tutorial 以外のコースをタップ
- Survival タブで **プレミアムに登録** / “Subscribe to Premium” をタップ
- 設定タブで **サブスクリプション**（英語 UI では “Subscriptions”）をタップ

paywall が表示された後、**プレミアムに登録** / “Subscribe to Premium” をタップすると、Apple の In-App Purchase シートが画面下から表示されます。

すでに登録済みのユーザーが **設定 > サブスクリプション**（英語 UI では “Subscriptions”）を開いた場合も同じサブスクリプション画面が表示されますが、その中に **設定 > Apple ID > サブスクリプション** で管理 / 解約する案内文が表示されます。

**G. アカウント削除**

1. 設定タブを開く
2. **アカウント削除（退会）** / “Delete Account” をタップする
3. 削除確認フローを確認する

**補足:** 有効なサブスクリプションの契約期間が残っている場合、アカウント削除ができないことがあります。その場合は先に **設定 → Apple ID → サブスクリプション**（または App Store のサブスクリプション設定）から解約したうえで退会手続きを行ってください。画面収録では、削除手続きが可能なアカウント（例: 有料期間が残っていない状態）でフローを示しています。

### 4) 外部サービス・ツール・プラットフォーム

中核機能のために以下を利用しています。

- Supabase: 認証、プロフィール / 進捗データ、サーバー処理
- Apple In-App Purchase（StoreKit）: サブスクリプション処理
- CDN / 静的アセット配信: レッスンおよびゲーム用アセット

アプリ内課金はすべて Apple の In-App Purchase のみを使用しています。  
アプリ内に外部決済や外部課金導線はありません。

### 5) 地域差異

地域による機能差はありません。  
地域限定機能や地域限定コンテンツはありません。  
UI とレッスン内テキストは、日本語と英語の両方にローカライズされています。

### 6) 規制産業

このアプリは強く規制される業界には該当しません。

**マイク権限の補足**  
マイク権限は、ユーザーがマイク入力を選択したときに、リアルタイムのピッチ検出を行うために要求されます。  
拒否された場合でも、対応箇所ではオンスクリーンピアノや MIDI 入力を利用できます。

---

## 1-C. Subscription Review Notes（英語・貼り付け用）

サブスクリプション個別ページの審査メモ用です。

**Jazzify Premium — Review Notes**

**Subscription Name:**  
Jazzify Premium

**Duration / Pricing:**

- Monthly auto-renewing subscription
- Pricing follows the amount displayed on the App Store in the user’s region (including tax where shown); it may vary by country, currency, and Apple’s pricing tiers
- 7-day free trial for eligible new subscribers

**What Premium unlocks:**

- All Lessons courses beyond Tutorial
- Locked Daily Challenge difficulties above the free tier (**Super Beginner** is free; higher difficulties require Premium)
- Survival gameplay access
- Detailed statistics and progress tracking

**Free access:**

- Lessons: only the Tutorial course is free
- Daily Challenge: only **Super Beginner** (free difficulty) is available without Premium
- Survival: the tab is visible, but gameplay requires Premium

**How the paywall is opened:**

1. Top tab: tap **“Unlock all features with Premium”**
2. Top tab > Daily Challenge: select a locked higher difficulty than Super Beginner and tap **Play**
3. Lessons tab: tap any course other than Tutorial
4. Survival tab: tap **“Subscribe to Premium”**
5. Settings tab: tap **“Subscriptions”**

**Purchase flow:**  
When the paywall is shown, tapping **“Subscribe to Premium”** presents Apple’s In-App Purchase sheet from the bottom of the screen.

**Subscription management:**  
After a user is already subscribed, opening **Settings > Subscriptions** shows the same subscription screen, with text directing the user to manage or cancel the subscription in **Settings > Apple ID > Subscriptions** on the device.

**Account deletion note:**  
If a subscription is still active, account deletion in the app may be unavailable until the subscription is cancelled in **Settings → Apple ID → Subscriptions** (or App Store subscription settings).

**Payment / renewal:**

- All purchases inside the app are handled exclusively through Apple In-App Purchase
- No external payment methods or external purchase links are provided in the app
- Payment is charged to the user’s Apple ID after the free trial ends, if applicable
- The subscription renews automatically unless canceled at least 24 hours before the end of the current billing period

**Technical notes:**

- Product ID: `jp.jazzify.premium.monthly`
- The app uses StoreKit 2
- Apple server-to-server notifications are used to sync subscription status with the backend

**Terms of Service:**  
https://jazzify.jp/terms/ios

**Privacy Policy:**  
https://jazzify.jp/privacy/ios

---

## ブロック2｜画面収録用 動画台本（4本・ファイル名と1対1）

長い曲はフルで見せず、**数秒プレイ → 終盤へジャンプカット → 結果画面**で十分です。

### 01_login_and_basic_gameplay

**冒頭字幕:** Login and basic gameplay

**台本**

1. アプリを起動する
2. Apple Review アカウントで email + password を入力してログインする
3. Lessons タブを開く
4. Tutorial コースを開く
5. **チュートリアル レッスン6（縦スクロールの課題）**を開始する
6. オンスクリーンピアノで数秒プレイする
7. 判定が出る様子を見せる
8. 必要なら小さく **Gameplay trimmed for brevity** を表示する
9. 終盤へジャンプカットして結果画面を見せる
10. レッスン一覧に戻る
11. **チュートリアル レッスン7（横スクロールの課題）**を開始する
12. オンスクリーンピアノで数秒プレイする
13. 判定が出る様子を見せる
14. 必要なら **Gameplay trimmed for brevity** を表示する
15. 終盤へジャンプカットして結果画面を見せる
16. レッスン一覧に戻る
17. **チュートリアル レッスン8（攻撃ゲージのコード課題）**を開始する
18. オンスクリーンピアノで数秒プレイする
19. 判定が出る様子を見せる
20. 必要なら **Gameplay trimmed for brevity** を表示する
21. 終盤へジャンプカットして結果画面を見せる

**この動画が説明していること**

- app launch  
- review account login  
- Lessons tab  
- Tutorial course（**レッスン6・7・8をいずれも収録に含める**）  
- on-screen piano input  
- vertically scrolling lesson task（レッスン6）  
- horizontal-scrolling lesson task（レッスン7）  
- attack-gauge chord task（レッスン8）  
- results screen（各レッスンごと）  

---

### 02_microphone_input_test

**冒頭字幕:** Microphone input test

**台本**

1. TOP タブを開く
2. マイク対応の Daily Challenge または対応課題を開く
3. プレイ開始前の状態を1秒ほど見せる
4. マイク許可ダイアログを表示する
5. 許可する
6. 実際に音を入力し、ノーツ判定が反応する様子を見せる
7. 数秒プレイする
8. 必要なら **Gameplay trimmed for brevity** を表示する
9. 終盤へジャンプカットして結果画面を見せる

**この動画が説明していること**

- microphone-supported gameplay  
- microphone permission prompt  
- granting microphone access  
- gameplay using microphone-based pitch detection  
- live note judgment using microphone input  
- short completion flow / results screen  

---

### 03_midi_input_test

**冒頭字幕:** MIDI device test

**台本**

1. MIDI デバイス接続済みの状態から始める
2. Lessons または TOP の MIDI 対応課題を開く
3. 必要なら接続状態や入力ソースが分かる箇所を映す
4. プレイを開始する
5. MIDI キーボードを弾く
6. 画面上のノーツ判定が反応する様子を見せる
7. 数秒プレイする
8. 必要なら **Gameplay trimmed for brevity** を表示する
9. 終盤へジャンプカットして結果画面を見せる

**この動画が説明していること**

- MIDI-supported gameplay  
- connected MIDI device  
- live note judgment reacting to MIDI input  
- short completion flow / results screen  

---

### 04_subscription_survival_and_account_delete

**冒頭字幕:** Subscription, Survival access, and account deletion

**台本**

1. TOP タブを開く
2. **Unlock all features with Premium** をタップする（日本語 UI ならプレミアム導線の同等ボタン）
3. paywall を表示する
4. **Subscribe to Premium** をタップする
5. Apple の IAP シートが画面下から出ることを見せる
6. 購入せずに戻る
7. Survival タブを開く
8. Survival が Premium 必須であること、または **Subscribe to Premium** 導線を見せる
9. Settings タブを開く
10. **Subscriptions** をタップし、同じサブスクリプション画面が開くことを見せる
11. **Delete Account** をタップする
12. 削除確認フローを見せる

**この動画が説明していること**

- subscription paywall from a premium entry point  
- Subscribe to Premium button  
- Apple IAP sheet from the bottom  
- Survival tab premium access behavior  
- Settings > Subscriptions  
- account deletion flow  

---

## ブロック3｜App Store スクリーンショット文案（完成コピー）

1枚目は**実プレイ画面**を強く出す（ログイン画面・一覧だけ・雰囲気だけは弱い）。Apple も実使用画面を重視します。

### 1枚目｜Lessons の縦スクロール課題

**見せる内容:** 縦スクロールのノーツ、鍵盤、判定が同時に見える実プレイ画面（チュートリアル **レッスン6** と対応）

| | 日本語 | English |
|---|--------|---------|
| 見出し | ゲーム感覚でコードを覚える | Learn chords like a game |
| 補足 | 弾きながら自然に身につく | Play and make the basics stick |

### 2枚目｜Lessons の学習導線

**見せる内容:** Tutorial から先のコース構造や、段階的に進めることが分かるレッスン画面（**レッスン6〜8** で課題タイプが説明されていることが分かるとよい）

| | 日本語 | English |
|---|--------|---------|
| 見出し | 順番に学べるから迷わない | A clear path to progress |
| 補足 | 基礎から実践まで段階的に進める | Move from basics to real practice |

### 3枚目｜TOP の Daily Challenge

**見せる内容:** 攻撃ゲージが貯まるまでにコードを完成させて攻撃する課題。Daily Challenge であることが分かる画面（チュートリアル **レッスン8** と同系のゲージ型）

| | 日本語 | English |
|---|--------|---------|
| 見出し | 毎日の挑戦で実戦感覚を磨く | Sharpen skills with daily challenges |
| 補足 | 素早く反応してコードを組み立てる | React fast and build chords in time |

### 4枚目｜MIDI入力対応

**見せる内容:** MIDI 入力で判定しているプレイ画面。可能なら接続や入力ソースが分かる状態

| | 日本語 | English |
|---|--------|---------|
| 見出し | MIDIキーボードで本格練習 | Train with your MIDI keyboard |
| 補足 | 手と耳を使って実践的に学べる | Build your ear and hands through real play |

### 5枚目｜Survival モード

**見せる内容:** 敵から逃げながら攻撃し、一定時間生き残る 2D サバイバル画面

| | 日本語 | English |
|---|--------|---------|
| 見出し | 逃げて弾いて生き残る | Play, react, and survive |
| 補足 | 反応力とコード感覚を同時に鍛える | Train timing and chord reflexes together |
