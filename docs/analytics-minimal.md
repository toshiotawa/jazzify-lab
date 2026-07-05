# マーケティング計測（最小構成）

Looker Studio / BigQuery / GCP / GA4日次自動取込は使わない。次の3つだけで週次レビューする。

| 役割 | ツール |
|---|---|
| Web LP・流入元 | **GA4 管理画面** |
| 登録後ファネル（正本） | **Supabase `user_milestones` + SQL** |
| iOS ダウンロード数 | **App Store Connect Analytics** |

---

## 1. GA4（Web 入口）

### 必要な環境変数

- フロント: `VITE_GA_MEASUREMENT_ID`（Netlify / `.env`）
- Functions: `GA4_MEASUREMENT_ID`, `GA4_MP_API_SECRET`（購入イベントのサーバー送信・iOSプロキシ用）

### 週次で見る場所

GA4 管理画面 → **レポート** → **エンゲージメント** → **イベント**

主要イベント:

- `page_view`（LP）
- `sign_up_click` / `sign_up`
- `tutorial_begin` / `tutorial_complete`
- `begin_checkout`

探索レポートで `sessionSource` × イベント数を切ると、SNS投稿別の入口効率が分かる。UTM付きリンク運用と併用する（`docs/marketing-growth-review.md` 7章）。

### iOS からの GA4 送信

ネイティブは `gtag.js` を使えないため、Measurement Protocol を **Netlify Function 経由**で送る。

- エンドポイント: `https://jazzify.jp/.netlify/functions/iosAnalyticsEvent`
- 実装: `ios/Jazzify/Analytics/AnalyticsTracker.swift`
- `api_secret` はサーバー側のみ（iOSバイナリに含めない）

---

## 2. Supabase ファネル（登録後の正本）

### テーブル

- `profiles` … `signup_platform`, `first_touch_*`, `ga_client_id`
- `user_milestones` … `first_play_at`, `first_success_at`, `free_tier_wall_view_at`, `checkout_click_at`, `trial_start_at`, `paid_at`

### 週次SQL

リポジトリ管理: [`scripts/analytics/weekly_funnel.sql`](../scripts/analytics/weekly_funnel.sql)

Supabase SQL Editor で実行。直近7日の新規登録者を `utm_source` 別に集計する。

### プラットフォーム別（追加クエリ例）

```sql
SELECT
  coalesce(p.signup_platform, 'unknown') AS platform,
  count(*) AS signups,
  count(m.first_play_at) AS first_played,
  count(m.first_success_at) AS first_success,
  count(m.free_tier_wall_view_at) AS wall_reached,
  count(m.checkout_click_at) AS checkout_clicks,
  count(s.trial_used_at) AS trials,
  count(*) FILTER (
    WHERE s.entitlement_state = 'active' AND s.status <> 'trial'
  ) AS paid
FROM profiles p
LEFT JOIN user_milestones m ON m.user_id = p.id
LEFT JOIN subscriptions s ON s.user_id = p.id
WHERE p.created_at >= now() - interval '7 days'
GROUP BY 1
ORDER BY signups DESC;
```

### 週次で見る6指標

1. 登録数
2. 初回プレイ率（`first_play_at`）
3. **初回成功率**（`first_success_at`）← 最重要
4. ペイウォール到達数
5. トライアル開始率
6. 有料転換数

---

## 3. iOS ダウンロード数（App Store Connect）

コード変更なし。Apple が自動集計している。

### 手順

1. [App Store Connect](https://appstoreconnect.apple.com/) にログイン
2. **アプリ** → Jazzify → **アプリ分析**（Analytics）
3. **指標** で次を確認:
   - **初回ダウンロード数**（First Downloads）
   - **インプレッション**（App Store 上の表示）
   - **プロダクトページビュー**

### 注意

- App Store の「ダウンロード」と Supabase の「登録」は別指標（DL → インストール → 起動 → 登録で漏斗が細る）
- iOS ファネル（`first_open` 以降）は GA4 + `user_milestones` で見る。`first_open` はアプリ初回起動時に1回だけ送信

---

## 4. 広告（Google / X / Meta）を始めるとき

今回の最小構成には含めない。着手時に追加するもの:

- GA4 の key event 化（`sign_up`, `tutorial_complete`, `begin_checkout`）
- Google Ads / Meta / X のコンバージョンタグ連携
- iOS: `Info.plist` の SKAdNetwork（Firebase 不要）

詳細は `docs/marketing-growth-review.md` 7章・9章・P2タスクを参照。

---

## 5. あえてやらないもの（コスト・複雑さ削減）

- Looker Studio
- BigQuery エクスポート
- GCP プロジェクト
- GA4 Data API による Supabase 日次取込
- Firebase Analytics

データが SQL で回しきれなくなった段階で、BigQuery または GA4 取込を検討する。
