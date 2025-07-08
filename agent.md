仕様書（Ver. 0.1）

1. 目的

ジャズ学習向けリズムゲーム／レッスンプラットフォームの最小実用製品（MVP）を定義する。本仕様書は機能・画面・データ構造を明確化し、関係者間の認識を統一することを目的とする。

2. 用語定義

用語

説明

ゲスト

ログインせず「おためしプレイ」を行うユーザー

会員ランク

Free / Standard / Premium / Platinum の4階層

ステージ

本番モードの呼称。クリアで経験値 (XP) を獲得する

コース

レッスンを構成する単位。0個以上の動画と0個以上の曲を持つが、合計で1以上必須

チャレンジ

1週間限定のウィークリー課題

ミッション

1か月限定のマンスリー課題

3. 前提／対象外

フロントエンドは React(TypeScript)＋shadcn/ui。

バックエンドは Supabase（Postgres・Storage・Auth）。

決済（stripe.js）は今回のスコープ外（後日実装）。

音源再生・譜面表示ロジックは既存ゲームコンポーネントを利用。

4. ユースケース概要

ゲストはトップページから「おためしプレイ」を開始できる。

ユーザーはメールアドレスを入力し Magic Link で登録／ログイン。

初回ログイン時、利用規約・プライバシーポリシーに同意しニックネームを登録する。

ログイン後はトップページ（ダッシュボード）へ遷移。

ステージをクリアしてXPを獲得し、レベルとランキングに反映。

レッスン機能（Premium 以上）で学習を進める。

管理者はダッシュボードで曲・レッスン・チャレンジを登録し、会員ステータスを変更可能。

5. 機能要件

5.1 認証・アカウント管理

Magic Link 認証（Supabase Auth）

利用規約／プライバシーポリシー同意チェック

プロフィール編集（ニックネームのみ）

会員ランク表示（ヘッダー内モーダル）

5.2 ナビゲーション

ヘッダー

左: ロゴ／トップページボタン

右: ゲスト時→「会員登録」「ログイン」ボタン／ログイン時→「マイページ」「アカウント」モーダルボタン

5.3 ステージ（本番モード）

曲を選択してプレイ

XP 付与ロジック

会員倍率: Free×1, Standard×1.5, Premium & Platinum×2

再生速度倍率: 1.0→×1, 0.9→×0.9 …

スコアランク: S=1000, A=800, B=600, C=400, D=200, E=100

移調ボーナス: +30% (×1.3)

結果画面：合計XPと内訳、レベル変動を表示

5.4 レベル & ランキング

XP テーブル

Lv1‑10: 2,000 XP / Lv

Lv11‑50: 5,000 XP / Lv

Lv51‑∞: 20,000 XP / Lv

ランキング種別

全期間レベルランキング

シーズン（当月・前月）のチャレンジ／ミッションランキング

表示項目: ニックネーム | レベル | 会員ランク | クリア曲数／レッスン数

5.5 レッスン

階層: レッスン ▶ コース ▶ (動画|曲)

クリア条件（曲単位）

キー transposition ±n

再生速度 ≥ s

スコアランク ≥ R

楽譜表示設定

クリア回数 ≥ c

権限

Premium: 条件を満たせば順次解放

Platinum: スキップ可（要モーダル確認）

2倍XPボーナス（本番モードでのレッスン曲プレイ時）

5.6 チャレンジ & ミッション

週次・月次で管理者が自由に作成

進捗バー UI（クリア回数/必要回数）

達成報酬: 翌シーズン XP 1.3×

5.7 練習記録コミュニティ

1日1記事投稿（編集不可）

他ユーザーへの「いいね」・コメント

ユーザーページで過去日記一覧

5.8 管理画面

曲登録（JSON→DB化）

会員ランク変更

チャレンジ／ミッション／レッスン編集

UI: shadcn/ui + React‑Hook‑Form

6. 非機能要件

カテゴリ

要件

パフォーマンス

TTI ≤ 3 s / ページ、ゲーム中フレーム落ち <1%

セキュリティ

OWASP Top 10 を満たす、Auth ガード徹底、RLS で行レベル権限制御

アクセシビリティ

WCAG 2.1 AA 相当

