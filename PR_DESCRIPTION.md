# ギルド機能・検証用数値変更 PR

## 概要
検証のため、シーズンを時間単位化し、クエスト閾値・定員を一時的に小さく変更しました。

## 変更内容

### 0. 時間バケット化と一時的な数値変更
- シーズン（ランキング/クエスト）を月リセット → 1時間ごとリセット
- クエスト必要経験値を 1,000,000 → 1,000
- メンバー定員を 5 → 1

### 1. スキーマ更新（新規マイグレーション）
- `guild_xp_contributions` に `hour_bucket timestamptz` を追加、インデックス作成
- `on_xp_history_insert_guild_contribution` を上書きし `hour_bucket` へも書き込み
- ランキングRPCを時間バケット対応（引数に `target_hour timestamptz`）
- `rpc_guild_enforce_monthly_quest(p_hour timestamptz)` を定義し、直前1時間の総XPが1000未満なら解散
- 招待/申請/承認/受諾の定員チェックを 5 → 1 に変更

### 2. フロントエンドの追随
- ランキング画面を「今時間/前の時間」に変更
- ギルドページ・ダッシュボードの文言/プログレスを1,000基準に
- MVPなどの集計参照を `hour_bucket` に切り替え

## 追加・更新したファイル

### マイグレーション
- `supabase/migrations/20250904010007_hourly_season_and_limits.sql`（新規）
- `supabase/migrations/20250901090000_add_guild_type_column.sql`（既存内の`rpc_guild_create`定義の整合）

### フロントエンド
- `src/platform/supabaseGuilds.ts`（時間バケット対応、RPC引数の変更）
- `src/components/guild/GuildPage.tsx`（時間バケット対応、UI文言調整）
- `src/components/guild/GuildDashboard.tsx`（UI文言・進捗・MVPの単位変更、1時間ごとの強制実行キー）
- `src/components/guild/GuildHistory.tsx`（時間バケットでの参照に変更）
- `src/components/ranking/GuildRanking.tsx`（今時間/前時間の比較に変更）

## 動作確認ポイント
- ランキングが「今時間/前の時間」で表示されること
- ダッシュボードの進捗バーが 1000 を上限として動くこと
- チャレンジギルドで直前1時間の総XP < 1000 の場合に解散が動作すること
- 定員が 1 として、招待/申請/承認が正しく制御されること

## 注意
- 本PRは検証のための一時的な変更です。レビュー後、元の仕様へ戻す想定です。 