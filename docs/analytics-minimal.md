# マーケティング計測（最小構成）

Looker Studio / BigQuery / GCP / GA4日次自動取込は使わない。次の3つだけで週次レビューする。

| 役割 | ツール |
|---|---|
| Web LP・流入元 | **GA4**（管理画面 or ローカル CLI `jazzify-ga-report`） |
| 登録後ファネル（正本） | **Supabase**（`user_milestones` / 進捗 / 課金 + SQL） |
| iOS ダウンロード数 | **App Store Connect Analytics** |

エージェントに同じ調査を再実行させるときは `.cursor/skills/weekly-members-report/SKILL.md`。

---

## 0. 週次会員・導線レビュー（定型）

「ここ1週間の新規会員・有料・メインクエスト/課題クリア・端末・地域・MIDI・導線」をまとめて見るときの手順。

### 手順

1. **Supabase SQL**（1 SELECT ずつ）  
   - [`scripts/analytics/weekly_members_overview.sql`](../scripts/analytics/weekly_members_overview.sql) … 会員・有料・端末・地域・UTM・マイルストーン  
   - [`scripts/analytics/weekly_main_quest_assignments.sql`](../scripts/analytics/weekly_main_quest_assignments.sql) … 無料枠(block1)クリア・ペイウォール・MIDI  
   - 既存: [`weekly_funnel.sql`](../scripts/analytics/weekly_funnel.sql) など（UTM別マイルストーン）
2. **GA4 CLI**

```bash
cd jazzify-ga-report
npm run ga:week
```

3. **解釈の決めごと**  
   - 新規 = `auth.users.created_at`  
   - 有料の正本 = `subscriptions.status`（`profiles.rank` は参考）  
   - 無料メインクエスト = `block_number <= 1` のみ（`mainQuestFreeTier.ts`）。block 2+ は有料  
   - 無料枠クリア = block 1 内いずれか1課題完了 → 次はペイウォール到達率  
   - 課題クリア = `lesson_songs` 単位の `is_completed`  
   - MIDI / 開始ログは iOS で欠けることがある → 「不明」と明記
4. **成果物** … キャンバス（表・グラフ）+ 短い日本語サマリー

索引: [`scripts/analytics/README.md`](../scripts/analytics/README.md)

---

## 1. GA4（Web 入口）

### 必要な環境変数

- フロント: `VITE_GA_MEASUREMENT_ID`（Netlify / `.env`）
- Functions: `GA4_MEASUREMENT_ID`, `GA4_MP_API_SECRET`（購入イベントのサーバー送信・iOSプロキシ用）
- ローカル CLI: `jazzify-ga-report/.env` の `GA_PROPERTY_ID`（Jazzify・数字のプロパティ ID）
- 任意: 同 `.env` の `GA_PROPERTY_ID_JAZZPIANODAYS`（jazzpianodays.com 本体。英語サブドメインではない）

### 週次で見る場所

**A. CLI（推奨・再現可能）** — 週次会員レビューは **Jazzify のみ**

```bash
cd jazzify-ga-report
npm run ga:week         # 直近7日の日次・端末・国・イベント・流入・sign_up帰属
npm run ga:daily
npm run ga:acquisition  # 直近30日
npm run ga:events
```

Jazz Piano Days を単独で見るとき（週次には含めない）:

```bash
npm run ga:jpd:week
npm run ga:jpd:daily
```

**B. GA4 管理画面** → **レポート** → **エンゲージメント** → **イベント**

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

- `profiles` … `signup_platform`, `first_touch_*`, `ga_client_id`, `country`, `signup_device_*`
- `user_milestones` … `first_play_at`, `first_success_at`, `free_tier_wall_view_at`, `checkout_click_at`, `trial_start_at`, `paid_at`
- `subscriptions` / `subscription_events` … 課金
- `user_lesson_requirements_progress` … 課題クリア
- `user_assignment_starts` … 課題開始・MIDI

### 週次SQL

リポジトリ管理: [`scripts/analytics/`](../scripts/analytics/)

- 会員・導線全体: `weekly_members_overview.sql`
- メインクエスト課題: `weekly_main_quest_assignments.sql`
- UTM別マイルストーン: `weekly_funnel.sql`

Supabase SQL Editor または MCP `execute_sql` で実行。直近7日の新規登録者を対象にする。

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

会員レビューでは上記に加え、**メインクエスト課題クリア**と **UTM/SNS導線**も見る。

---

## 3. iOS ダウンロード数・キャンペーン（App Store Connect）

### 全体の DL 数

1. [App Store Connect](https://appstoreconnect.apple.com/) にログイン
2. **アプリ** → Jazzify → **アプリ分析**（Analytics）
3. **指標** で次を確認:
   - **初回ダウンロード数**（First Downloads）
   - **インプレッション**（App Store 上の表示）
   - **プロダクトページビュー**

### キャンペーン別 DL（パリィ → LP → App Store）

LP の App Store ボタンは、着地時の UTM（`first_touch`）から **App Store Campaign Link**（`ct` / 任意で `pt` / `mt=8`）を付与する。

| 経路 | 追えるもの | 追えないもの |
|---|---|---|
| パリィ（UTM付き）→ LP → **Web登録** | 個別ユーザーの `first_touch_*` | — |
| パリィ（UTM付き）→ LP → **App Store → iOS登録** | ASC のキャンペーン別 DL **集計** | 個別ユーザーへの紐づけ |
| SNS → App Store 直リンク | ASC 集計（投稿ごとに `ct` 付き URL を使う場合） | 個別ユーザーへの紐づけ |

**運用手順**

1. ASC → アプリ分析 → **キャンペーン** でプロバイダトークン（`pt`）を取得し、Netlify / `.env` に `VITE_APP_STORE_PROVIDER_TOKEN` を設定（任意だが推奨）
2. SNS 投稿の Jazzify リンクは必ず UTM 付きにする（例: `https://jazzify.jp/?utm_source=x&utm_campaign=parry01&utm_content=post1`）
3. ユーザーが LP から App Store を開くと `ct=x_parry01_post1` が付く → ASC キャンペーン別レポートで比較
4. App Store 直リンクを配る場合も同じ `ct` ルールで URL を作る（`src/utils/analytics/appStoreCampaignUrl.ts` の `buildAppStoreCampaignUrl`）

実装: `src/utils/analytics/appStoreCampaignUrl.ts`、`LpAppStoreButton`。

### 注意

- App Store の「ダウンロード」と Supabase の「登録」は別指標（DL → インストール → 起動 → 登録で漏斗が細る）
- Apple はインストール元（`ct`/`pt`）をアプリに渡さない。**個別ユーザーの DL 経路は DB に残らない**
- iOS ファネル（`first_open` 以降）は GA4 + `user_milestones` で見る。`first_open` はアプリ初回起動時に1回だけ送信
- iOS 登録時は `signup_platform=ios` に加え `signup_device_category` / `signup_os` を保存する（`first_touch_*` は Web 専用のまま）

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
（ローカルの `jazzify-ga-report` CLI による手動取得は最小構成に含める。）
