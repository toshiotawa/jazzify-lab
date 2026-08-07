# Jazzify Growth Loop

月20〜30万円 MRR 向けの週次改善ループ基盤。正本は Supabase、GA4 は入口の補助。

## クイックスタート

```bash
# 1. 環境変数（リポジトリルートの .env または export）
export SUPABASE_URL=https://xxx.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=xxx

# 2. 週次スナップショット（JSON を growth/data/ に保存）
node growth/snapshot.mjs

# 3. GA4（別途 jazzify-ga-report/.env に GA_PROPERTY_ID）
cd jazzify-ga-report && npm run ga:week

# 4. 導線 URL 一覧
node growth/print-acquisition-links.mjs
```

## ファイル

| ファイル | 用途 |
|---|---|
| `snapshot.mjs` | Supabase から KPI を1コマンド取得 |
| `funnel.sql` | 登録→着手→paywall→trial→有料（出所別） |
| `retention.sql` | 解約・失効・課金後30日の利用 |
| `experiments.csv` | 施策台帳 |
| `REVIEW.md` | 週次レビュー雛形 |
| `acquisition-links.yaml` | X / IG / YouTube / en-blog / App Store の UTM 正本 |
| `playbooks/` | チャネル別運用メモ |
| `data/` | 週次スナップショット（`YYYY-Www.json`） |

## 起点の実測値（2026-08-07 / 直近30日 48人）

| 指標 | 実測 | 目標 |
|---|---:|---:|
| トライアル開始率 | 8.3%（4/48） | 15% |
| paywall到達→checkoutクリック | 16%（4/25） | 40% |
| 帰属捕捉率 | 47.9%（23/48） | 直帰を除いた最大 |
| メール opt-in | 37.5%（18/48） | 50% |

## ループ

1. `node growth/snapshot.mjs` で数値取得
2. `REVIEW.md` に沿って損失最大の段を特定
3. 施策1つ実装 → `experiments.csv` に記録
4. 2週間後に `snapshot.mjs` で前後比較

エージェント手順: `.cursor/skills/growth-weekly-loop/SKILL.md`

## 計測修復（2026-08-07 実装）

- **帰属**: `attribution.ts` で referrer 推定 + signup 時マージ。iOS は `app_store/organic` を保存
- **Paywall**: `paywall_view` / `paywall_click` / `begin_checkout` + `checkout_click_source`（Supabase migration 適用済）
- **メール**: 登録デフォルト opt-in ON + `MarketingOptInBanner`（既存ユーザー回収）

トライアル導線の改善（メインクエスト第2章・`resume_modal` の訴求）は計測が溜まってから着手する。