スケーラビリティ

同時 1,000　CCU までスケールテスト

モニタリング

Supabase Logs + Sentry + Vercel/Netlify Analytics

7. 画面一覧 & 遷移概要

トップページ

おためしプレイ

ログイン／会員登録モーダル

同意＋ニックネーム登録

ダッシュボード（ステージ一覧／チャレンジ／ミッション）

マイページ（曲実績、レッスン、日記、ランキング）

管理画面（曲／レッスン／チャレンジ CRUD、会員管理）

8. データベース主要テーブル（論理）

テーブル

主なカラム

users

id (uuid, PK), email, created_at

profiles

user_id(PK), nickname, rank(enum), xp, level, subscription_plan

songs

id, title, artist, bpm, difficulty, is_free(bool)

song_settings

song_id, key_shift, min_speed, min_rank, score_mode

lessons

id, title, premium_only(bool), platinum_extra(text)

lesson_items

id, lesson_id, type(video

song), ref_id, order

challenges

id, type(weekly/monthly), start_at, end_at, title, description

challenge_tasks

id, challenge_id, song_id, conditions(jsonb), required_count

user_song_stats

user_id, song_id, best_rank, clear_count

xp_logs

id, user_id, source(enum), delta_xp, detail(jsonb), created_at

diaries

id, user_id, content, played_songs(jsonb), created_at

diary_likes

diary_id, user_id

diary_comments

id, diary_id, user_id, body, created_at

9. 外部サービス

Supabase Auth / Postgres / Storage

Vimeo（動画ホスティング）

Netlify（フロントエンドホスティング）

Sentry（エラー監視）

10. 未決事項 / 質問

フロントエンドは Next.js or Vite？

マーケティング用 LP とアプリ本体は同一リポジトリ？

公開予定時期とリソース体制（開発人数）

Stripe 決済導入タイミング（MVP後？）

Vimeo 以外の動画代替案は必要か？

実装計画書（ドラフト）

1. 体制案

役割

人数

主な担当

PM / PO

1

仕様策定・優先度管理

FE エンジニア

2

React UI・ゲーム統合

BE エンジニア

1

Supabase 設計・RLS

デザイナー

1

UI/UX・ロゴ

QA

0.5

テスト設計・E2E

2. 技術スタック

React(TypeScript)  + shadcn/ui + React‑Hook‑Form

ビルド: Vite または Next.js (未決)

状態管理: Zustand（軽量）

Supabase (Postgres / Auth / Storage / Edge Functions)

CI/CD: GitHub Actions → Netlify Preview → Production

3. 開発プロセス

GitHub Flow（main, feature/*, preview env）

2週間スプリント、Backlog は GitHub Projects

E2E: Playwright、ユニット: Vitest

4. マイルストーン & 工数（概算）

Phase

期間

主要アウトプット

0. 準備

1w

リポジトリ・CI/CD・Storybook 雛形

1. 認証基盤

1w

Magic Link + 同意 + ニックネーム登録完了

2. 曲データ移行

2w

JSON→DB、ゲームとの連携確認

3. ステージ & XP

1w

XP計算・結果画面・レベルUP演出

4. レッスン

2w

階層モデル・条件判定・2倍XP

5. チャレンジ/ミッション

1w

進捗バー・シーズンロジック

6. コミュニティ日記

1w

投稿・一覧・いいね・コメント

7. 管理画面

1w

曲/レッスン/チャレンジCRUD・ランク編集

8. QA & β公開

1w

テスト完了・バグ修正・MVPリリース

合計: 約10週間 (リスクバッファ含まず)

5. タスク分解（例: Phase 1）

Supabase プロジェクト作成

users / profiles テーブル & RLS

Magic Link フロー実装

同意モーダル + フォーム validation

エラーケース（リンク無効等）ハンドリング

6. テスト計画

ユースケース基準テスト + 画面単体テスト

XP 計算の境界値テスト

RLS ポリシー自動テスト

改ざん対策：クライアント→Edge Function で再計算

7. デプロイ & 運用

Netlify 分散 Preview 環境（PRごと）

Supabase ステージング／本番プロジェクト分割

Sentry + Supabase Logs で監視し PagerDuty へ連携